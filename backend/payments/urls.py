from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    path('webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    path('feature/<int:listing_id>/', views.CreateCheckoutSessionView.as_view(), name='create-checkout'),
    path('feature-business/<int:business_id>/', views.CreateBusinessCheckoutSessionView.as_view(), name='create-business-checkout'),
    path('status/<int:listing_id>/', views.PaymentStatusView.as_view(), name='payment-status'),
    path('invoice/<int:listing_id>/', views.InvoicePDFView.as_view(), name='invoice-pdf'),
]
