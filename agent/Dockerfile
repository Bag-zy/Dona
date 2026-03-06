# Use the official Python slim image as a base
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT=8123

# Create and set the working directory
WORKDIR /app

# Install system dependencies required for building some Python packages (like psycopg2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the agent code into the container
COPY . .

# Expose the port the app runs on
EXPOSE $PORT

# Command to run the FastAPI application using uvicorn
CMD uvicorn serve:app --host 0.0.0.0 --port $PORT
