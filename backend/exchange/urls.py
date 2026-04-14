from django.urls import path
from . import views

app_name = 'exchange'

urlpatterns = [
    path('', views.ExchangeRateView.as_view(), name='exchange-rates'),
]