# Git Repository Setup Verification Script
Write-Host "=== Git Repository Status ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Remote URL:" -ForegroundColor Yellow
git remote get-url origin
Write-Host ""

Write-Host "Current Branch:" -ForegroundColor Yellow
git branch --show-current
Write-Host ""

Write-Host "Latest Commit:" -ForegroundColor Yellow
git log --oneline -1
Write-Host ""

Write-Host "Unpushed Commits:" -ForegroundColor Yellow
git log origin/main..HEAD --oneline 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote branch doesn't exist yet or no connection" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Create repository at: https://github.com/new" -ForegroundColor White
Write-Host "   Name: sdw-review-app" -ForegroundColor White
Write-Host "2. Then run: git push -u origin main" -ForegroundColor White
Write-Host ""

Write-Host "Or if GitHub CLI is authenticated, run:" -ForegroundColor Cyan
Write-Host "gh repo create sdw-review-app --public --source=. --remote=origin --push" -ForegroundColor White

