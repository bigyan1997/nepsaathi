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
]