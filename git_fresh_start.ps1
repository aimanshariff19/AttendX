# FRESH START - Fix Secret Leak & Push
Write-Host "🛡️ Starting Fresh Git History to clear leaked secrets..."

# 1. Remove the old .git folder (clears history)
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue

# 2. Re-initialize Git
git init
git checkout -b main

# 3. Add files (respecting .gitignore which now has .env)
git add .

# 4. First clean commit
git commit -m "Initial Clean Commit - Full Stack AttendX"

# 5. Re-link to your GitHub
git remote add origin https://github.com/aimanshariff19/AttendX.git

# 6. Force push fresh history
Write-Host "⬆️ Pushing fresh history to GitHub..."
git push origin main --force

Write-Host "✅ GitHub Push Successful & Secrets Cleared from History!"
