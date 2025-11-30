# 📋 GitHub Upload Checklist

Before uploading to GitHub, ensure all items are completed:

## ✅ Essential Files

- [x] `.gitignore` - Prevents sensitive files from being committed
- [x] `.env.example` - Template for environment variables
- [x] `README.md` - Comprehensive project documentation
- [x] `LICENSE` - MIT License
- [x] `CONTRIBUTING.md` - Contribution guidelines
- [x] `SECURITY.md` - Security policy
- [x] `requirements.txt` - Python dependencies
- [x] `setup.py` - Automated setup script

## 🔒 Security Checks

- [ ] **CRITICAL**: Remove `.env` file or ensure it's in `.gitignore`
- [ ] Verify no API keys in any committed files
- [ ] Check for hardcoded passwords or secrets
- [ ] Review all Python files for sensitive data
- [ ] Ensure database credentials are not exposed

### Quick Security Scan

```bash
# Check for API keys in code
grep -r "API_KEY" --include="*.py" --include="*.js" --include="*.html"

# Check for hardcoded passwords
grep -r "password\s*=\s*['\"]" --include="*.py"

# Verify .env is gitignored
git check-ignore .env
```

## 🗑️ Files to Exclude (Already in .gitignore)

- [x] `__pycache__/` directories
- [x] `.env` file (contains API keys!)
- [x] Large data files (`data/` folder)
- [x] Model checkpoints
- [x] Jupyter notebooks (`.ipynb`)
- [x] Static generated files
- [x] Upload directories
- [x] Log files

## 📝 Documentation Updates

- [x] Update README.md with:
    - [x] Project description
    - [x] Installation instructions
    - [x] API documentation
    - [x] Usage examples
    - [x] Technology stack
    - [x] Contributing guidelines

- [x] Add inline code comments where needed
- [x] Update docstrings for all functions
- [ ] Add screenshots/GIFs (optional but recommended)

## 🧪 Testing

Before committing:

- [ ] Test all main features:
    - [ ] Drug search works
    - [ ] Drug comparison works
    - [ ] 3D visualization loads
    - [ ] Knowledge graph displays
    - [ ] OCR processes images
    - [ ] AI Copilot responds
    - [ ] Target prediction works

- [ ] Check for errors:
    - [ ] No console errors in browser
    - [ ] No Flask errors in terminal
    - [ ] All API endpoints return valid responses

- [ ] Test with missing data:
    - [ ] App runs without local dataset (uses external APIs)
    - [ ] Handles invalid drug names gracefully
    - [ ] Shows proper error messages

## 🏗️ Code Quality

- [ ] Remove debug print statements (or use logging module)
- [ ] Remove commented-out code
- [ ] Fix any TODO/FIXME comments
- [ ] Follow PEP 8 style guide
- [ ] Add type hints where possible

### Code Cleanup Commands

```bash
# Remove .pyc files
find . -type f -name "*.pyc" -delete

# Remove __pycache__ directories
find . -type d -name "__pycache__" -delete

# Check code style
pip install flake8
flake8 app.py --max-line-length=120
```

## 📦 Repository Structure

Ensure proper structure:

```
medimatch/
├── .gitignore
├── .env.example
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── GITHUB_CHECKLIST.md
├── requirements.txt
├── setup.py
├── app.py
├── chembl_service.py
├── drug_lookup_service.py
├── prescription_routes.py
├── rag_engine.py
├── prescription_ocr/
│   ├── __init__.py
│   ├── config.py
│   ├── gemini_vision.py
│   ├── medical_ner.py
│   └── ...
├── templates/
│   ├── index.html
│   ├── drug_copilot.html
│   ├── prescription_ocr.html
│   ├── target_prediction.html
│   └── visualize_kg.html
└── static/
    └── js/
        └── viewer.js
```

## 🚀 GitHub Setup Steps

### 1. Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: MediMatch drug discovery platform"
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `medimatch`
3. Description: "AI-Powered Drug Discovery Platform"
4. Visibility: Choose Public or Private
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### 3. Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/yourusername/medimatch.git

# Push code
git branch -M main
git push -u origin main
```

### 4. Verify Upload

- [ ] Check all files uploaded correctly
- [ ] Verify .env is NOT in the repo
- [ ] Check README displays properly
- [ ] Test clone on different machine

### 5. Add Repository Settings

- [ ] Add repository description
- [ ] Add topics/tags: `drug-discovery`, `ai`, `flask`, `cheminformatics`, `rdkit`
- [ ] Add website URL (if deployed)
- [ ] Enable Issues
- [ ] Enable Discussions (optional)

### 6. Add Branch Protection (Optional)

- [ ] Require pull request reviews
- [ ] Require status checks to pass
- [ ] Prevent force pushes to main

## ⚠️ CRITICAL: Last-Minute Checks

### Before pushing, run these commands:

```bash
# 1. Verify .env is gitignored
git check-ignore .env
# Should output: .env

# 2. Check what will be committed
git status
# Should NOT show .env, data/, or __pycache__

# 3. Check for sensitive data
git diff --cached | grep -i "api_key\|password\|secret"
# Should show NO results

# 4. Dry run of what will be pushed
git push --dry-run origin main
```

## 📊 Optional Enhancements

After initial upload:

- [ ] Add badges to README (build status, license, etc.)
- [ ] Create GitHub Actions for CI/CD
- [ ] Add issue templates
- [ ] Add pull request template
- [ ] Create GitHub Pages documentation
- [ ] Add code coverage reports
- [ ] Set up automated testing

## 🎯 Post-Upload Tasks

- [ ] Share repository with team
- [ ] Add collaborators
- [ ] Star your own repo 😄
- [ ] Share on social media
- [ ] Create first release/tag
- [ ] Set up project board for issues

## 📞 Support

If you encounter issues:

1. Check this checklist again
2. Review GitHub documentation
3. Ask in GitHub Discussions
4. Open an issue in the repo

---

## 🚨 EMERGENCY: If You Accidentally Commit API Keys

If you accidentally commit `.env` or API keys:

### 1. Immediately Revoke All Keys

- Groq: https://console.groq.com/
- Serper: https://serper.dev/
- Gemini: https://makersuite.google.com/app/apikey

### 2. Remove from Git History

```bash
# Remove .env from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history!)
git push origin --force --all
```

### 3. Get New Keys

- Generate new API keys from providers
- Update your local `.env` file
- NEVER commit it again!

---

## ✅ Final Verification

Run this command to verify everything is ready:

```bash
# Check if .env is properly ignored
git ls-files | grep "\.env$"
# Should return NOTHING

# If it returns .env, you have a problem!
```

---

**Ready to upload?** ✅ Go ahead and push to GitHub!

```bash
git push origin main
```

**Good luck! 🚀**
