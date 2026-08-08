from django.urls import path
from . import views

app_name = 'forum'

urlpatterns = [
    path('ai-improve/', views.AIImproveForumPostView.as_view(), name='ai-improve'),
    path('', views.ForumPostListView.as_view(), name='post-list'),
    path('replies/<int:pk>/', views.ForumReplyDeleteView.as_view(), name='reply-delete'),
    path('replies/<int:pk>/vote/', views.ForumReplyVoteView.as_view(), name='reply-vote'),
    path('<slug:slug>/', views.ForumPostDetailView.as_view(), name='post-detail'),
    path('<slug:slug>/vote/', views.ForumPostVoteView.as_view(), name='post-vote'),
    path('<slug:slug>/replies/', views.ForumReplyListView.as_view(), name='reply-list'),
    path('<slug:slug>/poll-vote/', views.ForumPollVoteView.as_view(), name='poll-vote'),
]
