#!/bin/bash
# infrastructure/postgres/init-databases.sh
#
# Runs on first postgres container start.
# Creates one database per service as required by the database-per-service architecture.
# The POSTGRES_USER/POSTGRES_PASSWORD are set via docker-compose environment.
#
# Add a new CREATE DATABASE line here whenever a new service database is needed.

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Developer 1 databases
    CREATE DATABASE auth_db;
    CREATE DATABASE user_db;

    -- Developer 2 databases
    CREATE DATABASE feed_db;
    CREATE DATABASE community_db;

    -- Developer 3 databases
    CREATE DATABASE trip_db;
    CREATE DATABASE guide_db;

    -- Phase 2 / shared databases
    CREATE DATABASE recommendation_db;
    CREATE DATABASE chat_db;
    CREATE DATABASE notification_db;
    CREATE DATABASE moderation_db;
EOSQL

echo "All service databases created successfully."
