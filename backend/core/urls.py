"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from decouple import config

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

urlpatterns = [
    # Admin panel
    path('nepsaathi-admin/', admin.site.urls),

    # Redirect root to frontend
    path('', lambda request: HttpResponseRedirect(FRONTEND_URL)),

    # Auth — login, logout, password change
    path('api/auth/', include('dj_rest_auth.urls')),

    # Auth — register new user
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),

    # Auth — Google OAuth
    path('api/auth/social/', include('allauth.socialaccount.urls')),

    # Allauth required internally
    path('accounts/', include('allauth.urls')),

    # Users — profile
    path('api/users/', include('users.urls')),

    # Listings
    path('api/listings/', include('listings.urls')),

    # Jobs
    path('api/jobs/', include('jobs.urls')),

    # Rooms
    path('api/rooms/', include('rooms.urls')),

    # Announcements
    path('api/announcements/', include('announcements.urls')),

    # Events
    path('api/events/', include('events.urls')),

    # Businesses
    path('api/businesses/', include('businesses.urls')),

    # Exchange Rates
    path('api/exchange/', include('exchange.urls')),
]

# Only serve media files locally — Cloudinary handles production
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

