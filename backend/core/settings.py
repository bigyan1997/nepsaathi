from pathlib import Path
from datetime import timedelta
from decouple import config
import os
import dj_database_url
import cloudinary

# ─── Base ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# ─── Apps ────────────────────────────────────────────────────────────────────
DJANGO_APPS = [
    'unfold',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'django.contrib.sitemaps',
    'django.contrib.postgres',
]

THIRD_PARTY_APPS = [
    'channels',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'rest_framework_simplejwt.token_blacklist',
    'cloudinary',
    'cloudinary_storage',
]

LOCAL_APPS = [
    'users',
    'listings',
    'jobs',
    'rooms',
    'events',
    'businesses',
    'announcements',
    'exchange',
    'messaging',
    'payments',
    'feedback',
    'panel',
    'forum',
    'remittance',
    'community',
    'visa',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

SITE_ID = 1

# ─── Middleware ───────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'core.middleware.AdminIPRestrictionMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'core.urls'

# ─── Templates ───────────────────────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# ─── Database ────────────────────────────────────────────────────────────────
DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600, conn_health_checks=True)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DATABASE_NAME', default='nepsaathi'),
            'USER': config('DATABASE_USER', default='postgres'),
            'PASSWORD': config('DATABASE_PASSWORD', default=''),
            'HOST': config('DATABASE_HOST', default='localhost'),
            'PORT': config('DATABASE_PORT', default='5432'),
        }
    }

# ─── Custom user model ───────────────────────────────────────────────────────
AUTH_USER_MODEL = 'users.User'

# ─── Authentication backends ─────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# ─── Password validators ─────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

ACCOUNT_ADAPTER = 'users.adapter.CustomAccountAdapter'
SOCIALACCOUNT_ADAPTER = 'users.adapter.CustomSocialAccountAdapter'

# ─── REST Framework ──────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.authentication.SilentJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '2000/day' if not DEBUG else '10000/day',
        'user': '2000/hour' if not DEBUG else '10000/day',
        'listing_create': '10/hour',
        'business_create': '3/hour',
        'login': '5/minute' if not DEBUG else '1000/day',
        'register': '3/minute' if not DEBUG else '1000/day',
        'password_reset': '3/hour' if not DEBUG else '1000/day',
        'message_send': '5/minute' if not DEBUG else '1000/day',
        'saved_search_create': '20/day' if not DEBUG else '1000/day',
        'contact': '5/hour' if not DEBUG else '1000/day',
        'newsletter': '5/hour' if not DEBUG else '1000/day',
        'og_preview': '120/minute' if not DEBUG else '10000/day',
        'payment_status': '30/minute' if not DEBUG else '1000/day',
        'listing_view': '60/minute' if not DEBUG else '1000/day',
        'ai_improve': '20/day' if not DEBUG else '1000/day',
        'ai_suggest_tags': '30/day' if not DEBUG else '1000/day',
        'forum_post': '20/hour' if not DEBUG else '1000/day',
        'forum_reply': '30/hour' if not DEBUG else '1000/day',
        'unread_count': '30/minute' if not DEBUG else '1000/day',
        'review_create': '5/day' if not DEBUG else '1000/day',
    },
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# ─── JWT ─────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ─── dj-rest-auth ────────────────────────────────────────────────────────────
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'nepsaathi-auth',
    'JWT_AUTH_REFRESH_COOKIE': 'nepsaathi-refresh',
    'JWT_AUTH_RETURN_EXPIRATION': True,
    'JWT_AUTH_HTTPONLY': True,   # Refresh cookie is httpOnly; access token still returned in body for in-memory use
    'JWT_AUTH_SAMESITE': 'None',   # cross-domain: frontend (Vercel) → backend (Railway)
    'JWT_AUTH_SECURE': True,       # SameSite=None requires Secure=True
    'REGISTER_SERIALIZER': 'users.serializers.RegisterSerializer',
    'PASSWORD_RESET_SERIALIZER': 'users.serializers.PasswordResetSerializer',
    'USER_DETAILS_SERIALIZER': 'users.serializers.UserSerializer',
}

# ─── Allauth ─────────────────────────────────────────────────────────────────
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = config('EMAIL_VERIFICATION', default='none' if DEBUG else 'mandatory')
ACCOUNT_EMAIL_CONFIRMATION_EXPIRE_DAYS = 300 / 86400  # 5 minutes (in fractional days)
ACCOUNT_USER_MODEL_USERNAME_FIELD = None

