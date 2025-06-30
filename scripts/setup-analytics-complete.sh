#!/bin/bash

echo "🚀 Setting up Kancil AI Analytics from scratch..."
echo ""

# Step 1: Fresh database setup
echo "1️⃣ Setting up fresh database..."
npm run setup-fresh
if [ $? -ne 0 ]; then
    echo "❌ Database setup failed"
    exit 1
fi

# Step 2: Create analytics table
echo ""
echo "2️⃣ Creating analytics table..."
echo "Please run this SQL in pgAdmin:"
echo "   File: database/create-student-analytics.sql"
echo ""
read -p "Press Enter after running the SQL script..."

# Step 3: Run main seeding
echo ""
echo "3️⃣ Running main seeding..."
npm run seed
if [ $? -ne 0 ]; then
    echo "❌ Main seeding failed"
    exit 1
fi

# Step 4: Run analytics seeding
echo ""
echo "4️⃣ Running analytics seeding..."
node scripts/seed-analytics.js
if [ $? -ne 0 ]; then
    echo "❌ Analytics seeding failed"
    exit 1
fi

# Step 5: Start server
echo ""
echo "5️⃣ Starting development server..."
echo "You can now test the API:"
echo "   GET {{baseUrl}}/student-analytics/teacher/reports"
echo ""
echo "✅ Setup completed successfully!"

npm run dev