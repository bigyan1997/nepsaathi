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

# Collect static files with dummy values for build only
RUN SECRET_KEY=dummy-build-key \
    DEBUG=False \
    DATABASE_URL=sqlite:///dummy.db \
    GOOGLE_CLIENT_ID=dummy \
    GOOGLE_CLIENT_SECRET=dummy \
    CLOUDINARY_CLOUD_NAME=dummy \
    CLOUDINARY_API_KEY=dummy \
    CLOUDINARY_API_SECRET=dummy \
    python manage.py collectstatic --noinput

# Make start script executable
RUN chmod +x start.sh

# Start server
CMD ["bash", "start.sh"]