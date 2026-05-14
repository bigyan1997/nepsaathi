from django.urls import path
from . import views

app_name = 'listings'

urlpatterns = [
    # ── Static paths (must all come before <slug:slug>) ──────────────────────

    path('', views.ListingListView.as_view(), name='listing-list'),
    path('create/', views.ListingCreateView.as_view(), name='listing-create'),
    path('my-listings/', views.MyListingsView.as_view(), name='my-listings'),
    path('stats/', views.StatsView.as_view(), name='stats'),
    path('saved/', views.MySavedListingsView.as_view(), name='saved-listings'),
    path('search-suggestions/', views.SearchSuggestionsView.as_view(), name='search-suggestions'),
    path('search/', views.GlobalSearchView.as_view(), name='global-search'),
    path('saved-searches/', views.SavedSearchListView.as_view(), name='saved-search-list'),
    path('saved-searches/<int:pk>/', views.SavedSearchDetailView.as_view(), name='saved-search-detail'),
    path('sitemap/', views.SitemapDataView.as_view(), name='sitemap-data'),

    # ── Slug / PK dynamic paths ───────────────────────────────────────────────

    path('<slug:slug>/', views.ListingDetailView.as_view(), name='listing-detail'),
    path('<int:pk>/images/', views.ListingImageUploadView.as_view(), name='listing-images'),
    path('<int:pk>/save/', views.SaveListingView.as_view(), name='save-listing'),
    path('<int:pk>/report/', views.ReportListingView.as_view(), name='report-listing'),
    path('<int:pk>/status/', views.MarkListingStatusView.as_view(), name='listing-status'),
    path('<int:pk>/view/', views.TrackListingViewView.as_view(), name='track-view'),
    path('<int:pk>/similar/', views.SimilarListingsView.as_view(), name='similar-listings'),
    path('<int:pk>/renew/', views.RenewListingView.as_view(), name='renew-listing'),
]