#!/bin/bash

run_cmd() {
  echo "[cron] running: $*"
  "$@" || echo "[cron] FAILED: $*"
}

run_jobs() {
  echo "[cron] $(date) — starting jobs"
  run_cmd python manage.py expire_listings
  run_cmd python manage.py expire_featured_listings
  run_cmd python manage.py expire_featured_businesses
  run_cmd python manage.py send_expiry_warnings
  run_cmd python manage.py send_featured_warnings
  run_cmd python manage.py send_event_reminders
  run_cmd python manage.py fetch_remittance_rates
  run_cmd python manage.py purge_deleted_listings
  echo "[cron] $(date) — done"
}

# Run once immediately on start, then every 6 hours
run_jobs
while true; do
  sleep 21600
  run_jobs
done
