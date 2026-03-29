# Step-by-Step Guide: Push Changes to GitHub

## Step 1: Open Terminal in VS Code

1. In VS Code, press `Ctrl + `` (backtick) or go to **View → Terminal**
2. This will open a terminal at the bottom of your screen

## Step 2: Navigate to the Git Repository

In the terminal, type this command and press Enter:

```bash
cd HU-VMS
```

## Step 3: Check Git Status

See what files have changed:

```bash
git status
```

You should see a list of modified files in red.

## Step 4: Stage All Changes

Add all your changes to be committed:

```bash
git add .
```

The dot (.) means "add all changes"

## Step 5: Commit Your Changes

Create a commit with a descriptive message:

```bash
git commit -m "Add complete settings pages with profile photo upload and dark theme for all roles"
```

## Step 6: Push to GitHub

Push your changes to the main branch:

```bash
git push origin main
```

**OR** if your default branch is called "master":

```bash
git push origin master
```

---

## If You Get an Authentication Error

GitHub requires a Personal Access Token (not password) for authentication.

### Create a Personal Access Token:

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name like "HU-VMS-Development"
4. Select expiration (recommend 90 days)
5. Check the **"repo"** checkbox (this gives full repository access)
6. Scroll down and click **"Generate token"**
7. **COPY THE TOKEN** (you won't see it again!)

### Use the Token:

When git asks for your password, paste the token instead.

**Username:** your-github-username
**Password:** paste-your-token-here

---

## If You Need to Configure Git (First Time)

Set your name and email:

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

## Quick Reference - All Commands in Order

```bash
# 1. Navigate to repository
cd HU-VMS

# 2. Check status
git status

# 3. Add all changes
git add .

# 4. Commit changes
git commit -m "Add complete settings pages with profile photo upload and dark theme for all roles"

# 5. Push to GitHub
git push origin main
```

---

## What's Being Pushed?

✅ **Fuel Station Settings**

- Profile photo upload
- Complete settings functionality
- Dark theme support

✅ **Gate Security Settings**

- Profile photo upload
- Complete settings functionality
- Dark theme support for all 12 pages

✅ **Driver Settings**

- Profile photo upload
- Complete settings functionality
- Dark theme support

✅ **Features Added**

- 6 settings tabs for each role
- Theme switching (light/dark/auto)
- Password validation
- Security settings
- Notification preferences
- System preferences
- Privacy controls
- Export/Reset functionality
- Real-time updates
- localStorage persistence

---

## Troubleshooting

### Problem: "fatal: not a git repository"

**Solution:** Make sure you're in the correct directory. Run:

```bash
cd HU-VMS
```

### Problem: "Permission denied"

**Solution:** You need to authenticate. Use a Personal Access Token (see above).

### Problem: "Your branch is behind"

**Solution:** Pull the latest changes first:

```bash
git pull origin main
```

Then try pushing again.

### Problem: "Merge conflict"

**Solution:** You'll need to resolve conflicts manually. Ask for help if this happens.

---

## After Successful Push

You should see output like:

```
Counting objects: 45, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (45/45), done.
Writing objects: 100% (45/45), 125.50 KiB | 5.02 MiB/s, done.
Total 45 (delta 28), reused 0 (delta 0)
To https://github.com/your-username/HU-VMS.git
   abc1234..def5678  main -> main
```

✅ **Success!** Your changes are now on GitHub!

Visit your repository on GitHub to verify: https://github.com/your-username/HU-VMS

---

## Need Help?

If you encounter any issues:

1. Copy the error message
2. Share it with me
3. I'll help you resolve it

Good luck! 🚀