# ─── Google OAuth ─────────────────────────────────────────────────────────────
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': config('GOOGLE_CLIENT_ID', default=''),
            'secret': config('GOOGLE_CLIENT_SECRET', default=''),
            'key': '',
        },
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'OAUTH_PKCE_ENABLED': True,
        'FETCH_USERINFO': True,
    }
}

SOCIALACCOUNT_EMAIL_AUTHENTICATION = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True

# ─── CORS ────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
CORS_ALLOW_CREDENTIALS = True

# ─── Internationalisation ────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Australia/Sydney'
USE_I18N = True
USE_TZ = True

# ─── Static & Media ──────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─── Default primary key ─────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── Email ───────────────────────────────────────────────────────────────────
DEFAULT_FROM_EMAIL = 'NepSaathi <noreply@nepsaathi.com>'
ACCOUNT_EMAIL_SUBJECT_PREFIX = '[NepSaathi] '
ACCOUNT_PREVENT_ENUMERATION = True

EMAIL_BACKEND = (
    'django.core.mail.backends.console.EmailBackend' if DEBUG
    else 'django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST          = config('EMAIL_HOST', default='smtp.zoho.com.au')
EMAIL_PORT          = config('EMAIL_PORT', default=465, cast=int)
EMAIL_USE_SSL       = config('EMAIL_USE_SSL', default=True, cast=bool)
EMAIL_USE_TLS       = config('EMAIL_USE_TLS', default=False, cast=bool)
if EMAIL_USE_SSL and EMAIL_USE_TLS:
    EMAIL_USE_TLS = False  # SSL and TLS are mutually exclusive for SMTP; both True causes a connection failure
EMAIL_HOST_USER     = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_TIMEOUT       = 10

    # Resend API (used in production instead of SMTP)
RESEND_API_KEY = config('RESEND_API_KEY', default='')

# ─── Web Push (VAPID) ────────────────────────────────────────────────────────
VAPID_PRIVATE_KEY = config('VAPID_PRIVATE_KEY', default='')
VAPID_PUBLIC_KEY = config('VAPID_PUBLIC_KEY', default='')
VAPID_ADMIN_EMAIL = config('VAPID_ADMIN_EMAIL', default='noreply@nepsaathi.com')

# ─── Firebase Cloud Messaging (Android push) ─────────────────────────────────
FIREBASE_SERVICE_ACCOUNT_JSON = config('FIREBASE_SERVICE_ACCOUNT_JSON', default='')

# ─── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')
STRIPE_FEATURED_PRICE_CENTS = config('STRIPE_FEATURED_PRICE_CENTS', default=999, cast=int)  # $9.99 AUD

# ─── Frontend URL ─────────────────────────────────────────────────────────────
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
BACKEND_URL = config('BACKEND_URL', default='http://localhost:8000')

# ─── Cache ────────────────────────────────────────────────────────────────────
REDIS_URL = config('REDIS_URL', default=None)

if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'socket_connect_timeout': 5,
                'socket_timeout': 5,
                'retry_on_timeout': True,
            },
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'nepsaathi-cache',
        }
    }

# ─── Channel Layers (WebSocket) ───────────────────────────────────────────────
if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [REDIS_URL],
                "capacity": 1500,       # max messages queued per channel
                "expiry": 60,           # drop stale messages after 60s
            },
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }

# ─── Cloudinary ───────────────────────────────────────────────────────────────
cloudinary.config(
    cloud_name=config('CLOUDINARY_CLOUD_NAME', default=''),
    api_key=config('CLOUDINARY_API_KEY', default=''),
    api_secret=config('CLOUDINARY_API_SECRET', default=''),
    secure=True,
)

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# ─── Security headers ─────────────────────────────────────────────────────────
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin-allow-popups'

if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_PRELOAD = True
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# ─── CSRF ─────────────────────────────────────────────────────────────────────
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:5173',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# ─── Admin Site Customization ───────────────────────────────────────────────────────────────
ADMIN_SITE_HEADER = "NepSaathi Admin"
ADMIN_SITE_TITLE = "NepSaathi Admin Portal"
ADMIN_INDEX_TITLE = "NepSaathi Administration"

