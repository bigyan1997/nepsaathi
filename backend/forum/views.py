import threading
import requests as http_requests
from rest_framework import generics, permissions, filters, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from decouple import config
from .models import ForumPost, ForumReply, PollOption, PollVote
from .serializers import ForumPostListSerializer, ForumPostDetailSerializer, ForumReplySerializer

FRONTEND_URL = config('FRONTEND_URL', default='https://www.nepsaathi.com')
INDEXNOW_KEY = config('INDEXNOW_KEY', default='')


def _ping_indexnow(url):
    """Fire-and-forget IndexNow ping to Bing so new posts are indexed quickly."""
    if not INDEXNOW_KEY:
        return
    try:
        http_requests.post(
            "https://api.indexnow.org/indexnow",
            json={"host": "www.nepsaathi.com", "key": INDEXNOW_KEY, "urlList": [url]},
            timeout=5,
        )
    except Exception:
        pass


def ping_indexnow_async(slug):
    url = f"{FRONTEND_URL}/forum/{slug}"
    threading.Thread(target=_ping_indexnow, args=(url,), daemon=True).start()


class ForumPostListView(generics.ListCreateAPIView):
    """
    GET  /api/forum/  — list posts (anyone)
    POST /api/forum/  — create post (authenticated)

    Filters: ?category=visa&search=pr+visa
    """
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('category',)
    search_fields = ('title', 'body')
    ordering_fields = ('created_at', 'view_count')
    ordering = ('-is_pinned', '-created_at')

    def get_serializer_class(self):
        return ForumPostListSerializer

    def get_queryset(self):
        return ForumPost.objects.select_related('author').prefetch_related('upvotes', 'replies')

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_banned:
            raise ValidationError('Your account has been suspended.')
        post = serializer.save(author=user)
        # If poll options were provided, create them
        poll_options = self.request.data.get('poll_options', [])
        if isinstance(poll_options, list):
            valid = [o.strip() for o in poll_options if isinstance(o, str) and o.strip()]
            for i, text in enumerate(valid[:4]):
                PollOption.objects.create(post=post, text=text, order=i)
        ping_indexnow_async(post.slug)


class ForumPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/forum/<slug>/  — view post + replies (anyone)
    PATCH  /api/forum/<slug>/  — edit body (owner only)
    DELETE /api/forum/<slug>/  — delete (owner or admin)
    """
    serializer_class = ForumPostDetailSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    lookup_field = 'slug'

    def get_queryset(self):
        return ForumPost.objects.select_related('author').prefetch_related(
            'upvotes', 'replies__author', 'replies__upvotes'
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        ForumPost.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS:
            if obj.author != request.user and not request.user.is_staff:
                raise PermissionDenied('You do not own this post.')

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.is_banned:
            raise PermissionDenied('Your account has been suspended.')
        if instance.is_closed:
            raise PermissionDenied('This post is closed and cannot be edited.')
        allowed = {k: v for k, v in request.data.items() if k in ('body',)}
        serializer = self.get_serializer(instance, data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ForumPostVoteView(APIView):
    """
    POST /api/forum/<slug>/vote/  — toggle upvote on a post
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, slug):
        try:
            post = ForumPost.objects.get(slug=slug)
        except ForumPost.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if post.upvotes.filter(pk=user.pk).exists():
            post.upvotes.remove(user)
            return Response({'upvoted': False, 'upvote_count': post.upvote_count})
        else:
            post.upvotes.add(user)
            return Response({'upvoted': True, 'upvote_count': post.upvote_count})


class ForumReplyListView(generics.ListCreateAPIView):
    """
    GET  /api/forum/<slug>/replies/  — list replies (anyone)
    POST /api/forum/<slug>/replies/  — add reply (authenticated)
    """
    serializer_class = ForumReplySerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        return ForumReply.objects.filter(
            post__slug=self.kwargs['slug']
        ).select_related('author').prefetch_related('upvotes')

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_banned:
            raise ValidationError('Your account has been suspended.')
        try:
            post = ForumPost.objects.get(slug=self.kwargs['slug'])
        except ForumPost.DoesNotExist:
            raise ValidationError('Post not found.')
        if post.is_closed:
            raise ValidationError('This post is closed.')
        serializer.save(author=user, post=post)


class ForumReplyVoteView(APIView):
    """
    POST /api/forum/replies/<id>/vote/  — toggle upvote on a reply
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            reply = ForumReply.objects.get(pk=pk)
        except ForumReply.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if reply.upvotes.filter(pk=user.pk).exists():
            reply.upvotes.remove(user)
            return Response({'upvoted': False, 'upvote_count': reply.upvote_count})
        else:
            reply.upvotes.add(user)
            return Response({'upvoted': True, 'upvote_count': reply.upvote_count})


class ForumReplyDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/forum/replies/<id>/  — delete reply (owner or admin)
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return ForumReply.objects.select_related('author')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if obj.author != request.user and not request.user.is_staff:
            raise PermissionDenied('You do not own this reply.')


class ForumPollVoteView(APIView):
    """
    POST /api/forum/<slug>/poll-vote/  — cast or change vote on a poll option
    Body: { "option_id": <int> }
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, slug):
        try:
            post = ForumPost.objects.get(slug=slug)
        except ForumPost.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=404)

        option_id = request.data.get('option_id')
        try:
            option = PollOption.objects.get(pk=option_id, post=post)
        except PollOption.DoesNotExist:
            return Response({'detail': 'Invalid option.'}, status=400)

        # Remove any existing vote for this user on this post's options
        PollVote.objects.filter(option__post=post, voter=request.user).delete()
        PollVote.objects.create(option=option, voter=request.user)

        # Return updated vote counts for all options
        options = post.poll_options.prefetch_related('votes').all()
        total = sum(o.votes.count() for o in options)
        return Response({
            'voted_option_id': option.id,
            'total_votes': total,
            'options': [
                {'id': o.id, 'text': o.text, 'votes': o.votes.count()}
                for o in options
            ],
        })
