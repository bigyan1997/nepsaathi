"""
Load & Stress Testing with Locust
==================================
Install:  pip install locust
Run load test:   locust -f locustfile.py --host=http://localhost:8000 --users=50 --spawn-rate=5
Run stress test: locust -f locustfile.py --host=http://localhost:8000 --users=200 --spawn-rate=20
Headless:        locust -f locustfile.py --headless --users=50 --spawn-rate=5 --run-time=60s

Three user types are defined:
  - AnonymousBrowser  : unauthenticated read-only traffic (80% of load)
  - AuthenticatedUser : logged-in user doing CRUD (15% of load)
  - HeavyPoster       : user creating many listings/businesses (5% of load)
"""
import random
import string
from datetime import datetime, timedelta, timezone

from locust import HttpUser, between, task, events


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _rand_str(n=8):
    return ''.join(random.choices(string.ascii_lowercase, k=n))


def _rand_email():
    return f'load_{_rand_str(10)}@test.nepsaathi.com'


def _future_date():
    dt = datetime.now(tz=timezone.utc) + timedelta(days=random.randint(7, 120))
    return dt.strftime('%Y-%m-%dT%H:%M:%SZ')


STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']
JOB_TYPES = ['full_time', 'part_time', 'casual', 'contract', 'internship']
ROOM_TYPES = ['private', 'shared', 'entire', 'studio']
BUSINESS_CATEGORIES = [
    'restaurant', 'grocery', 'travel', 'beauty', 'health',
    'legal', 'education', 'religious', 'retail', 'other',
]
EVENT_CATEGORIES = ['cultural', 'sports', 'food', 'music', 'religious', 'community']


# ─── Anonymous Browser (read-only) ────────────────────────────────────────────

class AnonymousBrowser(HttpUser):
    """
    Simulates a visitor browsing listings without logging in.
    Represents ~80% of real traffic.
    """
    wait_time = between(1, 4)
    weight = 80

    @task(5)
    def browse_listings(self):
        state = random.choice(STATES)
        self.client.get(f'/api/listings/?state={state}', name='/api/listings/')

    @task(4)
    def browse_jobs(self):
        self.client.get(
            f'/api/jobs/?state={random.choice(STATES)}',
            name='/api/jobs/',
        )

    @task(3)
    def browse_rooms(self):
        self.client.get(
            f'/api/rooms/?state={random.choice(STATES)}',
            name='/api/rooms/',
        )

    @task(3)
    def browse_events(self):
        self.client.get('/api/events/', name='/api/events/')

    @task(3)
    def browse_businesses(self):
        self.client.get(
            f'/api/businesses/?category={random.choice(BUSINESS_CATEGORIES)}',
            name='/api/businesses/',
        )

    @task(4)
    def search_listings(self):
        terms = ['cook', 'driver', 'room', 'nepali', 'sydney', 'melbourne']
        q = random.choice(terms)
        self.client.get(f'/api/listings/search/?q={q}', name='/api/listings/search/')

    @task(2)
    def search_suggestions(self):
        self.client.get(
            '/api/listings/search-suggestions/?q=ne',
            name='/api/listings/search-suggestions/',
        )

    @task(2)
    def view_exchange_rates(self):
        self.client.get('/api/exchange/', name='/api/exchange/')

    @task(1)
    def paginate_listings(self):
        page = random.randint(1, 5)
        self.client.get(f'/api/listings/?page={page}', name='/api/listings/?page=N')

    @task(1)
    def filter_jobs_by_type(self):
        jtype = random.choice(JOB_TYPES)
        self.client.get(f'/api/jobs/?job_type={jtype}', name='/api/jobs/?job_type=X')


# ─── Authenticated User ────────────────────────────────────────────────────────