# ─── Unfold Admin ─────────────────────────────────────────────────────────────
UNFOLD = {
    "SITE_TITLE": "NepSaathi",
    "SITE_HEADER": "NepSaathi Admin",
    "SITE_SUBHEADER": "Community Platform",
    "SITE_SYMBOL": "home",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "DASHBOARD_CALLBACK": "core.admin_dashboard.dashboard_callback",
    "COLORS": {
        "primary": {
            "50":  "255 247 237",
            "100": "255 237 213",
            "200": "254 215 170",
            "300": "253 186 116",
            "400": "251 146 60",
            "500": "249 115 22",
            "600": "234 119 34",
            "700": "194 65 12",
            "800": "154 52 18",
            "900": "124 45 18",
            "950": "67 20 7",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Listings",
                "collapsible": True,
                "items": [
                    {"title": "Listings", "icon": "list", "link": "/nepsaathi-biggy/listings/listing/"},
                    {"title": "Jobs", "icon": "work", "link": "/nepsaathi-biggy/jobs/job/"},
                    {"title": "Rooms", "icon": "home", "link": "/nepsaathi-biggy/rooms/room/"},
                    {"title": "Events", "icon": "event", "link": "/nepsaathi-biggy/events/event/"},
                    {"title": "Notices", "icon": "campaign", "link": "/nepsaathi-biggy/announcements/announcement/"},
                    {"title": "Businesses", "icon": "store", "link": "/nepsaathi-biggy/businesses/business/"},
                    {"title": "Saved Searches", "icon": "manage_search", "link": "/nepsaathi-biggy/listings/savedsearch/"},
                ],
            },
            {
                "title": "Community",
                "collapsible": True,
                "items": [
                    {"title": "Forum", "icon": "forum", "link": "/nepsaathi-biggy/forum/forumpost/"},
                    {"title": "Community Services", "icon": "handshake", "link": "/nepsaathi-biggy/community/servicelisting/"},
                    {"title": "WhatsApp Groups", "icon": "chat", "link": "/nepsaathi-biggy/visa/whatsappgroup/"},
                    {"title": "Listing Reports", "icon": "flag", "link": "/nepsaathi-biggy/listings/listingreport/"},
                    {"title": "Business Reports", "icon": "report", "link": "/nepsaathi-biggy/businesses/businessreport/"},
                ],
            },
            {
                "title": "Users",
                "collapsible": True,
                "items": [
                    {"title": "Users", "icon": "people", "link": "/nepsaathi-biggy/users/user/"},
                    {"title": "Messages", "icon": "message", "link": "/nepsaathi-biggy/messaging/conversation/"},
                    {"title": "Payments", "icon": "payments", "link": "/nepsaathi-biggy/payments/featuredpayment/"},
                    {"title": "Feedback", "icon": "rate_review", "link": "/nepsaathi-biggy/feedback/feedbackresponse/"},
                    {"title": "Newsletter", "icon": "mail", "link": "/nepsaathi-biggy/feedback/newslettersubscriber/"},
                    {"title": "Point Events", "icon": "star", "link": "/nepsaathi-biggy/users/pointevent/"},
                    {"title": "Push Subscriptions", "icon": "notifications", "link": "/nepsaathi-biggy/users/pushsubscription/"},
                    {"title": "User Reviews", "icon": "thumb_up", "link": "/nepsaathi-biggy/users/userreview/"},
                ],
            },
            {
                "title": "Data",
                "collapsible": True,
                "items": [
                    {"title": "Remittance Rates", "icon": "currency_exchange", "link": "/nepsaathi-biggy/remittance/remittancerate/"},
                    {"title": "Visa / Invitations", "icon": "flight", "link": "/nepsaathi-biggy/visa/occupationinvitation/"},
                    {"title": "Visa Timelines", "icon": "timeline", "link": "/nepsaathi-biggy/visa/visatimeline/"},
                    {"title": "Occupations", "icon": "badge", "link": "/nepsaathi-biggy/visa/occupation/"},
                    {"title": "Invitation Rounds", "icon": "calendar_month", "link": "/nepsaathi-biggy/visa/invitationround/"},
                ],
            },
            {
                "title": "System",
                "collapsible": True,
                "items": [
                    {"title": "Auth Tokens", "icon": "key", "link": "/nepsaathi-biggy/authtoken/tokenproxy/"},
                    {"title": "Blacklisted Tokens", "icon": "block", "link": "/nepsaathi-biggy/token_blacklist/blacklistedtoken/"},
                    {"title": "Outstanding Tokens", "icon": "pending", "link": "/nepsaathi-biggy/token_blacklist/outstandingtoken/"},
                    {"title": "Auth Groups", "icon": "group", "link": "/nepsaathi-biggy/auth/group/"},
                    {"title": "Sites", "icon": "language", "link": "/nepsaathi-biggy/sites/site/"},
                ],
            },
        ],
    },
}

# ─── Sentry ──────────────────────────────────────────────────────────────────
SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), RedisIntegration()],
        traces_sample_rate=0.1,   # capture 10% of requests for performance tracing
        send_default_pii=False,   # never send user PII (emails, IPs) to Sentry
        environment='production' if not DEBUG else 'development',
    )


