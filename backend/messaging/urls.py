from django.urls import path
from . import views

app_name = 'messaging'

urlpatterns = [
    path('suggest-replies/', views.SuggestRepliesView.as_view(), name='suggest-replies'),
    path('', views.ConversationListView.as_view(), name='conversation-list'),
    path('unread-count/', views.UnreadCountView.as_view(), name='unread-count'),
    path('<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('<int:pk>/send/', views.MessageSendView.as_view(), name='message-send'),
]
