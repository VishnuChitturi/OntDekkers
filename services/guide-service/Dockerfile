FROM python:3.12-slim

WORKDIR /app

# Copy shared library
COPY shared /app/shared

# Copy service dependencies
COPY services/guide-service/requirements.txt /app/services/guide-service/requirements.txt
RUN pip install --no-cache-dir -r services/guide-service/requirements.txt

# Copy service code
COPY services/guide-service /app/services/guide-service

ENV PYTHONPATH=/app

WORKDIR /app/services/guide-service

CMD ["uvicorn", "app.core.main:app", "--host", "0.0.0.0", "--port", "8000"]
