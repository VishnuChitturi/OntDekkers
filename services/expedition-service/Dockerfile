FROM python:3.12-slim

WORKDIR /app

# Copy shared library
COPY shared /app/shared

# Copy service dependencies
COPY services/expedition-service/requirements.txt /app/services/expedition-service/requirements.txt
RUN pip install --no-cache-dir -r services/expedition-service/requirements.txt

# Copy service code
COPY services/expedition-service /app/services/expedition-service

ENV PYTHONPATH=/app

WORKDIR /app/services/expedition-service

CMD ["uvicorn", "app.core.main:app", "--host", "0.0.0.0", "--port", "8000"]
