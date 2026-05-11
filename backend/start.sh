#!/bin/bash
echo "Collecting static files..."
python3 manage.py collectstatic --noinput
echo "Running migrations..."
python3 manage.py migrate
echo "Starting gunicorn (ASGI + uvicorn workers) on port $PORT..."
exec gunicorn core.asgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WORKERS:-4} --worker-class uvicorn.workers.UvicornWorker --timeout 120