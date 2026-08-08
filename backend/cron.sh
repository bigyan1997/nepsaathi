#!/bin/bash
set -e
echo "Running expire_listings..."
python manage.py expire_listings
echo "Running expire_featured_businesses..."
python manage.py expire_featured_businesses
echo "Running send_expiry_warnings..."
python manage.py send_expiry_warnings
echo "Running send_event_reminders..."
python manage.py send_event_reminders
echo "Running fetch_remittance_rates..."
python manage.py fetch_remittance_rates
echo "Done."
