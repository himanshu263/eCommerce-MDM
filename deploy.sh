#!/bin/bash

# Configuration
REPO_URL="https://github.com/himanshu263/eCommerce-MDM.git"
BRANCH="main"

echo "🚀 Starting Deployment Preparation..."

# 1. Update Hashing & Security (Internal Check)
echo "🔍 Checking security configuration..."
if grep -q "pbkdf2_sha256" backend/app/core/security.py; then
    echo "✅ PBKDF2 Hashing is active."
else
    echo "⚠️ Warning: Hashing may not be set to PBKDF2. Please check backend/app/core/security.py."
fi

# 2. Git Workflow
echo "📦 Committing and Pushing to GitHub..."
git add .
read -p "Enter commit message (default: 'chore: automated deploy'): " msg
msg=${msg:-"chore: automated deploy"}
git commit -m "$msg"
git push origin $BRANCH

echo "--------------------------------------------------------"
echo "✅ Changes are now on GitHub!"
echo "--------------------------------------------------------"
echo "📋 Hostinger VPS Deployment Checklist:"
echo "1. Login to Hostinger Docker Manager."
echo "2. Ensure your Project URL uses your Personal Access Token (PAT):"
echo "   https://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@github.com/himanshu263/eCommerce-MDM.git"
echo "3. Click 'Update' or 'Deploy' in Hostinger."
echo "4. After deployment, run the database seeding commands in the VPS terminal."
echo "--------------------------------------------------------"
echo "Done! 🎉"
