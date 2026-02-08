#!/bin/bash
# scripts/setup.sh

echo "Waiting for MySQL to start..."
sleep 10

echo "Seeding Database..."
docker exec -i dino-wallet-db mysql -uuser -ppassword dino_wallet < ./scripts/seed.sql

echo "Database Seeded Successfully!"
