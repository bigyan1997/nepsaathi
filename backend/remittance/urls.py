from django.urls import path
from .views import RemittanceRateListView

urlpatterns = [
    path('rates/', RemittanceRateListView.as_view(), name='remittance-rates'),
]
