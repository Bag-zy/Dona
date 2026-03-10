# Dona Blog Agent - Docker image for Render deployment
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port that LangGraph uses
EXPOSE 8123

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the LangGraph server
CMD ["langgraph", "dev", "--host", "0.0.0.0", "--port", "8123"]
