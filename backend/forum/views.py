import threading
from django.db import transaction
from rest_framework import generics, permissions, filters, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import ForumPost, ForumReply, PollOption, PollVote
from .serializers import ForumPostListSerializer, ForumPostDetailSerializer, ForumReplySerializer
from core.indexnow import ping_indexnow

import logging
from rest_framework.throttling import ScopedRateThrottle

logger = logging.getLogger(__name__)


def ping_indexnow_async(slug):
    ping_indexnow(f"/forum/{slug}")


class ForumPostListView(generics.ListCreateAPIView):
    """
    GET  /api/forum/  — list posts (anyone)
    POST /api/forum/  — create post (authenticated)

    Filters: ?category=visa&search=pr+visa
    """
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    throttle_scope = 'forum_post'

    def get_throttles(self):
        if self.request.method == 'POST':
            from rest_framework.throttling import ScopedRateThrottle
            return [ScopedRateThrottle()]
        return super().get_throttles()
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('category',)
    search_fields = ('title', 'body')
    ordering_fields = ('created_at', 'view_count')
    ordering = ('-is_pinned', '-created_at')

    def get_serializer_class(self):
        return ForumPostListSerializer

    def get_queryset(self):
        return ForumPost.objects.select_related('author').prefetch_related('upvotes', 'poll_options', 'poll_options__votes')

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_banned:
            raise ValidationError('Your account has been suspended.')
        poll_options = self.request.data.get('poll_options', [])
        valid_options = []
        if isinstance(poll_options, list):
            valid_options = [o.strip() for o in poll_options if isinstance(o, str) and o.strip()][:4]
        with transaction.atomic():
            post = serializer.save(author=user)
            for i, text in enumerate(valid_options):
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
            'upvotes', 'replies__author', 'replies__upvotes',
            'poll_options', 'poll_options__votes'
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        from django.db.models import F
        ForumPost.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
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
        if request.user.is_banned:
            return Response({'detail': 'Your account has been suspended.'}, status=403)
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
    throttle_scope = 'forum_reply'

    def get_throttles(self):
        if self.request.method == 'POST':
            from rest_framework.throttling import ScopedRateThrottle
            return [ScopedRateThrottle()]
        return super().get_throttles()

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
        if request.user.is_banned:
            return Response({'detail': 'Your account has been suspended.'}, status=403)
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
        if getattr(request.user, 'is_banned', False):
            return Response({'detail': 'Your account has been suspended.'}, status=403)

        try:
            post = ForumPost.objects.get(slug=slug)
        except ForumPost.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=404)

        try:
            option_id = int(request.data.get('option_id'))
        except (TypeError, ValueError):
            return Response({'detail': 'option_id must be an integer.'}, status=400)
        try:
            option = PollOption.objects.get(pk=option_id, post=post)
        except PollOption.DoesNotExist:
            return Response({'detail': 'Invalid option.'}, status=400)

        # Remove any existing vote and cast new one atomically
        with transaction.atomic():
            PollVote.objects.filter(option__post=post, voter=request.user).select_for_update().delete()
            PollVote.objects.create(option=option, voter=request.user)

        # Return updated vote counts for all options
        options = list(post.poll_options.prefetch_related('votes').all())
        option_counts = [{'id': o.id, 'text': o.text, 'votes': len(o.votes.all())} for o in options]
        return Response({
            'voted_option_id': option.id,
            'total_votes': sum(o['votes'] for o in option_counts),
            'options': option_counts,
        })


class AIImproveForumPostView(APIView):
    """POST /api/forum/ai-improve/ — rewrites a forum post body using Llama 3 via Groq."""
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'ai_improve'

    def post(self, request):
        import groq as groq_sdk

        title = (request.data.get('title') or '').strip()
        category = (request.data.get('category') or 'general').strip()
        body = (request.data.get('body') or '').strip()

        if not body or len(body) < 10:
            return Response({'error': 'Please write at least a few words first.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(body) > 5000:
            return Response({'error': 'Post body is too long (max 5000 characters).'}, status=status.HTTP_400_BAD_REQUEST)

        import re as _re_fi
        def _sanitize_fi(text, max_len):
            return _re_fi.sub(r'<[^>]{0,200}>', '', text)[:max_len]

        title = _sanitize_fi(title, 200)
        category = _sanitize_fi(category, 50)
        body = _sanitize_fi(body, 5000)

        from decouple import config
        api_key = config('GROQ_API_KEY', default='')
        if not api_key:
            return Response({'error': 'AI service not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        prompt = f"""You are helping a Nepalese Australian write a clear forum post on NepSaathi, a community platform.

<post_context>
Category: {category}
Title: {title}
</post_context>

<user_draft>
{body}
</user_draft>

Rewrite the post body to be clear, friendly, and easy to read. Fix grammar and spelling. Keep all the facts and questions the user wrote. Do not add new information or change the meaning. Keep it natural and conversational. Return only the improved post body — no preamble, no explanation."""

        try:
            client = groq_sdk.Groq(api_key=api_key)
            chat = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}],
            )
            improved = chat.choices[0].message.content.strip()
            return Response({'improved': improved})
        except groq_sdk.APIError as e:
            logger.error("Groq API error in forum ai-improve: %s", e)
            return Response({'error': 'AI service temporarily unavailable.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
