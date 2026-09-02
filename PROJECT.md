# NepSaathi — Project Documentation

Community marketplace and resource hub for Nepalese Australians.  
**Live:** https://www.nepsaathi.com

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Backend Apps & Models](#backend-apps--models)
4. [API Endpoints](#api-endpoints)
5. [Frontend Pages & Routes](#frontend-pages--routes)
6. [Frontend Architecture](#frontend-architecture)
7. [Email System](#email-system)
8. [Payments (Stripe)](#payments-stripe)
9. [Cron Jobs](#cron-jobs)
10. [Environment Variables](#environment-variables)
11. [Local Development](#local-development)
12. [Deployment](#deployment)
13. [Security Notes](#security-notes)
14. [Build Log](#build-log)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 6.0.4 + DRF 3.17.1, Python 3.12.3 |
| Database | PostgreSQL (Railway) |
| Media storage | Cloudinary |
| Real-time | Django Channels 4.3 + ASGI (uvicorn) |
| Payments | Stripe Checkout |
| Email (prod) | Resend API |
| Email (dev) | Zoho SMTP |
| Frontend | React 19.2.4, Vite, Zustand, React Query, React Router v7 |
| Styling | Tailwind 4.2 + inline styles |
| Backend deploy | Railway (gunicorn + UvicornWorkers) |
| Frontend deploy | Vercel (SPA rewrite via vercel.json) |
| Android app | Capacitor 8.5.1 wrapping the React SPA |
| Android auth | @codetrix-studio/capacitor-google-auth 3.4.0-rc.4 |
| Android signing | Release keystore at `~/nepsaathi-release.keystore` (alias: nepsaathi) |

---

## Architecture Overview

```
Android APK (Capacitor WebView)      Vercel (React SPA)
    │                                     │
    │  HTTPS REST API                     │  REST API + WebSocket
    └─────────────────────────────────────▼
                              Railway (Django ASGI)
                                    │
                                    ├── PostgreSQL
                                    ├── Cloudinary (images)
                                    ├── Stripe (payments)
                                    ├── Resend (email)
                                    ├── Redis (optional, for channel layer)
                                    └── n8n (self-hosted on Railway, Postgres-backed)
                                              │
                                              ├── Facebook Page auto-post (Graph API /photos)
                                              └── Instagram Business auto-post (Graph API /media → /media_publish)
```

### Android app architecture

- **Capacitor 8.5.1** wraps `frontend/dist/` in a native WebView; app ID `com.nepsaathi.app`.
- **Origin** — Android WebView uses `https://localhost` as its origin. Railway `CORS_ALLOWED_ORIGINS` includes `https://localhost`.
- **Google Auth** — web uses `@react-oauth/google` (popup). Android uses `@codetrix-studio/capacitor-google-auth` native plugin (no popup). `Capacitor.isNativePlatform()` branches the two paths in `GoogleLoginButton.jsx`.
- **Token persistence** — access token stored in `localStorage` on native (survives app restart), `sessionStorage` on web (cleared on tab close). Zustand `persist` keeps `user` + `isAuthenticated` in `localStorage` on both.
- **Signing** — release keystore at `~/nepsaathi-release.keystore` (never committed). Debug SHA-1 and release SHA-1 both registered as separate Android OAuth clients in Google Cloud Console.
- **APK output** — `frontend/android/app/release/nepsaathi-release.apk` (excluded from git via `.gitignore`).

### Key architectural patterns

- **Two-step listing create** — POST `/api/listings/create/` to get an ID → POST `/api/jobs|rooms|events|notices/create/` with that ID.
- **Businesses are standalone** — the `Business` model is independent of `Listing`. Own full lifecycle.
- **Soft deletes** — listings set `status='deleted'`; businesses set `is_active=False`. Nothing is hard-deleted.
- **SilentJWTAuthentication** (`core/authentication.py`) — returns `None` on expired/invalid token instead of raising 401. Lets public endpoints serve anonymous users who have stale tokens.
- **Dual email routing** — Resend API in production (Railway has `RESEND_API_KEY`); Zoho SMTP in local dev.
- **Token refresh queue** — axios interceptor queues concurrent 401s, refreshes once, replays all queued requests.
- **WebSocket keep-alive** — client pings every 10 s to prevent Railway's proxy from closing idle connections.
- **SavedSearch alerts** — on listing creation, background thread emails all users with matching saved searches.
- **n8n social automation** — on listing creation, `perform_create` fires a background thread (`time.sleep(60)` to wait for image uploads) that POSTs to n8n webhook. n8n posts to Facebook (`/photos`) and Instagram (`/media` → wait → `/media_publish`). Also triggered from Django admin when spam-cleared listings are approved. n8n self-hosted on Railway with Postgres persistence.
- **Silent token refresh** — on App mount, if `isAuthenticated` but no sessionStorage access token (new tab), proactively calls the refresh endpoint with localStorage refresh token before any API calls fail.
- **Max active listings per user: 20** (enforced in `listings/views.py`).
- **Panel security** — 4-layer: `IsSuperUser` DRF permission (returns "Not found." to anyone else), `SuperUserRoute` in React (renders `NotFoundPage`), no UI links, not in sitemap.

---

## Backend Apps & Models

### 16 Django apps (15 local + admin)

| App | Purpose |
|---|---|
| `users` | Custom email-based User, profiles, push subscriptions, contact form, points & referrals, user reviews |
| `listings` | Base `Listing` model — parent for jobs/rooms/events/notices |
| `jobs` | Job-specific details (company, salary, job_type) |
| `rooms` | Room rental (price/week, furnishing, amenities) |
| `events` | Event details (date, venue, RSVP with overbooking protection) |
| `announcements` | Notices/classifieds (price, condition, category) |
| `businesses` | Standalone business profiles with reviews, images, and booking link |
| `exchange` | Live AUD/GBP/USD/CAD → NPR rates (cached 1 hr, no DB) |
| `messaging` | 1-to-1 conversations tied to listings, WebSocket via Channels |
| `payments` | Stripe Checkout for featured listings, PDF invoices |
| `feedback` | Exit-intent survey → Google Sheets sync; newsletter subscriber list |
| `panel` | Superuser-only stats aggregation API |
| `forum` | Community board — posts, replies, upvotes, categories, polls |
| `remittance` | AUD → NPR rate comparator (Wise, Remitly, WorldRemit, Western Union) |
| `community` | Reverse Request Board (ReverseRequest) + Skills & Services Marketplace (ServiceListing) |

---

### Model Inventory

#### `listings`
- **Listing** — user(FK), listing_type(job/room/event/notice), title, description, tags(JSONField, list of strings), location, state(8 AU states), postcode, status(active/expired/filled/deleted), contact_email/phone/whatsapp, is_featured, is_under_review, renewal_blocked, is_wanted, slug(unique), expires_at(30 days)
- **ListingImage** — listing(FK), image(Cloudinary), is_primary, image_hash(md5 for duplicate detection). Max 5 per listing.
- **SavedListing** — user(FK), listing(FK). unique_together=(user, listing)
- **ListingReport** — user(FK), listing(FK), reason, details, is_reviewed. unique_together=(user, listing)
- **ListingView** — listing(FK), user(FK nullable), ip_address, viewed_at
- **SavedSearch** — user(FK), label, listing_type, filters(JSON), is_active, last_notified. Max 10 per user.

#### `users`
- **User** — custom AbstractUser, `USERNAME_FIELD='email'`. Fields: email(unique), avatar(URLField), google_avatar, phone, location, bio(500 chars), is_verified, is_banned, ban_reason, points(PositiveIntegerField, default 0), referral_code(CharField max_length=12, unique, auto-generated via secrets.token_urlsafe on save), referred_by(FK→self, nullable). Method: `award_points(delta, event_type, description)` — atomic increment via `models.F()`.
- **PointEvent** — user(FK), event_type(signup/post_ad/referral/profile_complete), delta(IntegerField), description, created_at. DB table: `point_events`.
- **UserReview** — reviewer(FK→User), reviewee(FK→User), rating(1–5), comment(500 chars), created_at. unique_together=(reviewer, reviewee). Owner cannot review themselves.
- **PushSubscription** — user(FK), endpoint(unique), p256dh, auth

#### `rooms`
- **Room** — listing(OneToOne), room_type(private/shared/entire/studio), price(Decimal/week AUD), furnishing, bond, bills_included, available_from, bedrooms, bathrooms, max_occupants, nepalese_household, pets_allowed, parking_available, street_address

#### `jobs`
- **Job** — listing(OneToOne), company_name, job_type(full_time/part_time/casual/contract/internship/volunteer), salary, salary_type, experience_required, qualifications, is_urgent

#### `events`
- **Event** — listing(OneToOne), category(8 types), event_date, event_end_date, venue, organiser, is_free, ticket_price, max_attendees, is_online, event_url
- **EventRSVP** — event(FK), user(FK). Uses `select_for_update()` to prevent overbooking.

#### `announcements`
- **Announcement** — listing(OneToOne), category(news/sale/service/general/lost_found/education), price, condition(new/like_new/good/fair/poor/na), is_free, is_urgent

#### `businesses`
- **Business** — standalone (NOT linked to Listing). owner(FK), business_name, category(14 types), description, is_nepalese_owned, address, suburb, state, postcode, phone, whatsapp, email, website, abn(private), established_year, operating_hours, is_verified(admin only), is_active, is_featured, slug, booking_link(URLField, blank=True — direct booking URL shown as a button on the detail page)
- **BusinessImage** — business(FK), image(Cloudinary). Max 5.
- **BusinessReport** — user(FK), business(FK), reason, details, is_reviewed
- **BusinessReview** — business(FK), reviewer(FK), rating(1–5), comment(500 chars). One per user. Owner cannot review own.

#### `messaging`
- **Conversation** — participants(M2M User), listing_id, listing_title, listing_type, hidden_by(M2M User — soft-delete for inbox)
- **Message** — conversation(FK), sender(FK), content(2000 chars), is_read

#### `payments`
- **FeaturedPayment** — listing(FK), user(FK), stripe_session_id(unique), amount_paid(cents AUD), duration_days(7), status(pending/completed/failed/expired)

#### `feedback`
- **FeedbackResponse** — satisfaction(1–5), reason(6 choices), page_url, user(FK nullable)
- **NewsletterSubscriber** — email(unique), subscribed_at(auto_now_add), is_active(default True). DB table: `newsletter_subscribers`. Admin includes CSV export action.

#### `forum`
- **ForumPost** — author(FK), category(discussion/looking_for/announcement/buy_sell/warning/visa/accommodation/jobs/events/business/general — default: discussion), title, body(5000), slug(unique), is_pinned, is_closed, upvotes(M2M User), view_count
- **ForumReply** — post(FK), author(FK), body(2000), upvotes(M2M User)
- **PollOption** — post(FK), text(200 chars). Poll creation: pass `poll_options: ["option1", "option2", ...]` in the post create payload.
- **PollVote** — poll_option(FK), user(FK). unique_together=(poll_option__post, user) enforced in view — one vote per user per post. Changing vote replaces the previous one.

#### `remittance`
- **RemittanceRate** — provider(wise/remitly/worldremit/wu, unique), rate(NPR per 1 AUD), fee_aud(flat transfer fee), send_url(deep link to provider), fetched_at(auto_now)

#### `community`
- **ReverseRequest** — user(FK), title(200), body(2000), category(job/room/services/other), state(AU state, blank=True), budget(100, blank=True), is_active(BooleanField, soft-delete), created_at. Serializer exposes `poster_name` and `poster_id`.
- **ServiceListing** — user(FK), title(200), category(tutoring/translation/it/photography/cooking/accounting/transport/cleaning/other), description(2000), rate(100, blank=True), rate_type(hourly/fixed/negotiable), location(100, blank=True), state(50, blank=True), is_active(soft-delete), created_at. Serializer exposes `provider_name` and `provider_id`.

---

## API Endpoints

### Auth & Users
```
POST   /api/auth/login/                     # email+password (5/min rate limit)
POST   /api/auth/registration/              # register (3/min); accepts ?ref_code= for referral
POST   /api/auth/logout/                    # blacklist refresh token
POST   /api/auth/token/refresh/             # refresh access token
POST   /api/auth/password/reset/            # reset email (3/hr)
POST   /api/auth/password/change/           # change password (auth)
GET    /api/auth/user/                      # current user (auth)
POST   /api/users/auth/google/              # Google OAuth → JWT
GET    /api/users/profile/                  # (auth)
PATCH  /api/users/profile/                  # (auth)
DELETE /api/users/delete-account/           # deletes user + all data + Cloudinary cleanup
POST   /api/users/contact/                  # contact form (5/hr, public)
POST   /api/users/push/subscribe/           # register push subscription (auth)
DELETE /api/users/push/subscribe/           # unregister push (auth)
GET    /api/users/<id>/public/              # public profile (public)
GET    /api/users/points/                   # points balance + recent PointEvent history (auth)
GET    /api/users/<id>/reviews/             # list reviews for a user (public)
POST   /api/users/<id>/reviews/             # submit a review for a user (auth, not self)
DELETE /api/users/reviews/<pk>/             # delete own review (auth)
```

### Listings
```
GET    /api/listings/                       # all active listings (public, filterable)
POST   /api/listings/create/               # step 1 of 2-step create (auth, 10/hr, max 20)
GET    /api/listings/my-listings/           # user's own listings (auth)
GET    /api/listings/stats/                 # counts by type, cached 10 min (public)
GET    /api/listings/saved/                 # bookmarked listings (auth)
GET    /api/listings/search/?q=&state=      # cross-type search (public)
GET    /api/listings/search-suggestions/    # autocomplete (public)
GET|POST /api/listings/saved-searches/     # alert filters (auth, max 10)
PATCH|DELETE /api/listings/saved-searches/<id>/
GET    /api/listings/<slug>/               # detail (public — hides contact if not auth)
PATCH  /api/listings/<slug>/               # edit (owner)
DELETE /api/listings/<slug>/               # soft delete (owner)
POST   /api/listings/<id>/images/          # upload images (auth, owner, max 5, max 5 MB)
DELETE /api/listings/<id>/images/          # delete image from Cloudinary
POST|DELETE|GET /api/listings/<id>/save/   # bookmark toggle + check (auth)
POST   /api/listings/<id>/report/          # report (auth, max 5/user/day)
PATCH  /api/listings/<id>/status/          # mark filled/active (owner)
POST   /api/listings/<id>/view/            # track unique view (public)
GET    /api/listings/<id>/similar/         # up to 3 similar listings (public)
POST   /api/listings/<id>/renew/           # extend 30 days (owner, <7 days to expiry)
GET    /api/listings/sitemap/              # all slugs for sitemap (public)
POST   /api/listings/ai-improve/          # rewrite listing description via Groq (auth, 20/day)
POST   /api/listings/ai-suggest-tags/    # suggest 10 tags for a listing via Groq (auth, 30/day)
GET    /api/listings/benchmark/           # salary/rent market benchmark (public)
GET    /api/listings/my-analytics/        # per-listing stats for logged-in user (auth)
```

### Type-specific (step 2 of create)
```
GET|POST         /api/jobs/                  /api/rooms/     /api/events/     /api/notices/
GET|PATCH|DELETE /api/jobs/<id>/             ... (owner for write)
GET              /api/jobs/listing/<slug>/   ... (public — by parent listing slug)
POST             /api/events/<id>/rsvp/      # toggle RSVP, free events, respects max_attendees
POST             /api/jobs/create/           /api/rooms/create/  /api/events/create/  /api/notices/create/
```

### Businesses
```
GET    /api/businesses/                     # list (public, filterable)
POST   /api/businesses/create/             # create (auth, 3/hr, max 5 per user)
GET    /api/businesses/my-businesses/       # user's businesses (auth)
GET|PATCH|DELETE /api/businesses/<slug>/   # detail/edit/soft-delete (owner for write)
GET|POST /api/businesses/<slug>/reviews/   # list reviews (public) / add review (auth)
DELETE /api/businesses/<slug>/reviews/<pk>/ # delete own review (auth)
POST   /api/businesses/<slug>/images/      # upload (auth, owner, max 5)
DELETE /api/businesses/<slug>/images/
POST   /api/businesses/<slug>/report/
```

### Messaging
```
GET    /api/messages/                       # user's conversations (auth)
POST   /api/messages/                       # start/retrieve conversation (auth)
GET    /api/messages/<id>/                  # messages + mark read (auth, participant only)
POST   /api/messages/<id>/send/            # send message (auth, 5/min)
DELETE /api/messages/<id>/                  # hide conversation (soft)
GET    /api/messages/unread-count/          # badge count (auth)

WebSocket: ws://<host>/ws/messages/<id>/?token=<JWT>
```

### Payments
```
POST   /api/payments/feature/<listing_id>/  # create Stripe checkout (auth, owner)
GET    /api/payments/status/<listing_id>/   # featured status (auth, 30/min)
GET    /api/payments/invoice/<listing_id>/  # download PDF invoice (auth, owner)
POST   /api/payments/webhook/               # Stripe webhook (no auth, signature-verified)
```

### Forum
```
GET|POST         /api/forum/               # list posts (public) / create (auth); poll_options[] in body creates a poll
GET|PATCH|DELETE /api/forum/<slug>/
POST             /api/forum/<slug>/vote/   # toggle upvote (auth)
GET|POST         /api/forum/<slug>/replies/
DELETE           /api/forum/replies/<id>/
POST             /api/forum/replies/<id>/vote/
POST             /api/forum/poll/<option_id>/vote/ # cast/change poll vote (auth)
POST             /api/forum/ai-improve/    # rewrite forum post body via Groq Llama 3 (auth, 5/day shared with listing improve)
GET              /api/sitemap-forum.xml    # live forum sitemap
```

### Community
```
GET|POST   /api/community/requests/        # reverse request board (GET public, POST auth)
DELETE     /api/community/requests/<pk>/   # soft-delete own request (auth, owner)
GET|POST   /api/community/services/        # skills & services marketplace (GET public, POST auth)
DELETE     /api/community/services/<pk>/   # soft-delete own service listing (auth, owner)
```
Filtering: `?category=<value>&state=<AU_state>` on both list endpoints.

### Other
```
GET  /api/exchange/                      # AUD/GBP/USD/CAD → NPR, cached 1 hr (public)
POST /api/feedback/                      # exit-intent survey → Google Sheets (public)
POST /api/newsletter/subscribe/          # subscribe email to newsletter; idempotent; sends welcome email (public)
GET  /api/panel/stats/                   # full site stats (superuser only)
GET  /api/remittance/rates/              # live AUD→NPR rates per provider (public)
```

---

## Frontend Pages & Routes

### Public
| Route | Page |
|---|---|
| `/` | HomePage — hero search, exchange rates, new-today carousel, featured carousel, category sections |
| `/featured` | FeaturedPage |
| `/new-listings` | NewListingsPage — listings from last 24 hours; type + state filters; pagination |
| `/jobs` | JobsPage |
| `/jobs/:slug` | JobDetailPage |
| `/rooms` | RoomsPage |
| `/rooms/:slug` | RoomDetailPage |
| `/events` | EventsPage |
| `/events/:slug` | EventDetailPage |
| `/notices` | NoticesPage |
| `/notices/:slug` | NoticeDetailPage |
| `/businesses` | BusinessesPage |
| `/businesses/:slug` | BusinessDetailPage |
| `/community` | Redirects → `/forum` (Navigate replace) |
| `/forum` | ForumPage — renamed "Community"; unified feed with 11 category tags |
| `/forum/:slug` | ForumPostPage |
| `/looking-for` | Redirects → `/forum?category=looking_for` (Navigate replace) |
| `/services` | ServicesPage — skills & services marketplace; category + state filters |
| `/search` | SearchPage |
| `/send-money` | RemittancePage |
| `/users/:id` | UserProfilePage — public profile + listings by that user + star reviews |
| `/jobs/in/:location` | LocationPage (listingType=job) — SEO landing page for a city or suburb; uses listing__state filter for known cities, Nominatim search for suburbs |
| `/rooms/in/:location` | LocationPage (listingType=room) |
| `/events/in/:location` | LocationPage (listingType=event) |
| `/notices/in/:location` | LocationPage (listingType=notice) |
| `/businesses/in/:location` | LocationPage (listingType=business) |
| `/visa` | VisaHubPage — PR points calculator, visa timelines, WhatsApp groups |
| `/new-to-australia` | NewToAustraliaPage — accordion guide, sticky scrollspy nav |
| `/guides` | Redirects → `/guides/banking` (Navigate replace) |
| `/guides/:topic` | GuidesPage — 5 settlement guides (banking, health, tax, work-rights, childcare) in a single tabbed page; sticky tab bar + sticky section nav; IntersectionObserver scrollspy |
| `/banking` | Redirects → `/guides/banking` (backward-compat) |
| `/health` | Redirects → `/guides/health` (backward-compat) |
| `/tax` | Redirects → `/guides/tax` (backward-compat) |
| `/work-rights` | Redirects → `/guides/work-rights` (backward-compat) |
| `/childcare` | Redirects → `/guides/childcare` (backward-compat) |
| `/privacy` | PrivacyPage |
| `/terms` | TermsPage |
| `/contact` | ContactPage |

### Protected (auth required)
| Route | Page |
|---|---|
| `/forum/new` | CreatePostPage — supports optional poll creation + ✨ AI body improve |
| `/post-ad` | PostAdPage — address autocomplete (Nominatim), ✨ AI description improve, ✨ AI tag suggestions (chip input, max 10 tags) |
| `/register-business` | RegisterBusinessPage — includes booking_link field |
| `/my-listings` | MyListingsPage |
| `/profile` | ProfilePage |
| `/messages` | InboxPage |
| `/messages/:id` | ConversationPage |
| `/saved-searches` | SavedSearchesPage |
| `/edit-listing/:slug` | EditListingPage |
| `/payment/success` | PaymentSuccessPage |
| `/payment/cancel` | PaymentCancelPage |

### Guest-only (redirect if logged in)
`/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password/:uid/:token`

### Superuser-only
`/panel` — AdminPanelPage (SuperUserRoute renders NotFoundPage for everyone else)

---

## Frontend Architecture

### State management
- **authStore** (Zustand + localStorage persist key `nepsaathi-auth`) — user, accessToken, refreshToken, isAuthenticated. Logout clears all localStorage keys and hard-redirects to `/login`.
- **languageStore** (Zustand + localStorage persist key `nepsaathi-lang`) — `lang: 'en' | 'np'`, `setLang()`, `toggleLang()`. Drives the bilingual UI.
- **React Query** — all server data. `staleTime: 5 min, retry: 1`. Detail pages use `gcTime: 0` to prevent stale data on remount.

### Axios instance (`src/utils/axios.js`)
- Attaches Bearer token from localStorage on every request
- 401 interceptor: queues concurrent 401s, refreshes once, replays all

### Custom hooks (`src/hooks/`)
| Hook | What it does |
|---|---|
| `usePageMeta` | Sets title, description, OG tags, canonical |
| `useIsMobile` | `window.innerWidth < 768` |
| `useExitIntent` | Desktop: mouse to top edge; mobile: 15s timer OR 60% scroll depth; 7-day cooldown |
| `usePushNotifications` | Service Worker + VAPID subscription |
| `usePWAInstall` | Captures `beforeinstallprompt` |

### API modules (`src/api/`)
`auth.js`, `listings.js`, `jobs.js`, `rooms.js`, `events.js`, `announcements.js`, `businesses.js`, `messages.js`, `payments.js`, `exchange.js`, `push.js`, `panel.js`, `forum.js`, `remittance.js`, `community.js`

All use the shared axios instance (auto-token + auto-refresh).

Notable additions:
- `auth.js` — includes `getMyPoints()` and `register()` now accepts an optional `ref_code` param
- `listings.js` — `getNewListings()` (last 24h filter), `aiImproveDescription()` (Groq endpoint), `aiSuggestTags()` (Groq tag suggestion endpoint)
- `forum.js` — `castPollVote(optionId)`, `aiImproveForumPost()` (Groq endpoint)
- `community.js` — `getRequests`, `createRequest`, `deleteRequest`, `getServices`, `createService`, `deleteService`

### Key components
- **Navbar** — sticky, 6 main links (Jobs, Rooms, Events, Businesses, Community→/forum, Send Money), auth-conditional user menu, unread message badge with toast on new message. Community is a direct link (no dropdown). Includes `LangToggle` (🇳🇵/🇬🇧 flag pill) for Nepali/English switching in both desktop nav and mobile menu bottom.
- **BottomNav** — 4-tab fixed mobile nav with emoji icons: 🏠 Home (/), 💼 Jobs (/jobs), [centre gradient Post button], 🛏️ Rooms (/rooms), 💬 Community (/forum). Phosphor SVG icons replaced with emoji for better cross-platform rendering (incl. Android WebView).
- **Footer** — Newsletter strip (email subscribe → `POST /api/newsletter/subscribe/`) + 5-column link grid (Brand, Explore, Guides, Account, About). Explore: Jobs, Rooms, Events, Businesses, Forum (5 links). Guides: Send Money, Visa Hub, New to Australia, WhatsApp Groups, Settlement Guides (→/guides/banking). Account column no longer includes Points. Two bottom bars: legal links + contact emails; darker copyright bar. Responsive: 3-col ≤900px, 2-col ≤560px. All labels via `useT()`.
- **Toast** — `useToast()` exposes `addToast(content, type, duration)` — NOT `showToast`
- **ProgressBar** — route-change loading indicator
- **FeedbackModal** — exit-intent form (satisfaction 1–5 + reason) → Google Sheets
- **ExchangeRates** — AUD/GBP/USD/CAD → NPR widget
- **SilentJWTAuthentication** — lets public endpoints serve anonymous users gracefully

### Bilingual UI (i18n)
- **`src/store/languageStore.js`** — Zustand store persisted to localStorage. `lang: 'en' | 'np'`, `toggleLang()`.
- **`src/i18n/translations.js`** — flat dictionary with `en` and `np` keys. 80+ keys covering `nav.*`, `footer.*`, `home.*`, `common.*`. Nepali strings use Devanagari script.
- **`src/hooks/useT.js`** — `useT()` returns a `t(key)` function that reads from `languageStore`. Falls back to `translations.en[key]` then the raw key string — UI never breaks if a key is missing in the Nepali dictionary.
- **`LangToggle`** component (inside Navbar) — pill button showing 🇳🇵/🇬🇧 flag. Calls `toggleLang()`. Appears in desktop nav and at the bottom of the mobile hamburger menu.
- **Referral URL pattern** — `/register?ref=<referral_code>`. `RegisterPage` reads `?ref=` via `useSearchParams`, shows a referral banner, and passes `ref_code` in the registration POST body.

---

## Email System

All emails live in `backend/core/emails.py`. Routing:

```python
def _fire(params):
    if RESEND_API_KEY:    # production
        threading.Thread(target=_send_resend, ...).start()
    else:                 # local dev
        threading.Thread(target=_send_smtp, ...).start()
```

**All emails fire in daemon threads** — they never block the request.

### Email functions
| Function | Trigger |
|---|---|
| `send_verification_email` | User registration |
| `send_ban_notification_email` | Admin bans user |
| `send_listing_report_email` | User reports a listing |
| `send_listing_expiry_warning_email` | Listing within 4 days of expiry (cron) |
| `send_listing_renewal_email` | Owner renews listing |
| `send_listing_expired_email` | Listing expires (cron) |
| `send_payment_invoice_email` | Stripe payment completed (attaches PDF) |
| `send_saved_search_alert_email` | New listing matches user's saved search |
| `send_event_reminder_email` | Event within 24 hrs (cron) |
| `send_newsletter_welcome_email` | Newsletter signup — welcome email with Browse CTA |
| `send_document_expiry_email` | *(removed — visa tracker deleted)* |
| `send_visa_expiry_reminder_email` | *(removed — visa tracker deleted)* |

### Invoice PDF (`backend/payments/pdf.py`, fpdf2)
- Full-width dark header band (Wardiere style) with logo, "INVOICE", amount
- Helvetica only → no en dash `–`, use plain `-`
- Always use explicit `pdf.set_xy(x, y)` — never rely on fpdf2 cursor flow
- Content width = 180 mm; table columns must sum to exactly 180

---

## Payments (Stripe)

Only **listings** (jobs/rooms/events/notices) can be featured. Businesses cannot.

1. `POST /api/payments/feature/<listing_id>/` — creates Stripe Checkout session + pending `FeaturedPayment`
2. User pays → Stripe fires `checkout.session.completed` webhook
3. Webhook: sets `payment.status='completed'`, `listing.is_featured=True`, emails invoice PDF
4. Invoice downloadable at `GET /api/payments/invoice/<listing_id>/`

Price controlled by `STRIPE_FEATURED_PRICE_CENTS` env var (e.g. `999` = AUD $9.99).

Webhook is idempotent — always checks `payment.status != 'completed'` before processing.

---

## Cron Jobs

`backend/cron.sh` — runs on Railway's cron service via `entry.sh` wrapper.

```bash
python manage.py expire_listings              # sets expired listings to status='expired'
python manage.py expire_featured_businesses   # clears is_featured on expired businesses
python manage.py send_expiry_warnings         # emails owners within 4 days of expiry
python manage.py send_event_reminders         # emails RSVP'd users 24 hrs before event
python manage.py fetch_remittance_rates       # pulls live AUD→NPR from Wise/Remitly/WorldRemit/WU
```

---

## Environment Variables

### Railway (backend)
```
DATABASE_URL
SECRET_KEY
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_FEATURED_PRICE_CENTS

VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY
VAPID_ADMIN_EMAIL

RESEND_API_KEY                   # production email (absent = Zoho SMTP fallback)
EMAIL_HOST                       # Zoho SMTP host
EMAIL_PORT
EMAIL_HOST_USER
EMAIL_HOST_PASSWORD

GOOGLE_SHEETS_CREDENTIALS_JSON   # single-line JSON string
GOOGLE_SHEETS_SPREADSHEET_ID

INDEXNOW_KEY                     # bab5cd5c2e80de771f58b86a4737ca2a
FRONTEND_URL                     # https://www.nepsaathi.com
ADMIN_URL                        # obscured path (set on Railway, never committed)
```

### Vercel (frontend)
```
VITE_API_URL
VITE_GOOGLE_CLIENT_ID
VITE_VAPID_PUBLIC_KEY
```

---

## Local Development

```bash
# Backend
cd backend
source ~/nepsaathi/venv/bin/activate
python manage.py migrate
uvicorn core.asgi:application --reload --port 8000
# (WebSockets require uvicorn/ASGI — do NOT use manage.py runserver for WS testing)

# Cron commands (run manually)
python manage.py fetch_remittance_rates
python manage.py expire_listings
python manage.py send_expiry_warnings

# Frontend
cd frontend
npm install
npm run dev
```

**Note:** `start.sh` uses gunicorn + UvicornWorkers for production. For local dev use uvicorn directly.

---

## Deployment

### Backend (Railway)
- `Procfile`: `web: gunicorn core.asgi:application -w 4 -k uvicorn.workers.UvicornWorker`
- `cron.sh` is executed by a separate Railway cron service via `entry.sh`
- Watched-file deploys skip `cron.sh` changes — trigger a manual redeploy after cron updates
- Static files: `python manage.py collectstatic` runs in `start.sh`
- Media: Cloudinary (production) / local `media/` (dev)

### Frontend (Vercel)
- `vercel.json` has SPA rewrite: all routes → `index.html`
- Also proxies `/sitemap-forum.xml` → Railway backend for Google Search Console

### After deployment / first setup
```bash
python manage.py migrate
python manage.py fetch_remittance_rates   # seed initial rates
```

---

## Security Notes

- **SilentJWTAuthentication** — `DEFAULT_AUTHENTICATION_CLASSES`. Returns `None` on bad token instead of 401. Required for public endpoints to serve anonymous users who have stale tokens in localStorage.
- **Rate limits**: login 5/min per IP + 10/period per email hash, register 3/min, pw reset 3/hr, message send 5/min, listing create 10/hr, business create 3/hr, payment status 30/min, contact 5/hr, AI description improve 20/day (`ai_improve` scope), AI tag suggest 30/day (`ai_suggest_tags` scope). Both show a toast on 429.
- **X-Forwarded-For**: rightmost entry used for IP throttling (Railway appends real IP on right — cannot be spoofed by client)
- **Stripe webhook**: signature-verified with `STRIPE_WEBHOOK_SECRET`, uses `select_for_update()` to prevent duplicate processing
- **Admin URL**: obscured path set via `ADMIN_URL` env var on Railway (not `/admin/`; path never committed to source)
- **Panel**: `IsSuperUser` permission returns generic "Not found." to non-superusers
- **Auto-ban**: listing owner is auto-banned after 3 admin removals for violations
- **HSTS + SSL redirect**: enabled when `DEBUG=False`
- **dj-rest-auth**: must set `USER_DETAILS_SERIALIZER = 'users.serializers.UserSerializer'` or `is_staff`/`is_superuser` won't appear in login response

---

## Build Log

### Initial launch
- Community marketplace: jobs, rooms, events, notices, businesses
- Custom email-based User model, Google OAuth, JWT auth with rotation + blacklist
- Cloudinary image uploads (listings + businesses), duplicate detection via md5 hash
- Django Channels WebSocket messaging (1-to-1, tied to listings)
- Stripe Checkout for featured listings, PDF invoice generation (fpdf2)
- AUD/GBP/USD/CAD → NPR exchange rate widget (cached, fallback)
- Push notifications (VAPID, Service Worker)
- Saved searches with email alerts on new matching listings
- Exit-intent feedback modal → Google Sheets sync
- Full Django admin: bulk actions, report management, auto-ban logic
- Railway (backend) + Vercel (frontend) deployment

### Forum (2026-05-23)
- Community discussion board: ForumPost + ForumReply, 6 categories
- Upvotes (M2M), view tracking, pinned posts, closed threads
- IndexNow ping on new post for fast Bing indexing
- Dynamic sitemap at `/api/sitemap-forum.xml` proxied via Vercel
- JSON-LD `DiscussionForumPosting` schema on post pages
- Hover tooltips on upvote, reply and view counts

### Bug audit & fixes (2026-05-12 — 2026-05-14)
- Messaging: first message discarded on existing conversation
- Messaging: push notification never sent for first message
- Messaging: `hidden_by` not cleared on re-message or follow-up
- Stripe webhook: `session.get()` → `session[]` (SDK uses bracket access)
- Invoice PDF not attached to email — fixed in `_send_resend` and `_send_smtp`
- `is_under_review` banner showed for already-reviewed reports (fixed in all 4 type serializers)
- Admin bulk actions bypassed `save_model` — explicit report clearing added to each action
- `review_badge` N+1 fixed using prefetch cache
- X-Forwarded-For IP spoofing — switched to rightmost entry
- Stripe payment `amount_total` crash fixed
- `gcTime: 0` added to detail page queries to prevent stale report banner on remount

### UI improvements (2026-05-xx)
- Skeleton loaders on listing pages and homepage
- Contact page: 2-column layout + FAQ accordion
- Terms/Privacy: sticky table of contents pattern
- Floating bulk-action bar on MyListingsPage
- Navbar unread message toast notification

### Remittance comparator (2026-07-12)
- `remittance` Django app: `RemittanceRate` model, serializer, public API
- `fetch_remittance_rates` management command — pulls live AUD→NPR from Wise, Remitly, WorldRemit, Western Union
- Cron updated to run `fetch_remittance_rates` (replaced visa reminder command)
- `/send-money` frontend page: live rate table sorted by best NPR received, quick-amount chips, provider badges, skeleton loaders
- Navbar, footer, sitemap updated

### Phase 2 additions (2026-08-08)
- **User reviews** — `UserReview` model in `users` app; 1–5 star rating + comment; one review per pair; displayed on `UserProfilePage` with `StarPicker`/`StarDisplay` components; endpoints: list, create, delete own.
- **Forum polls** — `PollOption` + `PollVote` models in `forum` app; poll creation via `poll_options[]` array in post create payload; per-user vote with change support; percentage bars displayed on `ForumPostPage`.
- **Business booking link** — `booking_link` URLField on `Business`; shown as a button on `BusinessDetailPage`; input field added to `RegisterBusinessPage`.

### Phase 3 — Community features (2026-08-08)
- **`community` Django app** — `ReverseRequest` + `ServiceListing` models; soft-delete pattern (`is_active=False`); public GET, authenticated POST; category + state filtering.
- **Reverse Request Board** (`/looking-for`) — users post what they're looking for (work, room, service, other); category/state filters; inline form; own posts removable.
- **Skills & Services Marketplace** (`/services`) — users offer services (tutoring, translation, IT, photography, cooking, accounting, transport, cleaning); rate + rate_type display; category/state filters.
- **Points & Referral system** — `points` (PositiveIntegerField) + `referral_code` (unique, auto-generated) + `referred_by` FK on User. `PointEvent` history table. Points awarded: 10 on signup, 5 per listing posted (in `ListingCreateView.perform_create`), 25 per successful referral. Referral URL: `/register?ref=<code>`. Migration used a backfill step to assign unique codes to all existing users before applying the unique constraint.
- **PointsPage** (`/points`) — balance card, referral link with clipboard copy, earn guide, event history list.

### Phase 4 — Bilingual UI (2026-08-08)
- **Nepali/English toggle** — `languageStore` (Zustand, persisted to localStorage), flat `translations.js` dictionary (80+ keys, Devanagari for Nepali), `useT()` hook with EN fallback.
- **`LangToggle` component** — 🇳🇵/🇬🇧 pill button in desktop Navbar and at the bottom of the mobile menu.
- **Translated** — Navbar nav links + dropdown items + auth buttons, Footer column headers + links, HomePage hero headline + subtitle + search placeholder + section titles, LookingForPage + ServicesPage sign-in CTA.

### Phase 5 — AI features, SEO, New listings (2026-08-08)
- **SEO overhaul** — `usePageMeta` hook sets title + description + OG tags + canonical on all 17+ public pages. JSON-LD `WebSite` + `Organization` + `SearchAction` structured data on homepage. Sitemap expanded to 17 URLs including `/new-listings`, `/send-money`, `/looking-for`, `/services`, `/forum`.
- **Address autocomplete** — `AddressAutocomplete.jsx` component using Nominatim (OpenStreetMap, free, no key). Debounced 400ms, keyboard nav, AU-only results. Wired into PostAdPage, EditListingPage, RegisterBusinessPage.
- **NEW badge** — green badge on listing cards posted in last 24h across all category pages and homepage sections.
- **New listings carousel** — homepage section mirroring the Featured carousel design (green theme); only renders when listings exist in the last 24h. Links to `/new-listings`.
- **`/new-listings` page** — dedicated page with type/state filters and pagination; shows all listings posted in the last 24 hours. Backend: `?new=true` filter on `ListingListView` using `created_at__gte=now()-24h`.
- **AI description improve** (`POST /api/listings/ai-improve/`) — "✨ Improve with AI" button on PostAdPage; sends title + description + type + location to Groq Llama 3.1 8B Instant; shows purple preview box with "Use this / Discard".
- **AI forum improve** (`POST /api/forum/ai-improve/`) — same button + preview pattern on CreatePostPage; prompt tuned for friendly community posts.
- **Shared AI rate limit** — both AI endpoints share `throttle_scope = 'ai_improve'`: 5 uses/day per user across all AI features.
- **Groq integration** — `groq>=1.6.0` in requirements; `GROQ_API_KEY` env var (Railway only, never frontend); model: `llama-3.1-8b-instant` (14,400 req/day free tier).

### Phase 6 — AI features, security hardening, UX polish (2026-08-10)
- **AI improve on Edit Listing** — "✨ Improve with AI" button added to `EditListingPage`, identical pattern to PostAdPage (purple preview box, "Use this / Discard").
- **AI cover letter in QuickApplyModal** (`POST /api/jobs/ai-improve-cover-letter/`) — "✨ AI suggestion" button in the job application modal; injects applicant's real full name (`get_full_name() or email.split("@")[0]`) into the prompt and signs off with it; shares `ai_improve` rate limit (5/day).
- **Prompt injection protection** — all AI improve endpoints wrap user content in XML delimiter tags (`<user_draft>`, `<applicant_draft>`) before sending to Groq; `re.sub` strips any echoed tags from the model response before returning to the frontend.
- **Quick Apply fixes** — owner check now uses `user?.id` from `useAuthStore` (was comparing `job.user_id !== job.my_user_id` which was always `undefined`); error handler extended to check `non_field_errors`; modal made scrollable (`maxHeight: "90vh"`, flex column layout).
- **Countdown timer on Post Ad** — replaces static "please wait 5 minutes" message with an amber banner showing live MM:SS countdown; handles both custom 5-min cooldown (`{"cooldown": N}` response) and DRF 429 throttle response (`{"detail": "... N seconds."}` — seconds extracted via regex); submit buttons disabled during countdown. Backend returns `{"cooldown": seconds_left}` instead of a plain error string.
- **Skip photos for wanted listings** — `is_wanted` postings (job seeker, room seeker) skip the photo upload step entirely and navigate directly to the live listing; step indicator shows only 3 steps for wanted listings.
- **Verified badges on listing cards** — `VerifiedBadge` SVG component now appears on all four category list pages using `poster_is_verified` (already present in all type-specific serializers): badge next to company name on JobsPage; "Verified host" label on RoomsPage; "Verified organiser" label on EventsPage; inline badge on NoticesPage.
- **Security: `is_reported` auth gate** — `get_is_reported()` in `listings/serializers.py` now returns `True` only to the listing owner or staff; previously leaked report status to all authenticated users.
- **Security: per-email login rate limit** — 10 failed attempts per SHA-256-hashed email address added to `ThrottledLoginView` alongside existing per-IP limit; cleared on successful login.
- **Security: HTML injection in emails** — `event.event_url` in `core/emails.py` now escaped with `_h()` helper in both the `href` attribute and display text.

### Phase 7 — Social media automation (2026-08-16)
- **Facebook auto-post** — when a listing is created, `perform_create` fires a daemon thread that sleeps 60s (waiting for image uploads), re-fetches the listing with images, and POSTs title/category/location/description/image_url to an n8n webhook. n8n posts to the NepSaathi Facebook Page via Graph API `/photos` endpoint with caption + image.
- **Instagram auto-post** — same webhook triggers Instagram posting via a two-step flow: create media container (`/media`) → 5s Wait node → publish (`/media_publish`). IF node skips Instagram when no image is present.
- **Dynamic hashtags** — n8n Code node builds category-specific hashtags (e.g. `#RoomForRent #ShareHouse` for rooms, `#JobsInAustralia #HiringNow` for jobs) and state-based location tags (e.g. `#Sydney #SydneyLife` for NSW). Facebook gets 6 clean tags; Instagram gets up to 15.
- **Description teaser in posts** — webhook payload now includes listing description; Code node strips markdown (`**`, `##`, etc.) and includes a 200-char teaser in the caption.
- **AI description prompt improved** — rewritten to produce professional prose with a strong opening sentence, short paragraphs, no markdown, under 250 words.
- **n8n persistence** — n8n self-hosted on Railway (Docker image `n8nio/n8n`), backed by Railway Postgres (`DB_TYPE=postgresdb`). `N8N_ENCRYPTION_KEY` env var ensures credentials survive container restarts.
- **Admin webhook** — `save_model` and `approve_listings` bulk action in `listings/admin.py` also fire the webhook when spam-flagged listings are cleared, so admin-approved listings also auto-post.
- **New-tab logout fix** — `App.jsx` mounts a `useEffect` that detects `isAuthenticated` with no sessionStorage access token (new browser tab), proactively calls token refresh with the localStorage refresh token (for Google OAuth users) or httpOnly cookie (for email users), and stores the new access token in sessionStorage before any API calls run.

### Phase 8 — SEO info pages & AI tag suggestions (2026-08-18)
- **5 SEO info pages** — `/banking`, `/health`, `/tax`, `/work-rights`, `/childcare`. Each follows the `NewToAustraliaPage` pattern: data-driven sections array, sticky scrollspy nav (IntersectionObserver, `threshold:0.2`), accordion toggle, gradient hero, bottom CTA. Each has a distinct accent colour (green/blue/amber/purple/pink). Nav active indicator uses `box-shadow: inset 0 -2px 0 0 accent` to avoid CSS overflow clipping. All 5 added to sitemap, footer, and i18n translations (English + Nepali).
- **AI tag suggestions** (`POST /api/listings/ai-suggest-tags/`) — "✨ Suggest tags" button in PostAdPage Step 2. Sends title + description (≤150 chars) + listing_type to Groq via system+user message format; returns up to 10 lowercase tags. Frontend shows suggestions as dashed purple chips — click to add. Chip input lets users also type tags manually (Enter/comma to add, Backspace to remove last, max 10). Tags stored in `Listing.tags` (JSONField). Rate limited to 30/day (`ai_suggest_tags` scope).
- **Tags in n8n webhook** — `tags` array included in both `_notify_n8n` (views.py) and `_fire_n8n_webhook` (admin.py) payloads. n8n Code node converts them to hashtags (`#kitchenhand`, `#fulltime`) and appends to Facebook + Instagram captions alongside existing core/category/location tags. Instagram respects 30-tag limit.
- **AI rate limit toast** — both "Improve with AI" and "Suggest tags" buttons show a `warning` toast on HTTP 429 instead of inline error: "You've used your daily AI limit. Try again tomorrow. You can still use NepSaathi normally!"
- **Removed `anthropic` package** — `anthropic>=0.40.0` removed from `requirements.txt` (unused since switch to Groq).

### Phase 9 — SEO location pages, footer redesign, newsletter, bug sweep (2026-08-21)
- **Location SEO pages** — `LocationPage` component powers `/jobs/in/:location`, `/rooms/in/:location`, `/events/in/:location`, `/notices/in/:location`, `/businesses/in/:location`. Known city slugs (sydney, melbourne, brisbane, perth, adelaide) use `listing__state` filter; suburb slugs use Nominatim geocode → radius search. Each page has `usePageMeta` with city-aware title/description and no-index on empty results. `/announcements` and `/announcements/:slug` redirect to `/notices` and `/notices/:slug`.
- **VisaHub page** (`/visa`) — PR points calculator (English-skilled worker pathway), visa timeline browser, state-based WhatsApp group links. Tab bar uses horizontal scroll (flex, `overflow-x: auto`, `flex-shrink: 0`, `white-space: nowrap`) for mobile. All grids use `repeat(auto-fit, minmax(..., 1fr))` for responsive layout without media queries.
- **Soft 404 fixes** — error states on JobDetailPage, RoomDetailPage, EventDetailPage, NoticeDetailPage now render `<meta name="robots" content="noindex, nofollow" />` so Google stops crawling deleted listing URLs. `vercel.json` adds a permanent redirect from non-www to www (`nepsaathi.com → www.nepsaathi.com`) using `has.host` condition.
- **Footer redesign** — full rebuild: newsletter strip (email subscribe), 5-column link grid with inline SVG icon column headers and `›` chevron links, two bottom bars (legal + copyright). Responsive breakpoints at 900px and 560px. Newsletter subscribe uses `api` axios instance (not bare `fetch`) to reach the Railway backend via `VITE_API_URL`.
- **Newsletter backend** — `NewsletterSubscriber` model in `feedback` app (`email` unique, `subscribed_at`, `is_active`). `POST /api/newsletter/subscribe/` is idempotent: creates on first call, re-activates on re-subscribe, returns 200 with "already subscribed" on duplicates. Sends `send_newsletter_welcome_email` on successful new subscription. Django admin has CSV export action. Frontend shows distinct success / already-subscribed badge states.
- **Bug sweep — 35 fixes across 4 audits** — highlights: `is_under_review=False` added to all listing detail view querysets so listings under review are hidden from non-owners; `daemon=True` on background threads (`_flag_if_duplicate`, `_trigger_saved_search_alerts`) for clean gunicorn shutdown; atomic view-count increment via `F('view_count') + 1`; boolean-as-int rating validation (`isinstance(rating, bool)` check); `is_active` in `BusinessSerializer.read_only_fields` prevents owner bypassing admin deactivation; `get_is_reported` returns `False` to non-owners (was leaking report status); `Avg`/`Count` DB aggregation for accurate review stats; N+1 fixed on EventListView with `prefetch_related('listing__images')`; deleted-listing `invoice_url` construction crash fixed; `business.name` → `business.business_name` in WhatsApp button.
- **llms.txt** added at repo root — H1 title + site links for LLM crawlers.

### Community restructure (2026-08-29) — commit ef52976
- **Merged Forum + Notices + Looking For into one Community feed** at `/forum`. Fragmented sections caused user confusion; unified feed removes the decision burden.
- **5 new intent-based ForumPost categories** — `discussion`, `looking_for`, `announcement`, `buy_sell`, `warning` — added alongside existing 6 topic tags. Migration: `0004_add_community_categories.py`.
- **Default category changed** from `general` to `discussion`.
- **Navbar simplified** — Community dropdown replaced with a direct `/forum` link. `/notices` removed from main nav (URLs still resolve). `NAV_LINK_DEFS` updated; `COMMUNITY_LINKS`, `communityOpen` state, and `communityRef` removed.
- **`/community` redirect** — `<Navigate to="/forum" replace />` added in `App.jsx` for backwards compatibility.
- **Hint text on create form** — intent tags show a descriptive hint below the category selector to guide post type choice.
- **Filter pill divider** — thin vertical separator on ForumPage separates intent tags from topic tags visually.
- **i18n** — `nav.community` key added: English "Community", Nepali "समुदाय".

### Site declutter (2026-08-29) — commit 22e77d8
- **Settlement guides consolidated** — 5 separate guide pages (BankingPage, HealthPage, TaxPage, WorkRightsPage, ChildcarePage) merged into a single `GuidesPage` at `/guides/:topic`. Tab bar switches topic; `GuideContent` remounts via `key={activeKey}` to reset IntersectionObserver state. Old URLs redirect to their `/guides/<topic>` equivalent for backwards compat.
- **`/looking-for` removed** — route redirects to `/forum?category=looking_for`. LookingForPage no longer linked anywhere.
- **`/points` removed** — PointsPage and route removed entirely; points are still tracked on the backend but there is no redemption mechanism, so the page had no value.
- **BottomNav** — Events tab replaced with Community (`/forum`); icon changed to `ChatCircleDotsIcon`.
- **Footer trimmed** — Explore column: removed Notices, Looking For Board, Services (now 5 links). Guides column: 9 individual guide links collapsed to 5 (kept Send Money, Visa Hub, New to Australia, WhatsApp Groups; added "Settlement Guides" → `/guides/banking`). Account column: removed Points.
- **Homepage** — Notices section and its `useQuery` call removed; notices page still accessible directly at `/notices` but no longer shown on homepage or main nav.

### Phase 10 — Android APK (2026-09-02)
- **Capacitor setup** — `frontend/capacitor.config.ts` created; app ID `com.nepsaathi.app`, `webDir: dist`, `androidScheme: https`. `frontend/android/` generated by `npx cap add android`.
- **Custom branding** — app icon and splash screen generated from `frontend/assets/icon-only.png` and `frontend/assets/splash.png` via `@capacitor/assets`. Adaptive icon XMLs removed to prevent default robot icon override.
- **CORS** — `https://localhost` added to Railway `CORS_ALLOWED_ORIGINS` so Android WebView requests reach the backend.
- **Native Google Login** — `@codetrix-studio/capacitor-google-auth` plugin added. `GoogleLoginButton.jsx` branches on `Capacitor.isNativePlatform()`: native uses plugin, web uses `@react-oauth/google` popup. Two Android OAuth clients in Google Cloud Console (debug + release SHA-1).
- **Persistent login** — access token stored in `localStorage` on native (not `sessionStorage`) so user stays logged in after app restart.
- **Release signing** — keystore at `~/nepsaathi-release.keystore` (alias: nepsaathi). APK output renamed to `nepsaathi-release.apk` via `archivesBaseName` in `build.gradle`.
- **`.npmrc`** — `legacy-peer-deps=true` added to fix CI `npm ci` failure caused by `@codetrix-studio/capacitor-google-auth` peer dep conflict with Capacitor 8.
- **Mobile responsiveness sweep** — navbar mobile menu made scrollable (fixed + overflow-y auto); StatsBar responsive; ProfilePage, RegisterBusinessPage outer padding reduced on mobile; LoginPage touch target fix; VisaHubPage media queries added; AdminPanelPage chart grids collapse on mobile.
- **BottomNav redesign** — Phosphor SVG icons replaced with emoji (🏠💼🛏️💬); Home tab added; Businesses tab removed.

### Removed features
- **Visa Tracker** (removed 2026-07-12) — application tracking, document expiry alerts, GSM points calculator, community processing times board. Removed after decision to descope: all backend models, migrations, management commands, email functions, frontend pages, routes, and nav/footer links deleted.
- **Looking For Board** (`/looking-for`, removed 2026-08-29) — standalone reverse-request board merged into Community Forum (`/forum?category=looking_for`). Backend `community` app and API endpoints untouched.
- **PointsPage** (`/points`, removed 2026-08-29) — points balance and referral UI removed from frontend. Points are still accrued on the backend (`PointEvent` history table intact) but no public-facing redemption mechanism exists.
