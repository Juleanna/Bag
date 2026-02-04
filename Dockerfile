# Dockerfile for BugTracker
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir \
    gunicorn \
    psycopg2-binary \
    celery \
    redis \
    dj-database-url

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Create non-root user
RUN useradd -m -u 1000 bugtracker && \
    chown -R bugtracker:bugtracker /app
USER bugtracker

EXPOSE 8000

CMD ["gunicorn", "bugtracker.wsgi:application", "--bind", "0.0.0.0:8000"]
