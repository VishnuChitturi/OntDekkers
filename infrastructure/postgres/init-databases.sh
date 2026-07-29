#!/usr/bin/env bash
# =============================================================================
# OntDekker — PostgreSQL database bootstrap
#
# Mounted into the postgres container via docker-entrypoint-initdb.d/.
# Executed automatically by the postgres image on a fresh volume.
# Skipped entirely on subsequent container restarts (initdb.d convention).
#
# Creates application databases for Developer 3 services:
#   guide_db      — guide-service
#   trip_db       — expedition-service
#
# Uses `CREATE DATABASE ... WHERE NOT EXISTS` equivalent via psql's
# \gexec approach — fully idempotent and safe to run multiple times.
# =============================================================================
set -e

echo "[init-databases] Creating application databases..."

# psql is available inside the postgres container. $POSTGRES_USER is set
# by the docker-entrypoint environment (defaults to "postgres").

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    SELECT 'CREATE DATABASE guide_db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'guide_db')\gexec

    SELECT 'CREATE DATABASE trip_db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'trip_db')\gexec
EOSQL

echo "[init-databases] Done. Databases: guide_db, trip_db"
