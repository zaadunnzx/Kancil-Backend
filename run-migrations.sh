#!/bin/bash

# Script untuk menjalankan migrations
echo "Running migrations for Comments and Reactions..."

# Run comments migration
npx sequelize-cli db:migrate --migrations-path ./migrations --migration 20241201000002-create-comments.js

# Run reactions migration  
npx sequelize-cli db:migrate --migrations-path ./migrations --migration 20241201000003-create-reactions.js

echo "Migrations completed!"