from django.urls import path
from . import views

app_name = 'jobs'

urlpatterns = [
    # Browse all active job listings
    path('', views.JobListView.as_view(), name='job-list'),

    # Create job details and attach to a listing
    path('create/', views.JobCreateView.as_view(), name='job-create'),

    # View, edit or delete a single job detail
    path('<int:pk>/', views.JobDetailView.as_view(), name='job-detail'),
]