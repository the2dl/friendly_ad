FROM python:3.11-slim

# Install system dependencies required for python-ldap and compilation
RUN apt-get update && apt-get install -y \
    libldap2-dev \
    libsasl2-dev \
    gcc \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -U appuser

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create and set permissions for data directory
RUN mkdir -p /app/data && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Create volume mount point for the database
VOLUME ["/app/data"]

# Expose the port the app runs on
EXPOSE 5001

CMD ["python", "main.py"]