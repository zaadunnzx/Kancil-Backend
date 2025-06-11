@echo off
REM =====================================================
REM KANCIL AI QUIZ SYSTEM SETUP SCRIPT (Windows)
REM Complete setup for new quiz system with seeding
REM =====================================================

echo 🎯 Starting Kancil AI Quiz System Setup...
echo =============================================

REM 1. Run database schema creation
echo 📊 Step 1: Creating quiz system database schema...
echo Please run the following SQL files in pgAdmin Query Tool:
echo 1. database/fix-database-structure.sql
echo 2. database/fix-associations.sql
echo 3. database/create-new-quiz-system.sql
echo.
echo Press Enter after running all SQL scripts...
pause

REM 2. Install dependencies (if needed)
echo 📦 Step 2: Checking dependencies...
npm install

REM 3. Run seeding
echo 🌱 Step 3: Seeding database with sample data...
node scripts/seed.js

echo.
echo ✅ Setup completed successfully!
echo =============================================
echo 🚀 You can now test the quiz system:
echo.
echo 1. Start the server: npm run dev
echo 2. Import Postman collection: postman/Kancil_AI_Complete_Fixed_Collection.json
echo 3. Login with sample credentials (see above)
echo 4. Test quiz endpoints in 'New Quiz System' folder
echo.
echo 📝 Sample Login Credentials:
echo Teacher: teacher@kancil.com / teacher123
echo Student: student1@kancil.com / student123
echo =============================================
pause