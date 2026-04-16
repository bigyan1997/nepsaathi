from django.urls import path
from . import views

app_name = 'listings'

urlpatterns = [
    # Browse all active listings
    path('', views.ListingListView.as_view(), name='listing-list'),

    # Create a new listing (must be logged in)
    path('create/', views.ListingCreateView.as_view(), name='listing-create'),

    # View, edit or delete a single listing
    path('<int:pk>/', views.ListingDetailView.as_view(), name='listing-detail'),

    # My listings (must be logged in)
    path('my-listings/', views.MyListingsView.as_view(), name='my-listings'),

    # Upload images to a listing
    path('<int:pk>/images/', views.ListingImageUploadView.as_view(), name='listing-images'),

    # Stats
    path('stats/', views.StatsView.as_view(), name='stats'),

    # Saved listings
    path('saved/', views.MySavedListingsView.as_view(), name='saved-listings'),
    path('<int:pk>/save/', views.SaveListingView.as_view(), name='save-listing'),

    # Report listing
    path('<int:pk>/report/', views.ReportListingView.as_view(), name='report-listing'),
]