class AuthenticatedUser(HttpUser):
    """
    Simulates a logged-in user: browses, saves listings, reads messages.
    Represents ~15% of real traffic.
    """
    wait_time = between(2, 6)
    weight = 15

    def on_start(self):
        """Register and log in once per simulated user."""
        self.email = _rand_email()
        self.password = 'LoadTest999!'
        self.access_token = None
        self.refresh_token = None
        self._register_and_login()

    def _register_and_login(self):
        r = self.client.post(
            '/api/auth/registration/',
            json={
                'email': self.email,
                'password1': self.password,
                'password2': self.password,
                'first_name': 'Load',
                'last_name': 'Tester',
            },
            name='/api/auth/registration/ [setup]',
        )
        if r.status_code not in (200, 201):
            return

        r = self.client.post(
            '/api/auth/login/',
            json={'email': self.email, 'password': self.password},
            name='/api/auth/login/ [setup]',
        )
        if r.status_code == 200:
            data = r.json()
            self.access_token = data.get('access')
            self.refresh_token = data.get('refresh')

    def _auth_headers(self):
        return {'Authorization': f'Bearer {self.access_token}'} if self.access_token else {}

    def _refresh_token_if_needed(self):
        if not self.refresh_token:
            return
        r = self.client.post(
            '/api/auth/token/refresh/',
            json={'refresh': self.refresh_token},
            name='/api/auth/token/refresh/',
        )
        if r.status_code == 200:
            data = r.json()
            self.access_token = data.get('access')
            self.refresh_token = data.get('refresh', self.refresh_token)

    @task(5)
    def view_profile(self):
        self.client.get(
            '/api/users/profile/',
            headers=self._auth_headers(),
            name='/api/users/profile/',
        )

    @task(4)
    def view_my_listings(self):
        self.client.get(
            '/api/listings/my-listings/',
            headers=self._auth_headers(),
            name='/api/listings/my-listings/',
        )

    @task(3)
    def view_saved_listings(self):
        self.client.get(
            '/api/listings/saved/',
            headers=self._auth_headers(),
            name='/api/listings/saved/',
        )

    @task(3)
    def view_messages(self):
        self.client.get(
            '/api/messages/',
            headers=self._auth_headers(),
            name='/api/messages/',
        )

    @task(2)
    def view_unread_count(self):
        self.client.get(
            '/api/messages/unread-count/',
            headers=self._auth_headers(),
            name='/api/messages/unread-count/',
        )

    @task(2)
    def view_saved_searches(self):
        self.client.get(
            '/api/listings/saved-searches/',
            headers=self._auth_headers(),
            name='/api/listings/saved-searches/',
        )

    @task(2)
    def browse_jobs(self):
        self.client.get('/api/jobs/', name='/api/jobs/')

    @task(2)
    def browse_businesses(self):
        self.client.get('/api/businesses/', name='/api/businesses/')

    @task(1)
    def view_listing_stats(self):
        self.client.get(
            '/api/listings/stats/',
            headers=self._auth_headers(),
            name='/api/listings/stats/',
        )

    @task(1)
    def update_profile(self):
        self.client.patch(
            '/api/users/profile/',
            json={'bio': f'Updated at {_rand_str(5)}'},
            headers=self._auth_headers(),
            name='/api/users/profile/ [PATCH]',
        )

    @task(1)
    def refresh_tokens(self):
        self._refresh_token_if_needed()


# ─── Heavy Poster ──────────────────────────────────────────────────────────────

