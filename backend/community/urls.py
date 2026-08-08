from django.urls import path
from . import views

urlpatterns = [
    path('requests/',            views.ReverseRequestListCreateView.as_view(), name='requests-list'),
    path('requests/<int:pk>/',   views.ReverseRequestDeleteView.as_view(),     name='requests-delete'),
    path('services/',            views.ServiceListingListCreateView.as_view(), name='services-list'),
    path('services/<int:pk>/',   views.ServiceListingDeleteView.as_view(),     name='services-delete'),
]
