from django.urls import path
from .views import AdminPanelStatsView

urlpatterns = [
    path('stats/', AdminPanelStatsView.as_view(), name='panel-stats'),
]
