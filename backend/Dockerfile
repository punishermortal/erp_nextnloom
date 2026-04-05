FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for MySQL and build tools
RUN apt-get update && apt-get install -y \
    postgresql-client \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Run migrations and start server with gunicorn
CMD python manage.py migrate && gunicorn nextbloom.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120

