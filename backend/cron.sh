#!/bin/bash
set -e

run_jobs() {
  echo "[cron] $(date) — starting jobs"
  python manage.py expire_listings
  python manage.py expire_featured_listings
  python manage.py expire_featured_businesses
  python manage.py send_expiry_warnings
  python manage.py send_event_reminders
  python manage.py fetch_remittance_rates
  echo "[cron] $(date) — done"
}

# Run once immediately on start, then every 6 hours
run_jobs
while true; do
  sleep 21600
  run_jobs
done
