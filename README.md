# NepSaathi — नेपसाथी

> Your trusted Nepali friend, wherever you are. Connecting the Nepalese diaspora across Australia.

NepSaathi is a full-stack community marketplace and networking platform for Nepalese Australians. It provides job listings, room rentals, events, a business directory, community notices, 1-to-1 messaging, featured listing payments, a community forum with polls, a reverse request board, a skills & services marketplace, a points & referral system, an AUD→NPR remittance comparator, and a bilingual Nepali/English interface. Progressive Web App (PWA) with push notifications. New listings are automatically posted to the NepSaathi Facebook Page and Instagram via n8n automation (self-hosted on Railway).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Backend](#backend)
   - [Django Apps](#django-apps)
   - [Database Models](#database-models)
   - [API Endpoints](#api-endpoints)
   - [Authentication & Security](#authentication--security)
   - [Email](#email)
   - [Payments (Stripe)](#payments-stripe)
   - [Push Notifications](#push-notifications)
   - [Google Sheets Feedback Sync](#google-sheets-feedback-sync)
   - [Exchange Rates](#exchange-rates)
   - [Deployment (Railway)](#deployment-railway)
4. [Frontend](#frontend)
   - [Pages & Routes](#pages--routes)
   - [State Management](#state-management)
   - [API Client](#api-client)
   - [Custom Hooks](#custom-hooks)
   - [PWA](#pwa)
   - [Deployment (Vercel)](#deployment-vercel)
5. [Environment Variables](#environment-variables)
6. [Local Development](#local-development)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Django 6.0.4 + Django REST Framework 3.17.1 |
| Language | Python 3.12.3 |
| Database | PostgreSQL 13+ |
| File storage | Cloudinary CDN |
| Cache | Redis (optional — falls back to in-memory) |
| Payments | Stripe Checkout |
| Auth | JWT (SimpleJWT) + Google OAuth (django-allauth) |
| Email | Resend API (production) / Zoho SMTP (local) |
| PDF generation | fpdf2 2.8.7 |
| Push notifications | pywebpush + VAPID |
| Frontend framework | React 19.2.4 + Vite 8.0.4 |
| Styling | Tailwind CSS v4.2 |
| Client state | Zustand 5.0.12 |
| Server state | TanStack React Query 5.99.0 |
| HTTP client | Axios 1.15.0 |
| Routing | React Router DOM 7.14.0 |
| Backend hosting | Railway.app (gunicorn, 5 workers) |
| Frontend hosting | Vercel (SPA rewrite) |

---

## Project Structure

```
nepsaathi/
├── backend/               # Django project root
│   ├── core/              # Settings, URLs, WSGI, authentication, emails
│   ├── users/             # Custom user model, profiles, push subscriptions, points & referrals, user reviews
│   ├── listings/          # Base listing model (jobs/rooms/events/notices)
│   ├── jobs/              # Job-specific detail model
│   ├── rooms/             # Room rental detail model
│   ├── events/            # Event detail model + RSVP
│   ├── announcements/     # Notices/classifieds detail model
│   ├── businesses/        # Standalone business directory
│   ├── exchange/          # Live AUD/GBP/USD/CAD → NPR rates
│   ├── messaging/         # 1-to-1 conversations
│   ├── payments/          # Stripe featured listing payments + PDF invoices
│   ├── feedback/          # Exit-intent survey → Google Sheets
│   ├── forum/             # Community board — posts, replies, upvotes, polls
│   ├── remittance/        # AUD→NPR rate comparator (cron-fetched)
│   ├── community/         # Reverse request board + skills & services marketplace
│   ├── requirements.txt
│   ├── manage.py
│   ├── start.sh           # Collectstatic + migrate + gunicorn
│   ├── cron.sh            # Management commands run by Railway cron service
│   ├── Procfile
│   └── railway.json
└── frontend/              # React + Vite app
    ├── src/
    │   ├── api/           # API client functions (15 modules)
    │   ├── store/         # Zustand stores (authStore, languageStore)
    │   ├── hooks/         # Custom React hooks (7, including useT)
    │   ├── i18n/          # translations.js — 80+ key bilingual dictionary (en + np)
    │   ├── components/    # ~55 reusable components (LangToggle, StarPicker, etc.)
    │   ├── pages/         # 40+ page-level components
    │   └── utils/         # axios.js (interceptors)
    ├── public/            # manifest.json, sw.js, icons, sitemap.xml (generated at build)
    ├── generate-sitemap.mjs  # Build-time sitemap generator (fetches slugs from API)
    ├── package.json
    ├── vite.config.js
    └── vercel.json
```

---

## Backend

### Django Apps

| App | Purpose |
|-----|---------|
| `users` | Custom email-based user model, profiles, avatar, push subscriptions, contact form, points & referral system, user reviews |
| `listings` | Base `Listing` model — polymorphic parent for jobs/rooms/events/notices; images, saves, reports, views, search |
| `jobs` | Job-specific details (company, salary, job_type, is_urgent) |
| `rooms` | Room rental details (price/week, furnishing, bond, amenities) |
| `events` | Event details (date, venue, RSVP, ticketing) |
| `announcements` | Notices/classifieds (category, price, condition) |
| `businesses` | Standalone business profiles — not linked to Listing; own images, reviews, reports lifecycle, booking link |
| `exchange` | Live AUD/GBP/USD/CAD → NPR exchange rates (1-hour cache, external API) |
| `messaging` | 1-to-1 conversations tied to listings |
| `payments` | Stripe Checkout for featured listings ($9.99 AUD / 7 days) + GST invoice PDF |
| `feedback` | Exit-intent satisfaction survey + Google Sheets sync |
| `panel` | Superuser-only admin dashboard stats (`/api/panel/stats/`) |
| `forum` | Community discussion board — posts, replies, upvotes, categories, polls |
| `remittance` | AUD→NPR rate comparator — Wise, Remitly, WorldRemit, Western Union; cron-fetched, public API |
| `community` | Reverse Request Board (ReverseRequest) + Skills & Services Marketplace (ServiceListing) |
| `core` | Settings, root URLs, `SilentJWTAuthentication`, dual email routing |

### Database Models

#### User (`users/models.py`)

Custom `AbstractUser` with `email` as the unique identifier (no username field).

| Field | Type | Notes |
|-------|------|-------|
| `email` | EmailField | Unique, primary identifier |
| `first_name`, `last_name` | CharField | |
| `avatar` | URLField | Custom uploaded photo |
| `google_avatar` | URLField | Auto-populated from Google OAuth |
| `phone` | CharField | Optional |
| `location` | CharField | City/suburb |
| `bio` | TextField | |
| `is_verified` | BooleanField | Admin-set verified badge |
| `is_banned` | BooleanField | With `ban_reason` |
| `points` | PositiveIntegerField | Default 0; incremented atomically via `award_points()` |
| `referral_code` | CharField (12) | Unique, auto-generated via `secrets.token_urlsafe` on first save |
| `referred_by` | FK → User | Nullable; set at registration from `?ref=<code>` |
| `created_at`, `updated_at` | DateTimeField | |

`award_points(delta, event_type, description)` — uses `models.F('points') + delta` + `save(update_fields=['points'])` for atomic increment; creates a `PointEvent` record.

`PointEvent` — tracks each point transaction:

| Field | Type | Notes |
|-------|------|-------|
| `user` | FK → User | |
| `event_type` | CharField | `signup`, `post_ad`, `referral`, `profile_complete` |
| `delta` | IntegerField | Points awarded |
| `description` | CharField | Human-readable label |
| `created_at` | DateTimeField | |

`UserReview` — star ratings between users:

| Field | Type | Notes |
|-------|------|-------|
| `reviewer` | FK → User | Who wrote the review |
| `reviewee` | FK → User | Who was reviewed |
| `rating` | IntegerField | 1–5 stars |
| `comment` | TextField | Max 500 chars |
| `created_at` | DateTimeField | |

unique_together: `(reviewer, reviewee)`. Users cannot review themselves.

`PushSubscription` — one user can have multiple:

| Field | Type |
|-------|------|
| `user` | FK → User |
| `endpoint` | URLField (unique) |
| `p256dh`, `auth` | Web Push keys |

JWT config: 60-minute access token, 7-day refresh token (rotated + blacklisted after use).

---

#### Listing (`listings/models.py`)

Base model for all community content.

| Field | Type | Notes |
|-------|------|-------|
| `user` | FK → User | Poster |
| `listing_type` | choice | `job`, `room`, `event`, `notice` |
| `title`, `description` | CharField/TextField | |
| `location`, `state` | CharField | Australian states: NSW/VIC/QLD/WA/SA/TAS/ACT/NT |
| `status` | choice | `active`, `expired`, `filled`, `deleted` (soft delete) |
| `contact_email`, `contact_phone`, `contact_whatsapp` | CharField | |
| `is_featured` | BooleanField | Set by Stripe webhook |
| `is_under_review` | BooleanField | Admin moderation flag |
| `is_wanted` | BooleanField | "Looking for" watchlist marker |
| `renewal_blocked` | BooleanField | |
| `slug` | SlugField | Auto-generated from title + id |
| `expires_at` | DateTimeField | 30 days from creation |
| `created_at`, `updated_at` | DateTimeField | |

Related models:
- `ListingImage` — Cloudinary-stored, with `is_primary` flag
- `SavedListing` — bookmarks (unique per user + listing)
- `ListingReport` — spam/fake/inappropriate/scam/wrong_category/other
- `ListingView` — unique view tracking by user or IP
- `SavedSearch` — stores filter criteria for email alerts

---

#### Job (`jobs/models.py`)

`OneToOneField → Listing` (related_name: `job_detail`)

| Field | Type | Notes |
|-------|------|-------|
| `company_name` | CharField | |
| `job_type` | choice | full_time, part_time, casual, contract, internship, volunteer |
| `salary` | DecimalField | |
| `salary_type` | choice | hourly, weekly, monthly, yearly, negotiable |
| `experience_required`, `qualifications` | TextField | |
| `is_urgent` | BooleanField | |

Property `salary_display`: formatted string e.g. `$23.50/hr`.

---

#### Room (`rooms/models.py`)

`OneToOneField → Listing`

| Field | Type | Notes |
|-------|------|-------|
| `room_type` | choice | private, shared, entire, studio |
| `price` | DecimalField | Weekly AUD |
| `furnishing` | choice | furnished, partial, unfurnished |
| `bond` | choice | 2_weeks, 4_weeks, 6_weeks, negotiable |
| `bills_included` | BooleanField | |
| `available_from` | DateField | |
| `bedrooms`, `bathrooms`, `max_occupants` | IntegerField | |
| `nepalese_household` | BooleanField | |
| `pets_allowed`, `parking_available` | BooleanField | |

---

#### Event (`events/models.py`)

`OneToOneField → Listing`

| Field | Type | Notes |
|-------|------|-------|
| `category` | choice | cultural, sports, food, music, religious, community, education, other |
| `event_date`, `event_end_date` | DateTimeField | |
| `venue`, `organiser` | CharField | |
| `is_free` | BooleanField | |
| `ticket_price` | DecimalField | Nullable |
| `max_attendees` | IntegerField | Nullable |
| `is_online` | BooleanField | |
| `event_url` | URLField | |

Related: `EventRSVP` — M2M between Event and User, tracks attendance.
Properties: `is_upcoming`, `rsvp_count`, `spots_left`.

---

#### Announcement / Notice (`announcements/models.py`)

`OneToOneField → Listing`

| Field | Type | Notes |
|-------|------|-------|
| `category` | choice | news, sale, service, general, lost_found, education |
| `price` | DecimalField | Nullable |
| `condition` | choice | new, like_new, good, fair, poor, na |
| `is_free`, `is_urgent` | BooleanField | |

---

#### Business (`businesses/models.py`)

Standalone — **not** linked to `Listing`. Own lifecycle.

| Field | Type | Notes |
|-------|------|-------|
| `owner` | FK → User | |
| `business_name`, `description` | CharField/TextField | |
| `category` | choice | restaurant, grocery, travel, beauty, health, legal, education, religious, construction, transport, finance, freelancer, retail, other |
| `is_nepalese_owned` | BooleanField | |
| `address`, `suburb`, `state`, `postcode` | CharField | |
| `phone`, `whatsapp`, `email`, `website` | CharField | |
| `abn` | CharField | Stored, not publicly displayed |
| `established_year` | IntegerField | |
| `operating_hours` | TextField | |
| `is_verified`, `is_active` | BooleanField | |
| `booking_link` | URLField | Optional. Shown as a "Book Now" button on the detail page. |
| `slug` | SlugField | |

Related: `BusinessImage`, `BusinessReport`, `BusinessReview` (1–5 stars, with comment).

---

#### FeaturedPayment (`payments/models.py`)

| Field | Type | Notes |
|-------|------|-------|
| `listing` | FK → Listing | Nullable (if listing deleted) |
| `user` | FK → User | Nullable |
| `stripe_session_id` | CharField | Unique |
| `amount_paid` | IntegerField | Cents (AUD) |
| `duration_days` | IntegerField | Default: 7 |
| `status` | choice | pending, completed, failed, expired |
| `created_at`, `completed_at` | DateTimeField | |

---

#### Conversation + Message (`messaging/models.py`)

`Conversation`:
- `participants` — M2M with User (exactly 2)
- `listing_id`, `listing_title`, `listing_type` — cached from listing at creation
- `created_at`, `updated_at`

`Message`:
- `conversation` FK, `sender` FK
- `content` — max 2000 characters
- `is_read` BooleanField
- `created_at`

---

#### FeedbackResponse (`feedback/models.py`)

| Field | Type | Notes |
|-------|------|-------|
| `satisfaction` | IntegerField | 1–5 |
| `reason` | choice | not_enough_listings, hard_to_navigate, just_browsing, missing_feature, technical_issue, other |
| `page_url` | URLField | Page where the survey was triggered |
| `user` | FK → User | Nullable (anonymous allowed) |
| `created_at` | DateTimeField | |

Submissions are synced to a Google Sheet via `feedback/sheets.py` (background thread, `gspread` library).

---

#### Forum (`forum/models.py`)

`ForumPost`:
- `author` FK, `category` (visa/accommodation/jobs/events/business/general), `title`, `body` (5000), `slug` (unique), `is_pinned`, `is_closed`, `upvotes` M2M User, `view_count`

`ForumReply`:
- `post` FK, `author` FK, `body` (2000), `upvotes` M2M User

`PollOption`:
- `post` FK, `text` (200). Created by passing `poll_options: [...]` in the post create payload.

`PollVote`:
- `poll_option` FK, `user` FK. One vote per user per post (enforced in view). Changing vote replaces the previous one.

---

#### Community (`community/models.py`)

`ReverseRequest`:

| Field | Type | Notes |
|-------|------|-------|
| `user` | FK → User | Poster |
| `title` | CharField (200) | |
| `body` | TextField (2000) | |
| `category` | choice | job, room, services, other |
| `state` | CharField (50) | Optional AU state |
| `budget` | CharField (100) | Optional |
| `is_active` | BooleanField | Soft-delete flag |
| `created_at` | DateTimeField | |

`ServiceListing`:

| Field | Type | Notes |
|-------|------|-------|
| `user` | FK → User | Provider |
| `title` | CharField (200) | |
| `category` | choice | tutoring, translation, it, photography, cooking, accounting, transport, cleaning, other |
| `description` | TextField (2000) | |
| `rate` | CharField (100) | Optional (e.g. `$40/hr`) |
| `rate_type` | choice | hourly, fixed, negotiable |
| `location` | CharField (100) | Optional suburb/city |
| `state` | CharField (50) | Optional AU state |
| `is_active` | BooleanField | Soft-delete flag |
| `created_at` | DateTimeField | |

Both serializers expose `poster_name`/`poster_id` (ReverseRequest) and `provider_name`/`provider_id` (ServiceListing) via `SerializerMethodField`.

---

### API Endpoints

All endpoints are prefixed with `/api/`.

#### Auth & Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login/` | No | Email + password login |
| POST | `/api/auth/registration/` | No | Register new account |
| POST | `/api/auth/logout/` | Yes | Blacklist refresh token |
| POST | `/api/auth/token/refresh/` | No | Refresh access token |
| POST | `/api/auth/password/reset/` | No | Send password reset email |
| POST | `/api/auth/password/change/` | Yes | Change password |
| GET | `/api/auth/user/` | Yes | Current user info |
| POST | `/api/users/auth/google/` | No | Google OAuth callback |
| GET/PATCH | `/api/users/profile/` | Yes | View/update profile |
| DELETE | `/api/users/delete-account/` | Yes | Delete account |
| POST | `/api/users/contact/` | No | Contact form submission |
| POST | `/api/users/push/subscribe/` | Yes | Register push subscription |
| DELETE | `/api/users/push/subscribe/` | Yes | Remove push subscription |
| GET | `/api/users/<id>/public/` | No | Public profile (name, avatar, listing count — no email/phone) |
| GET | `/api/panel/stats/` | Superuser | Admin dashboard stats |

Rate limits: login 5/min · register 3/min · password reset 3/hr · contact 5/hr

#### Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/listings/` | No | All active listings (filterable by type/state) |
| POST | `/api/listings/create/` | Yes | Step 1: create base listing |
| GET | `/api/listings/my-listings/` | Yes | User's own listings |
| GET | `/api/listings/stats/` | No | Site-wide listing counts |
| GET | `/api/listings/search/` | No | Full-text search (`?q=&state=`) |
| GET | `/api/listings/search-suggestions/` | No | Autocomplete (`?q=`) |
| GET/PATCH/DELETE | `/api/listings/<slug>/` | No/Owner | Detail / edit / delete |
| POST | `/api/listings/<id>/images/` | Owner | Upload images (multipart) |
| POST/DELETE/GET | `/api/listings/<id>/save/` | Yes | Bookmark / unbookmark |
| GET | `/api/listings/saved/` | Yes | User's saved listings |
| PATCH | `/api/listings/<id>/status/` | Owner | Mark filled/expired/deleted |
| POST | `/api/listings/<id>/view/` | No | Track view |
| GET | `/api/listings/<id>/similar/` | No | Similar listings |
| POST | `/api/listings/<id>/report/` | Yes | Report listing |
| POST | `/api/listings/<id>/renew/` | Owner | Renew expired listing |
| GET/POST | `/api/listings/saved-searches/` | Yes | Saved search filters |
| PATCH/DELETE | `/api/listings/saved-searches/<id>/` | Yes | Edit/delete saved search |
| GET | `/api/listings/sitemap/` | No | All public listing slugs + business slugs for sitemap generation |

Rate limit: listing create 10/hr, max 20 active listings per user.

#### Content Types (step 2 of create flow)

| App | Endpoints |
|-----|-----------|
| Jobs | `GET /api/jobs/`, `POST /api/jobs/create/`, `GET|PATCH|DELETE /api/jobs/<id>/`, `GET /api/jobs/listing/<slug>/` |
| Rooms | `GET /api/rooms/`, `POST /api/rooms/create/`, `GET|PATCH|DELETE /api/rooms/<id>/`, `GET /api/rooms/listing/<slug>/` |
| Events | `GET /api/events/`, `POST /api/events/create/`, `GET|PATCH|DELETE /api/events/<id>/`, `GET /api/events/listing/<slug>/`, `POST /api/events/<id>/rsvp/` |
| Notices | `GET /api/notices/`, `POST /api/notices/create/`, `GET|PATCH|DELETE /api/notices/<id>/`, `GET /api/notices/listing/<slug>/` |

#### Businesses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/businesses/` | No | List all (filter: category, state) |
| POST | `/api/businesses/create/` | Yes | Create business profile |
| GET | `/api/businesses/my-businesses/` | Yes | User's businesses |
| GET/PATCH/DELETE | `/api/businesses/<slug>/` | No/Owner | Detail / edit / delete |
| GET/POST | `/api/businesses/<slug>/reviews/` | No/Yes | List / add review |
| DELETE | `/api/businesses/<slug>/reviews/<id>/` | Yes | Delete own review |
| POST | `/api/businesses/<slug>/images/` | Owner | Upload images |
| DELETE | `/api/businesses/<slug>/images/` | Owner | Delete image |
| POST | `/api/businesses/<slug>/report/` | Yes | Report business |

Rate limit: business create 3/hr.

#### Messaging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/messages/` | Yes | All conversations |
| POST | `/api/messages/` | Yes | Start or retrieve conversation |
| GET | `/api/messages/<id>/` | Yes | Conversation + messages |
| POST | `/api/messages/<id>/send/` | Yes | Send message |
| GET | `/api/messages/unread-count/` | Yes | Unread message count |

Rate limit: message send 5/min.

#### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/feature/<listing_id>/` | Yes | Create Stripe Checkout session |
| GET | `/api/payments/status/<listing_id>/` | Yes | Payment status |
| GET | `/api/payments/invoice/<listing_id>/` | Yes | Download PDF invoice |
| POST | `/api/payments/webhook/` | Stripe sig | Stripe webhook handler |

#### Forum

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/forum/` | No/Yes | List posts / create post (with optional `poll_options[]`) |
| GET/PATCH/DELETE | `/api/forum/<slug>/` | No/Owner | Post detail / edit / delete |
| POST | `/api/forum/<slug>/vote/` | Yes | Toggle post upvote |
| GET/POST | `/api/forum/<slug>/replies/` | No/Yes | List replies / add reply |
| DELETE | `/api/forum/replies/<id>/` | Yes | Delete own reply |
| POST | `/api/forum/replies/<id>/vote/` | Yes | Toggle reply upvote |
| POST | `/api/forum/poll/<option_id>/vote/` | Yes | Cast or change poll vote |
| GET | `/api/sitemap-forum.xml` | No | Live forum sitemap |

#### Community

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/community/requests/` | No/Yes | List / create reverse requests |
| DELETE | `/api/community/requests/<pk>/` | Yes (owner) | Soft-delete own request |
| GET/POST | `/api/community/services/` | No/Yes | List / create service listings |
| DELETE | `/api/community/services/<pk>/` | Yes (owner) | Soft-delete own service |

Filtering: `?category=<value>&state=<AU_state>` on both list endpoints.

#### User Reviews & Points

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/users/<id>/reviews/` | No/Yes | List reviews / submit review for user |
| DELETE | `/api/users/reviews/<pk>/` | Yes | Delete own review |
| GET | `/api/users/points/` | Yes | Points balance + recent event history |

#### Remittance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/remittance/rates/` | No | Live AUD→NPR rates per provider |

#### Other

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/exchange/` | No | AUD/GBP/USD/CAD → NPR rates |
| POST | `/api/feedback/` | No | Submit exit-intent survey |

---

### Authentication & Security

**Authentication class:** `core.authentication.SilentJWTAuthentication`

A custom subclass of `JWTAuthentication` that returns `None` (instead of raising `401`) when a token is expired or invalid. This allows public endpoints with `IsAuthenticatedOrReadOnly` to serve anonymous requests from users who have a stale token in their browser.

**Permission model:**
- Default: `IsAuthenticatedOrReadOnly` (read-only for anyone, write for authenticated users)
- Listing/business edit/delete: custom `IsOwnerOrReadOnly` permission class

**Security headers (production only):**
- HSTS with preload
- SSL redirect enforced
- XSS filter, MIME-type sniffing protection
- CORS enforced to specific origins

**Rate limits:**

| Action | Limit |
|--------|-------|
| Login | 5/min |
| Register | 3/min |
| Password reset | 3/hr |
| Contact form | 5/hr |
| Message send | 5/min |
| Listing create | 10/hr |
| Business create | 3/hr |
| Payment status check | 30/min |

**Known deferred items:**
- `JWT_AUTH_HTTPONLY: False` — tokens intentionally live in localStorage; full httpOnly cookie migration not yet done
- `X-Forwarded-For` in `ThrottledLoginView` — low risk as Railway sanitizes the header

---

### Email

Dual-provider routing in `core/emails.py`:

```python
if config('RESEND_API_KEY', default=''):
    # Production: Resend API (transactional)
else:
    # Local dev: Zoho SMTP
```

Both providers run in a daemon thread (non-blocking).

Email types sent:
- Registration confirmation / email verification
- Password reset
- Contact form acknowledgement
- Payment invoice (PDF attached, triggered by Stripe webhook)
- Listing expiry warning (3 days before expiry, via `send_expiry_warnings` management command)
- Listing expired notification
- Listing renewed confirmation
- Listing cleared by admin (notify owner)
- Listing removed by admin (notify owner with reason)
- Saved search alert (new listing matches a user's saved search, triggered on listing creation)

SMTP settings must be outside the `if DEBUG` block in `settings.py` — otherwise Django falls back to `localhost:25` in development.

---

### Payments (Stripe)

Flow:
1. User clicks "Make Featured" on their listing
2. Frontend `POST /api/payments/feature/<id>/` → Django creates Stripe Checkout Session and a `FeaturedPayment` record with `status=pending`
3. User completes payment on Stripe-hosted page
4. Stripe sends `checkout.session.completed` webhook to `POST /api/payments/webhook/`
5. Webhook handler (with `select_for_update()` to prevent duplicates):
   - Marks `FeaturedPayment.status = completed`
   - Sets `listing.is_featured = True`
   - Calls `send_payment_invoice_email(payment)` — emails the PDF invoice
6. Invoice available at `GET /api/payments/invoice/<id>/` — downloads PDF

**Invoice PDF** (`payments/pdf.py`, fpdf2):
- Full-width dark header band with NepSaathi branding (logo + contact left, "INVOICE" + amount right)
- Bill To section, itemised table, GST breakdown, grand total banner
- Content width: 180mm (A4 − 15mm margins each side)
- Helvetica only — no en dashes, no Unicode characters
- Always use explicit `pdf.set_xy(x, y)` for layout (do not rely on fpdf2 cursor flow)

**Featured listing price:** Set by `STRIPE_FEATURED_PRICE_CENTS` env var (e.g. `999` = AUD $9.99, 7 days).

---

### Push Notifications

1. Service worker registered at app start (`public/sw.js`)
2. User grants browser notification permission (prompted via `NotificationBanner` on `/messages`, or automatically on login)
3. Any existing subscription is unsubscribed first (ensures the correct VAPID key is always used after key rotation)
4. Frontend creates a new `PushSubscription` and sends endpoint + keys to `POST /api/users/push/subscribe/`
5. Backend stores in `PushSubscription` model (VAPID authentication)
6. Backend sends notifications via `pywebpush`
7. Service worker receives push event, displays notification with `icon: /icon-192.png` and `badge: /badge.svg` (white monochrome SVG for Android status bar)
8. On click, opens or focuses the app window and navigates to the URL in notification data
9. Stale subscriptions (404/410 responses) are cleaned up automatically

**VAPID key format:** Use raw base64url strings (not PEM) for both `VAPID_PRIVATE_KEY` and `VAPID_PUBLIC_KEY` in Railway. PEM keys lose newlines in env vars and cannot be parsed by pywebpush.

**After rotating VAPID keys:** run `python manage.py clear_push_subscriptions` in the Railway shell to wipe stale DB subscriptions. Browsers will re-subscribe automatically on next visit.

---

### Google Sheets Feedback Sync

When a `FeedbackResponse` is saved, `feedback/sheets.py` syncs it to a Google Sheet in a background thread.

Configuration (env vars):
- `GOOGLE_SHEETS_CREDENTIALS_JSON` — single-line JSON string (service account key)
- `GOOGLE_SHEETS_SPREADSHEET_ID` — ID from the Google Sheets URL

Logic:
- Checks if sheet row 1 has the header row (`Timestamp`, `Satisfaction`, `Reason`, `Page`, `User`); if not, inserts it
- Appends new response row
- Gracefully skips with a warning log if either env var is missing

Local dev uses a credentials file path (`GOOGLE_SHEETS_CREDENTIALS`); production uses the JSON string env var.

---

### Exchange Rates

`GET /api/exchange/` returns live AUD, GBP, USD, CAD → NPR conversion rates.

- Fetched from an external exchange rate API
- Cached for 1 hour in Redis (or in-memory if Redis is not configured)
- Returns a fallback value if the external API fails

---

### Deployment (Railway)

**`start.sh`:**
```bash
python3 manage.py collectstatic --noinput
python3 manage.py migrate
exec gunicorn core.wsgi --bind 0.0.0.0:${PORT:-8000} --workers ${WORKERS:-5} --timeout 120
```

**`Procfile`:**
```
web: bash start.sh
```

**`railway.json`:**
```json
{
  "builder": "NIXPACKS",
  "buildCommand": "python3 -m pip install -r requirements.txt",
  "deploy": {
    "startCommand": "bash start.sh",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

Static files served by WhiteNoise. Database is PostgreSQL on Railway (via `DATABASE_URL`).

---

## Frontend

### Pages & Routes

**Public (no auth required):**

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `HomePage` | Hero, category cards, latest listings by type, stats bar |
| `/featured` | `FeaturedPage` | All featured listings |
| `/jobs` | `JobsPage` | Job listings with filters |
| `/jobs/:slug` | `JobDetailPage` | Job detail + contact + similar |
| `/rooms` | `RoomsPage` | Room listings with filters |
| `/rooms/:slug` | `RoomDetailPage` | Room detail |
| `/notices` | `NoticesPage` | Community notices |
| `/notices/:slug` | `NoticeDetailPage` | Notice detail |
| `/events` | `EventsPage` | Event listings |
| `/events/:slug` | `EventDetailPage` | Event detail + RSVP |
| `/businesses` | `BusinessesPage` | Business directory |
| `/businesses/:slug` | `BusinessDetailPage` | Business profile + reviews + booking button |
| `/users/:id` | `UserProfilePage` | Public profile — listings by that user + star reviews |
| `/forum` | `ForumPage` | Community discussion board |
| `/forum/:slug` | `ForumPostPage` | Post detail + replies + poll display |
| `/looking-for` | `LookingForPage` | Reverse request board — post & browse what people are looking for |
| `/services` | `ServicesPage` | Skills & services marketplace |
| `/points` | `PointsPage` | Points balance, referral link, earn guide, event history |
| `/send-money` | `RemittancePage` | AUD→NPR rate comparator across providers |
| `/search` | `SearchPage` | Global search across all types |
| `/privacy` | `PrivacyPage` | Privacy Policy (sticky TOC) |
| `/terms` | `TermsPage` | Terms of Use (sticky TOC) |
| `/contact` | `ContactPage` | Contact form + FAQ accordion |

**Guest-only (redirect to `/` if logged in):**

| Route | Component |
|-------|-----------|
| `/login` | `LoginPage` |
| `/register` | `RegisterPage` |
| `/verify-email` | `VerifyEmailPage` |
| `/forgot-password` | `ForgotPasswordPage` |
| `/reset-password/:uid/:token` | `ResetPasswordPage` |

**Protected (redirect to `/login` if not logged in):**

| Route | Component |
|-------|-----------|
| `/post-ad` | `PostAdPage` |
| `/register-business` | `RegisterBusinessPage` | Includes booking_link field |
| `/my-listings` | `MyListingsPage` |
| `/edit-listing/:slug` | `EditListingPage` |
| `/profile` | `ProfilePage` | Edit profile, change password, delete account |
| `/panel` | `AdminPanelPage` | Superuser-only stats dashboard (renders 404 for non-superusers) |
| `/messages` | `InboxPage` |
| `/messages/:id` | `ConversationPage` |
| `/saved-searches` | `SavedSearchesPage` |

**Payment:**

| Route | Component |
|-------|-----------|
| `/payment/success` | `PaymentSuccessPage` (reads `?session_id=&listing_id=`) |
| `/payment/cancel` | `PaymentCancelPage` |

**404:** `*` → `NotFoundPage`

---

### State Management

**authStore (Zustand + localStorage)**

```js
// State
{ user, accessToken, refreshToken, isAuthenticated }

// Actions
setAuth(user, access, refresh)   // Login / Google OAuth
logout()                          // Clears storage, hard redirects to /login
updateUser(userData)              // Profile updates
setAccessToken(token)             // After token refresh

// Persistence keys
nepsaathi_access_token
nepsaathi_refresh_token
nepsaathi-auth
```

**languageStore (Zustand + localStorage, key `nepsaathi-lang`)**

```js
// State
{ lang: 'en' | 'np' }

// Actions
setLang(lang)    // Set explicit language
toggleLang()     // Switch between 'en' and 'np'
```

Used by `useT()` hook to look up the current language's translation dictionary. Falls back to English then the raw key string. Persists language preference across page refreshes.

**React Query** — server state for all listings, businesses, messages, etc.
- `staleTime: 5 minutes`
- `retry: 1`

---

### API Client

`src/utils/axios.js` — shared Axios instance with:
- Base URL: backend API root (`VITE_API_URL`)
- Request interceptor: attaches `Authorization: Bearer <token>` header
- Response interceptor: on `401`, attempts token refresh; queues concurrent 401s (avoids race condition); clears auth and redirects to `/login` if refresh fails

API modules in `src/api/`:

| Module | Functions |
|--------|-----------|
| `auth.js` | register (accepts optional `ref_code`), login, logout, getProfile, updateProfile, deleteAccount, changePassword, googleLogin, sendContactForm, getPublicProfile, getUserReviews, submitUserReview, deleteUserReview, getMyPoints |
| `listings.js` | getListings, getListing, createListing, updateListing, deleteListing, getMyListings, uploadImages, getStats, saveListing, unsaveListing, checkSaved, getSavedListings, markListingStatus, trackView, getSimilarListings, reportListing, renewListing, getSavedSearches, createSavedSearch, deleteSavedSearch |
| `jobs.js` | getJobs, getJob, getJobByListing, createJob, updateJob, deleteJob |
| `rooms.js` | getRooms, getRoom, getRoomByListing, createRoom, updateRoom, deleteRoom |
| `events.js` | getEvents, getEvent, getEventByListing, createEvent, updateEvent, deleteEvent, toggleRSVP |
| `announcements.js` | getAnnouncements, getAnnouncement, getAnnouncementByListing, CRUD |
| `businesses.js` | getBusinesses, getBusiness, createBusiness, updateBusiness, deleteBusiness, getMyBusinesses, getReviews, addReview, deleteReview, uploadImages, deleteImage, reportBusiness |
| `messages.js` | getConversations, startConversation, getConversation, sendMessage, getUnreadCount |
| `payments.js` | createCheckoutSession, getPaymentStatus, downloadInvoice (blob → URL.createObjectURL → anchor click) |
| `forum.js` | getPosts, getPost, createPost (with `poll_options[]`), updatePost, deletePost, votePost, getReplies, createReply, deleteReply, voteReply, castPollVote |
| `remittance.js` | getRates |
| `community.js` | getRequests, createRequest, deleteRequest, getServices, createService, deleteService |
| `push.js` | subscribePush, unsubscribePush |
| `exchange.js` | getExchangeRates |

---

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useExitIntent` | Triggers feedback modal on desktop mouse-out (`clientY ≤ 10`) or on mobile after 15s / 60% scroll depth. 7-day `localStorage` cooldown (`feedback_last_shown`). |
| `usePushNotifications` | Registers service worker, creates VAPID push subscription, sends to backend. Runs on auth state change. |
| `usePWAInstall` | Captures `beforeinstallprompt` event; exposes `promptInstall()` for the install banner. |
| `usePageTitle` | Sets `document.title` on mount. |
| `usePageMeta` | Full SEO: sets `<title>`, `description`, `og:*`, `twitter:*`, canonical URL. |
| `useIsMobile` | Returns `true` if `window.innerWidth < 768`. Listens to `resize`. |
| `useT` | Returns `t(key)` function from current language via `languageStore`. Falls back to English then raw key. Used for bilingual UI. |

**Feedback trigger paths** (`App.jsx`):
```js
const FEEDBACK_PATHS = ["/jobs", "/rooms", "/events", "/notices", "/businesses", "/search", "/featured"];
```
Exit-intent modal only activates on these routes.

---

### PWA

**`public/manifest.json`:**
```json
{
  "name": "NepSaathi — नेपसाथी",
  "short_name": "NepSaathi",
  "description": "Jobs, rooms and community for Nepalese Australians",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#26215C",
  "theme_color": "#26215C",
  "categories": ["lifestyle", "social", "business"],
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**`public/sw.js`** (service worker, cache version `nepsaathi-v3`):
- Network-first for same-origin GET requests; falls back to cache
- Skips non-GET, cross-origin, and `/api/` requests entirely (no interference with API calls)
- Navigation requests fall back to cached `index.html` for SPA routing
- Listens for `push` events — displays notification with `icon` (color logo) and `badge` (white SVG for Android status bar)
- On notification click: opens/focuses window, navigates to URL in notification data

**`PWAInstallPrompt`** component: shown globally, lets user dismiss or install. Persists dismiss to `localStorage`.

---

### Deployment (Vercel)

**`vercel.json`:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

All non-asset paths are served `index.html` so React Router handles routing client-side.

Build command: `npm run build` → runs `generate-sitemap.mjs` (fetches active listing slugs from the backend API and writes `public/sitemap.xml`) then `vite build` → output in `/dist/`.

---

## Environment Variables

### Backend (Railway)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` / `False` |
| `ALLOWED_HOSTS` | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |
| `CSRF_TRUSTED_ORIGINS` | Same as CORS origins |
| `FRONTEND_URL` | e.g. `https://nepsaathi.com` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary credentials |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_FEATURED_PRICE_CENTS` | e.g. `999` = AUD $9.99 |
| `VAPID_PRIVATE_KEY` | Web Push VAPID key |
| `VAPID_PUBLIC_KEY` | |
| `VAPID_ADMIN_EMAIL` | |
| `RESEND_API_KEY` | Resend transactional email (production) |
| `EMAIL_HOST` | Zoho SMTP host (local fallback) |
| `EMAIL_PORT` | |
| `EMAIL_USE_SSL` | |
| `EMAIL_HOST_USER` | |
| `EMAIL_HOST_PASSWORD` | |
| `GOOGLE_SHEETS_CREDENTIALS_JSON` | Single-line JSON (service account key) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Google Sheet ID for feedback sync |
| `REDIS_URL` | Optional — falls back to in-memory cache |
| `ADMIN_URL` | Custom admin path — set on Railway, never committed to source |

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL e.g. `https://nepsaathi-production.up.railway.app` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key for push notifications |
| `VITE_GA_ID` | Google Analytics measurement ID (e.g. `G-XXXXXXXXXX`) |

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env with DATABASE_URL, SECRET_KEY, ALLOWED_HOSTS, CLOUDINARY_*, etc.

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Admin panel available at `http://localhost:8000/<ADMIN_URL>` (set via env var; not the default `/admin/` path).

### Frontend

```bash
cd frontend
npm install

# Create .env.local with VITE_API_URL=http://localhost:8000, VITE_GOOGLE_CLIENT_ID, VITE_VAPID_PUBLIC_KEY

npm run dev   # Vite dev server at http://localhost:5173
```

### Two-step listing creation

All listing types (jobs, rooms, events, notices) use a two-step API flow:

1. `POST /api/listings/create/` → returns `{ id, slug, ... }` for the new base listing
2. `POST /api/<type>/create/` with `{ listing: <id>, ...type_specific_fields }` → creates the detail record

This means the `Listing` model always exists before the type-specific model.

### Clearing feedback modal cooldown (dev)

The exit-intent modal has a 7-day browser cooldown. To reset it during testing:

```js
localStorage.removeItem('feedback_last_shown')
```

### Referral links (dev)

Share `/register?ref=<referral_code>`. The `referral_code` for any user is returned by `GET /api/users/points/`. Visiting that URL while logged out shows a referral banner on the registration form. On successful registration, 10 pts are awarded to the new user and 25 pts to the referrer.

### Language toggle (dev)

The language preference is stored in `localStorage` key `nepsaathi-lang`. To reset to English:

```js
localStorage.removeItem('nepsaathi-lang')
```

---

*Built with ❤️ for the Nepalese Australian community.*
