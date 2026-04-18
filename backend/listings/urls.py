from django.urls import path
from . import views

app_name = 'listings'

urlpatterns = [
    # ── Static paths first (must be before <int:pk>) ──────────────────────────

    # Browse all active listings
    path('', views.ListingListView.as_view(), name='listing-list'),

    # Create a new listing
    path('create/', views.ListingCreateView.as_view(), name='listing-create'),

    # My listings
    path('my-listings/', views.MyListingsView.as_view(), name='my-listings'),

    # Stats
    path('stats/', views.StatsView.as_view(), name='stats'),

    # Saved listings list
    path('saved/', views.MySavedListingsView.as_view(), name='saved-listings'),

    # ── Dynamic paths (with <int:pk>) ─────────────────────────────────────────

    # View, edit or delete a single listing
    path('<int:pk>/', views.ListingDetailView.as_view(), name='listing-detail'),

    # Upload images to a listing
    path('<int:pk>/images/', views.ListingImageUploadView.as_view(), name='listing-images'),

    # Save/unsave a listing
    path('<int:pk>/save/', views.SaveListingView.as_view(), name='save-listing'),

    # Report a listing
    path('<int:pk>/report/', views.ReportListingView.as_view(), name='report-listing'),

    # Filled Status
    path('<int:pk>/status/', views.MarkListingStatusView.as_view(), name='listing-status'),

    # Listing View
    path('<int:pk>/view/', views.TrackListingViewView.as_view(), name='track-view'),

    # Show similar Listing
    path('<int:pk>/similar/', views.SimilarListingsView.as_view(), name='similar-listings'),

    # Search Suggestions
    path('search-suggestions/', views.SearchSuggestionsView.as_view(), name='search-suggestions'),

    # Global Search
    path('search/', views.GlobalSearchView.as_view(), name='global-search'),
]