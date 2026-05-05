# 📋 Quick Reference Guide

## Folder Structure & File Purposes

```
nr_realty_optimized/
├── index.html                    # Main HTML - edit for content changes
├── styles.css                    # Stylesheets - edit for design changes  
├── script.js                     # JavaScript - edit for interaction changes
├── images/                       # Image files - add/remove images here
├── .htaccess                     # Apache server rules (copy to server)
├── build.py                      # Build script - creates dist/ folder
├── deploy.sh                     # Deployment script - uploads to server
│
├── 📖 Documentation
│   ├── README.md                 # Start here!
│   ├── DEPLOYMENT_GUIDE.md       # How to deploy
│   ├── OPTIMIZATION_SUMMARY.md   # What was optimized
│   ├── QUICK_REFERENCE.md        # This file
│   ├── nginx.conf.example        # For Nginx servers
│
└── dist/                         # Production build (ready to upload)
    ├── index.html
    ├── styles.min.css
    ├── script.min.js
    ├── .htaccess
    └── images/
```

## Quick Commands

### Build Production Version
```bash
cd nr_realty_optimized
python3 build.py
# Creates optimized dist/ folder
```

### Deploy to Server (Easy - FTP)
1. Download FileZilla
2. Connect with FTP credentials
3. Upload everything from `dist/` folder
4. Done!

### Deploy to Server (Command Line)
```bash
# Option 1: rsync
rsync -avz dist/ user@host:/var/www/html/

# Option 2: scp
scp -r dist/* user@host:/var/www/html/

# Option 3: Using deploy script
chmod +x deploy.sh
./deploy.sh user@host /var/www/html
```

## File Sizes

| File | Size | Purpose |
|------|------|---------|
| index.html | 90 KB | Website content |
| styles.css | 33 KB | Design/layout |
| script.js | 7.1 KB | Interactive features |
| images/ | 10.3 MB | 47 product photos |
| **Total** | **10.5 MB** | Complete website |

## Key Features

### Enabled
✅ Lazy loading - images load on scroll
✅ Browser caching - fast repeat visits
✅ Gzip compression - smaller file sizes
✅ Security headers - protection
✅ Responsive design - works on mobile
✅ Cache busting - always loads latest

### Disabled (by design)
❌ Large base64 images (extracted)
❌ Inline CSS/JS (separated)
❌ Auto-reload all files (smart caching)

## Common Edits

### Change Contact Email
Edit `script.js` - find `sendForm()` function and update email address

### Update Project Info
Edit `index.html` - find project cards and update text/images

### Change Colors
Edit `styles.css` - find `:root` section at top and modify color variables

### Update Navigation Links
Edit `index.html` - find `.nav-links` section and update href attributes

## Testing Checklist

Before going live:
- [ ] Open index.html locally in browser
- [ ] Click all navigation links
- [ ] Scroll to trigger image lazy loading
- [ ] Test on mobile device
- [ ] Check that form has backend handler
- [ ] Verify Google Maps loads
- [ ] No errors in console (F12)

## Performance Tips

✅ **Enable HTTPS** - Secure connection (required)
✅ **Use CDN** - Serve images from edge locations
✅ **Enable Compression** - .htaccess already configured
✅ **Minify Resources** - build.py does this
✅ **Cache Properly** - .htaccess handles this
✅ **Monitor Speed** - Use Google PageSpeed Insights

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Images broken | Check images/ folder uploaded |
| Styles missing | Hard refresh (Ctrl+Shift+R) |
| Forms not working | Need backend form handler |
| Slow loading | Check image compression |
| Mobile broken | Check responsive CSS rules |
| 404 errors | Verify file paths and uploads |

## File Permissions (Server)

```bash
# Directories - readable
chmod 755 /var/www/html/nr-realty

# Files - readable only
chmod 644 /var/www/html/nr-realty/*

# .htaccess - readable only
chmod 644 /var/www/html/.htaccess
```

## Deployment Flow

```
1. Edit files locally (index.html, styles.css, script.js)
   ↓
2. Test in browser
   ↓
3. Run build.py
   ↓
4. Upload dist/ folder to server
   ↓
5. Clear browser cache
   ↓
6. Verify on live domain
```

## Browser Cache Expiry

| File Type | Cache Duration |
|-----------|----------------|
| HTML | 1 hour (updates often) |
| CSS | 1 year (minified, versioned) |
| JavaScript | 1 year (minified, versioned) |
| Images | 1 year (rarely change) |

## Monthly Checklist

- [ ] Check error logs
- [ ] Verify backups created
- [ ] Test form submissions
- [ ] Monitor page speed
- [ ] Update content if needed
- [ ] Check security headers
- [ ] Review analytics

## Emergency Procedures

### Website Down
1. Check server status
2. Verify .htaccess syntax
3. Check file permissions
4. Review server logs
5. Restore from backup if needed

### Content Lost
1. Check server backups
2. Check version control (git)
3. Restore from last backup
4. Update content again

### Security Breach
1. Change FTP passwords
2. Check uploaded files
3. Scan for malware
4. Verify .htaccess security
5. Update SSL certificate if needed

## Performance Goals

**Target Load Times**:
- First visit: < 3 seconds
- Repeat visit: < 1 second
- Mobile: < 4 seconds

**Target Scores**:
- Google PageSpeed: 80+
- Lighthouse Performance: 75+
- Mobile Friendliness: Pass

## Contact Form Setup

If form doesn't work, you need backend handler:

```php
<?php
// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);
    
    // Validate
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die('Invalid email');
    }
    
    // Send email
    mail('contact@yourdomain.com', 
         "New inquiry from $name", 
         $message, 
         "From: $email");
    
    // Redirect or return success
    header('Location: /thank-you.html');
}
?>
```

## Useful Tools

| Tool | Purpose | URL |
|------|---------|-----|
| PageSpeed Insights | Performance metrics | pagespeed.web.dev |
| GTmetrix | Speed testing | gtmetrix.com |
| WebPageTest | Advanced testing | webpagetest.org |
| Search Console | SEO monitoring | search.google.com/search-console |
| FileZilla | FTP upload | filezilla-project.org |
| VS Code | Code editing | code.visualstudio.com |

---

**Version**: 1.0
**Last Updated**: May 5, 2025
**Status**: ✅ Ready for Deployment
