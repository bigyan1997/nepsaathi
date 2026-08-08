from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),

     # Google OAuth
    path('auth/google/', views.GoogleLoginView.as_view(), name='google-login'),

    # Logout
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),

    # Delete Account
    path('delete-account/', views.DeleteAccountView.as_view(), name='delete-account'),

    # Contact
    path('contact/', views.ContactView.as_view(), name='contact'),

    # Push notifications
    path('push/subscribe/', views.PushSubscribeView.as_view(), name='push-subscribe'),
    path('push/test/', views.PushTestView.as_view(), name='push-test'),

    # Public user profile
    path('<int:id>/public/', views.PublicProfileView.as_view(), name='public-profile'),

    # Points & referral
    path('points/', views.MyPointsView.as_view(), name='my-points'),

    # User reviews
    path('<int:id>/reviews/', views.UserReviewListCreateView.as_view(), name='user-reviews'),
    path('<int:id>/reviews/<int:review_id>/', views.UserReviewDeleteView.as_view(), name='user-review-delete'),
]