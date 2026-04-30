from django.urls import path
from . import views

app_name = 'businesses'

urlpatterns = [
    # Browse all businesses
    path('', views.BusinessListView.as_view(), name='business-list'),

    # Register a new business
    path('create/', views.BusinessCreateView.as_view(), name='business-create'),

    # My businesses
    path('my-businesses/', views.MyBusinessesView.as_view(), name='my-businesses'),

    # View, edit or delete a single business
    path('<int:pk>/', views.BusinessDetailView.as_view(), name='business-detail'),

    # Reviews
    path('<int:pk>/reviews/', views.BusinessReviewListCreateView.as_view(), name='business-reviews'),
    path('<int:pk>/reviews/<int:review_pk>/', views.BusinessReviewDeleteView.as_view(), name='business-review-delete'),

    # Report
    path('<int:pk>/report/', views.ReportBusinessView.as_view(), name='business-report'),
]