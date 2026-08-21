from django.urls import path
from .views import FeedbackView, NewsletterSubscribeView

urlpatterns = [
    path('', FeedbackView.as_view()),
    path('newsletter/subscribe/', NewsletterSubscribeView.as_view()),
]