class HeavyPoster(HttpUser):
    """
    Simulates a power user creating many listings and businesses.
    Represents ~5% of real traffic. Used to test write-path throughput.
    """
    wait_time = between(3, 8)
    weight = 5

    def on_start(self):
        self.email = _rand_email()
        self.password = 'HeavyPoster999!'
        self.access_token = None
        self.refresh_token = None
        self._register_and_login()
        self._created_listings = []
        self._created_businesses = []

    def _register_and_login(self):
        r = self.client.post(
            '/api/auth/registration/',
            json={
                'email': self.email,
                'password1': self.password,
                'password2': self.password,
                'first_name': 'Heavy',
                'last_name': 'Poster',
            },
            name='/api/auth/registration/ [setup]',
        )
        if r.status_code not in (200, 201):
            return
        r = self.client.post(
            '/api/auth/login/',
            json={'email': self.email, 'password': self.password},
            name='/api/auth/login/ [setup]',
        )
        if r.status_code == 200:
            data = r.json()
            self.access_token = data.get('access')
            self.refresh_token = data.get('refresh')

    def _auth_headers(self):
        return {'Authorization': f'Bearer {self.access_token}'} if self.access_token else {}

    @task(4)
    def post_job(self):
        r = self.client.post(
            '/api/jobs/create/',
            json={
                'title': f'Job {_rand_str(6)}',
                'description': f'Looking for a {_rand_str(8)} professional.',
                'location': 'Sydney',
                'state': random.choice(STATES),
                'contact_email': self.email,
                'job_type': random.choice(JOB_TYPES),
                'salary_type': 'hourly',
                'salary': str(random.randint(20, 60)),
            },
            headers=self._auth_headers(),
            name='/api/jobs/create/',
        )
        if r.status_code in (200, 201):
            data = r.json()
            listing_slug = data.get('listing', {}).get('slug') or data.get('slug')
            if listing_slug:
                self._created_listings.append(listing_slug)

    @task(3)
    def post_room(self):
        r = self.client.post(
            '/api/rooms/create/',
            json={
                'title': f'Room {_rand_str(6)}',
                'description': 'Clean furnished room available now.',
                'location': 'Melbourne',
                'state': random.choice(STATES),
                'contact_email': self.email,
                'room_type': random.choice(ROOM_TYPES),
                'price': str(random.randint(150, 400)),
                'furnishing': 'furnished',
                'bond': '4_weeks',
            },
            headers=self._auth_headers(),
            name='/api/rooms/create/',
        )

    @task(2)
    def post_event(self):
        self.client.post(
            '/api/events/create/',
            json={
                'title': f'Event {_rand_str(6)}',
                'description': 'Community gathering for Nepalese people.',
                'location': 'Brisbane',
                'state': random.choice(STATES),
                'contact_email': self.email,
                'category': random.choice(EVENT_CATEGORIES),
                'event_date': _future_date(),
                'is_free': True,
            },
            headers=self._auth_headers(),
            name='/api/events/create/',
        )

    @task(2)
    def post_business(self):
        r = self.client.post(
            '/api/businesses/create/',
            json={
                'business_name': f'Business {_rand_str(6)}',
                'category': random.choice(BUSINESS_CATEGORIES),
                'description': 'A Nepalese-owned business serving the community.',
                'suburb': 'Parramatta',
                'state': random.choice(STATES),
                'phone': '+61400000000',
            },
            headers=self._auth_headers(),
            name='/api/businesses/create/',
        )
        if r.status_code in (200, 201):
            data = r.json()
            slug = data.get('slug')
            if slug:
                self._created_businesses.append(slug)

    @task(1)
    def delete_old_listing(self):
        if not self._created_listings:
            return
        slug = self._created_listings.pop(0)
        self.client.delete(
            f'/api/listings/{slug}/',
            headers=self._auth_headers(),
            name='/api/listings/<slug>/ [DELETE]',
        )

    @task(1)
    def update_listing(self):
        if not self._created_listings:
            return
        slug = random.choice(self._created_listings)
        self.client.patch(
            f'/api/listings/{slug}/',
            json={'description': f'Updated description {_rand_str(10)}.'},
            headers=self._auth_headers(),
            name='/api/listings/<slug>/ [PATCH]',
        )


# ─── Stress Test Shape ─────────────────────────────────────────────────────────
# To run a ramp-up stress test from CLI:
#
#   locust -f locustfile.py --headless \
#     --host=http://localhost:8000 \
#     --users=500 --spawn-rate=50 --run-time=120s \
#     --html=stress_report.html
#
# Thresholds to watch:
#   - p95 response time < 1000ms for list endpoints
#   - p95 response time < 2000ms for create endpoints
#   - Error rate < 1% under 200 concurrent users
