from django.urls import path
from . import views

app_name = 'events'

urlpatterns = [
    path('', views.EventListView.as_view(), name='event-list'),
    path('create/', views.EventCreateView.as_view(), name='event-create'),
    path('listing/<int:listing_id>/', views.EventDetailByListingView.as_view(), name='event-detail-by-listing'),
    path('<int:pk>/', views.EventDetailView.as_view(), name='event-detail'),
]