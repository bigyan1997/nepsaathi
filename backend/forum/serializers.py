from rest_framework import serializers
from .models import ForumPost, ForumReply, PollOption, PollVote


class PollOptionSerializer(serializers.ModelSerializer):
    votes = serializers.SerializerMethodField()
    user_voted = serializers.SerializerMethodField()

    def get_votes(self, obj):
        return obj.votes.count()

    def get_user_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(voter=request.user).exists()
        return False

    class Meta:
        model = PollOption
        fields = ('id', 'text', 'order', 'votes', 'user_voted')


class ForumAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    avatar = serializers.URLField(allow_null=True)
    is_verified = serializers.BooleanField()


class ForumReplySerializer(serializers.ModelSerializer):
    author = ForumAuthorSerializer(read_only=True)
    upvote_count = serializers.ReadOnlyField()
    has_upvoted = serializers.SerializerMethodField()

    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(pk=request.user.pk).exists()
        return False

    class Meta:
        model = ForumReply
        fields = ('id', 'post', 'author', 'body', 'upvote_count', 'has_upvoted', 'created_at', 'updated_at')
        # post is set via perform_create — must be read_only or DRF demands it in the request body
        read_only_fields = ('id', 'post', 'author', 'upvote_count', 'has_upvoted', 'created_at', 'updated_at')


class ForumPostListSerializer(serializers.ModelSerializer):
    author = ForumAuthorSerializer(read_only=True)
    upvote_count = serializers.ReadOnlyField()
    reply_count = serializers.ReadOnlyField()
    has_upvoted = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    poll_options = PollOptionSerializer(many=True, read_only=True)
    is_poll = serializers.SerializerMethodField()
    total_votes = serializers.SerializerMethodField()

    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(pk=request.user.pk).exists()
        return False

    def get_is_poll(self, obj):
        return obj.poll_options.exists()

    def get_total_votes(self, obj):
        return PollVote.objects.filter(option__post=obj).count()

    class Meta:
        model = ForumPost
        fields = (
            'id', 'slug', 'category', 'category_display', 'title', 'body',
            'author', 'upvote_count', 'reply_count', 'has_upvoted',
            'is_pinned', 'is_closed', 'view_count', 'created_at',
            'is_poll', 'poll_options', 'total_votes',
        )
        read_only_fields = (
            'id', 'slug', 'category_display', 'author',
            'upvote_count', 'reply_count', 'has_upvoted',
            'is_pinned', 'is_closed', 'view_count', 'created_at',
            'is_poll', 'poll_options', 'total_votes',
        )


class ForumPostDetailSerializer(ForumPostListSerializer):
    replies = ForumReplySerializer(many=True, read_only=True)

    class Meta(ForumPostListSerializer.Meta):
        fields = ForumPostListSerializer.Meta.fields + ('replies', 'updated_at')
        read_only_fields = ForumPostListSerializer.Meta.read_only_fields + ('replies', 'updated_at')
