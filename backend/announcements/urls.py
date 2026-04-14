from django.urls import path
from . import views

app_name = 'announcements'

urlpatterns = [
    # Browse all active announcements
    path('', views.AnnouncementListView.as_view(), name='announcement-list'),

    # Create announcement details
    path('create/', views.AnnouncementCreateView.as_view(), name='announcement-create'),

    # Fetch by listing ID — used after creating
    path('listing/<int:listing_id>/', views.AnnouncementDetailByListingView.as_view(), name='announcement-detail-by-listing'),

    # View, edit or delete single announcement
    path('<int:pk>/', views.AnnouncementDetailView.as_view(), name='announcement-detail'),
]