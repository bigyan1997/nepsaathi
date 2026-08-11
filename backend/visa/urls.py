from django.urls import path
from . import views

urlpatterns = [
    path('timelines/',          views.VisaTimelineListCreateView.as_view(), name='visa-timelines'),
    path('timelines/stats/',    views.VisaTimelineStatsView.as_view(),      name='visa-stats'),
    path('timelines/<int:pk>/', views.VisaTimelineDetailView.as_view(),     name='visa-timeline-detail'),
    path('whatsapp-groups/',    views.WhatsAppGroupListView.as_view(),       name='whatsapp-groups'),
]
