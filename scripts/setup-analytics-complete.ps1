# PowerShell script for Windows
Write-Host "🚀 Setting up Kancil AI Analytics from scratch..." -ForegroundColor Green
Write-Host ""

# Step 1: Fresh database setup
Write-Host "1️⃣ Setting up fresh database..." -ForegroundColor Yellow
npm run setup-fresh
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database setup failed" -ForegroundColor Red
    exit 1
}

# Step 2: Create analytics table
Write-Host ""
Write-Host "2️⃣ Creating analytics table..." -ForegroundColor Yellow
Write-Host "Please run this SQL in pgAdmin:" -ForegroundColor Cyan
Write-Host "   File: database/create-student-analytics.sql" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter after running the SQL script"

# Step 3: Run main seeding
Write-Host ""
Write-Host "3️⃣ Running main seeding..." -ForegroundColor Yellow
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Main seeding failed" -ForegroundColor Red
    exit 1
}

# Step 4: Run analytics seeding
Write-Host ""
Write-Host "4️⃣ Running analytics seeding..." -ForegroundColor Yellow
node scripts/seed-analytics.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Analytics seeding failed" -ForegroundColor Red
    exit 1
}

# Step 5: Start server
Write-Host ""
Write-Host "5️⃣ Starting development server..." -ForegroundColor Yellow
Write-Host "You can now test the API:" -ForegroundColor Green
Write-Host "   GET {{baseUrl}}/student-analytics/teacher/reports" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Setup completed successfully!" -ForegroundColor Green

npm run dev