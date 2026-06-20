# PowerShell Development startup script for Certificate DApp

Write-Host "🚀 Starting Certificate Verification DApp..." -ForegroundColor Green

Write-Host "`nStep 1: Starting services..." -ForegroundColor Blue
Write-Host "You need to run these commands in separate terminals:" -ForegroundColor Yellow

Write-Host "`n📁 Terminal 1 - Blockchain:" -ForegroundColor Cyan
Write-Host "cd packages\contracts && npm run node" -ForegroundColor White

Write-Host "`n📁 Terminal 2 - Deploy Contracts:" -ForegroundColor Cyan  
Write-Host "cd packages\contracts && npm run deploy" -ForegroundColor White

Write-Host "`n📁 Terminal 3 - Backend API:" -ForegroundColor Cyan
Write-Host "cd packages\backend && npm run dev" -ForegroundColor White

Write-Host "`n📁 Terminal 4 - Frontend:" -ForegroundColor Cyan
Write-Host "cd packages\frontend && npm run dev" -ForegroundColor White

Write-Host "`n🌐 Service URLs:" -ForegroundColor Green
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "Backend:   http://localhost:3001" -ForegroundColor White  
Write-Host "Blockchain: http://localhost:8545" -ForegroundColor White

Write-Host "`n📋 Quick commands from root:" -ForegroundColor Magenta
Write-Host "npm run blockchain" -ForegroundColor White
Write-Host "npm run deploy:contracts" -ForegroundColor White
Write-Host "npm run start:backend" -ForegroundColor White  
Write-Host "npm run start:frontend" -ForegroundColor White
