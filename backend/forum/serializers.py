from rest_framework import serializers
from .models import ForumPost, ForumReply


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
        read_only_fields = ('id', 'author', 'upvote_count', 'has_upvoted', 'created_at', 'updated_at')


class ForumPostListSerializer(serializers.ModelSerializer):
    author = ForumAuthorSerializer(read_only=True)
    upvote_count = serializers.ReadOnlyField()
    reply_count = serializers.ReadOnlyField()
    has_upvoted = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(pk=request.user.pk).exists()
        return False

    class Meta:
        model = ForumPost
        fields = (
            'id', 'slug', 'category', 'category_display', 'title',
            'author', 'upvote_count', 'reply_count', 'has_upvoted',
            'is_pinned', 'is_closed', 'view_count', 'created_at',
        )


class ForumPostDetailSerializer(ForumPostListSerializer):
    replies = ForumReplySerializer(many=True, read_only=True)

    class Meta(ForumPostListSerializer.Meta):
        fields = ForumPostListSerializer.Meta.fields + ('body', 'replies', 'updated_at')
