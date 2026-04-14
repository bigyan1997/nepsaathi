from django.urls import path
from . import views
from . import serializers

app_name = 'rooms'

urlpatterns = [
    # Browse all active room listings
    path('', views.RoomListView.as_view(), name='room-list'),

    # Create room details and attach to a listing
    path('create/', views.RoomCreateView.as_view(), name='room-create'),

    path('listing/<int:listing_id>/', views.RoomDetailByListingView.as_view(), name='room-detail-by-listing'),

    # View, edit or delete a single room detail
    path('<int:pk>/', views.RoomDetailView.as_view(), name='room-detail'),
]