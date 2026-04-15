FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files with dummy secret key for build only
RUN SECRET_KEY=dummy-build-key-not-used-in-production \
    DEBUG=False \
    DATABASE_URL=sqlite:///dummy.db \
    python manage.py collectstatic --noinput

# Run migrations and start server
CMD python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT