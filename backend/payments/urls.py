from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    path('webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    path('feature/<int:listing_id>/', views.CreateCheckoutSessionView.as_view(), name='create-checkout'),
    path('status/<int:listing_id>/', views.PaymentStatusView.as_view(), name='payment-status'),
]
