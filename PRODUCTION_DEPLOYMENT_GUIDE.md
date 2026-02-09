# Production Deployment Guide
## Who-Bible User Accounts System

This guide walks through deploying the complete user accounts system to Firebase Hosting with all features enabled.

## Prerequisites

### Required Accounts
- [x] Firebase account (free Spark or paid Blaze plan)
- [x] GitHub account (for repository)
- [x] Domain name (optional, for custom domain)

### Required Software
```bash
# Node.js 14+ and npm
node --version
npm --version

# Firebase CLI
npm install -g firebase-tools
firebase --version

# Git
git --version
```

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
```bash
1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Enter project name: "who-bible-prod"
4. Enable Google Analytics (recommended)
5. Create project
```

### 1.2 Enable Firebase Services

#### Authentication
```bash
1. Navigate to Authentication > Sign-in method
2. Enable Email/Password
3. (Optional) Enable Google sign-in
4. (Optional) Enable email verification
```

#### Firestore Database
```bash
1. Navigate to Firestore Database
2. Click "Create database"
3. Start in production mode
4. Choose database location (closest to users)
5. Create database
```

#### Realtime Database
```bash
1. Navigate to Realtime Database
2. Click "Create Database"
3. Start in locked mode
4. Choose location
```

#### Storage (for avatars)
```bash
1. Navigate to Storage
2. Click "Get started"
3. Use default security rules
4. Choose location
```

#### Hosting
```bash
1. Navigate to Hosting
2. Click "Get started"
3. Follow setup wizard
```

## Step 2: Configure Project

### 2.1 Initialize Firebase in Project
```bash
cd "c:\Users\Joseph.Kasongo\OneDrive - Southwestern College\Documents\Projects\Who-Bible"

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
- Firestore ✓
- Hosting ✓
- Storage ✓
- (Optional) Functions ✓

# Firestore setup:
- Use existing project: who-bible-prod
- Firestore rules: firestore.rules
- Firestore indexes: firestore.indexes.json

# Hosting setup:
- Public directory: . (current directory)
- Single-page app: No
- Automatic builds: No
- File overwrites: No

# Storage setup:
- Storage rules: storage.rules
```

### 2.2 Update Firebase Config

Edit `assets/js/firebase-config.js`:
```javascript
// Get these from Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: "YOUR_PRODUCTION_API_KEY",
  authDomain: "who-bible-prod.firebaseapp.com",
  databaseURL: "https://who-bible-prod-default-rtdb.firebaseio.com",
  projectId: "who-bible-prod",
  storageBucket: "who-bible-prod.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};
```

### 2.3 Configure Security Rules

#### Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    
    function isAdmin() {
      return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    function hasRole(role) {
      return isAdmin() && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == role;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId);
      
      // User sub-collections
      match /games/{gameId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }
      
      match /achievements/{achievementId} {
        allow read: if isSignedIn();
        allow write: if isOwner(userId);
      }
      
      match /badges/{badgeId} {
        allow read: if isSignedIn();
        allow write: if isOwner(userId);
      }
    }
    
    // Friends collection
    match /friends/{friendshipId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && 
        (resource.data.userId1 == request.auth.uid || resource.data.userId2 == request.auth.uid);
    }
    
    // Friend requests collection
    match /friend-requests/{requestId} {
      allow read: if isSignedIn() && 
        (resource.data.fromId == request.auth.uid || resource.data.toId == request.auth.uid);
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.toId == request.auth.uid;
    }
    
    // Friend challenges collection
    match /friend-challenges/{challengeId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
        (resource.data.challengerId == request.auth.uid || resource.data.challengedId == request.auth.uid);
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow write: if isSignedIn();
    }
    
    // Daily challenges collection
    match /daily-challenges/{challengeId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // User daily progress
    match /user-daily-progress/{progressId} {
      allow read, write: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Discussion rooms collection
    match /discussion-rooms/{roomId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.createdBy == request.auth.uid;
    }
    
    // Discussion messages collection
    match /discussion-messages/{messageId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow delete: if isSignedIn() && 
        (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Reports collection
    match /reports/{reportId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isAdmin();
      allow delete: if hasRole('super_admin');
    }
    
    // Admins collection
    match /admins/{adminId} {
      allow read: if isAdmin();
      allow write: if hasRole('super_admin');
    }
    
    // Admin logs collection
    match /admin-logs/{logId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // Moderation logs collection
    match /moderation-logs/{logId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

#### Realtime Database Rules (`database.rules.json`)
```json
{
  "rules": {
    "feedback": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": "auth != null"
    },
    "rooms": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "challenges": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

#### Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // User avatars
    match /avatars/{userId}/{fileName} {
      allow read;
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024  // 5MB max
        && request.resource.contentType.matches('image/.*');
    }
    
    // Other files (admin only)
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

## Step 3: Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime Database rules
firebase deploy --only database

# Deploy Storage rules
firebase deploy --only storage
```

## Step 4: Set Up First Admin

### 4.1 Create Admin Account
```bash
1. Register a new account on the live site
2. Note the UID from Firebase Console > Authentication > Users
```

### 4.2 Add Admin to Firestore
```bash
# In Firebase Console > Firestore Database
# Create document in 'admins' collection:
Document ID: [YOUR_UID]
Fields:
  role: "super_admin" (string)
  addedAt: [Timestamp - now]
  addedBy: "system" (string)
```

## Step 5: Build and Deploy

### 5.1 Pre-Deployment Checklist
- [ ] All code committed to Git
- [ ] Firebase config updated
- [ ] Security rules deployed
- [ ] Environment set to production
- [ ] No console.log() in production code
- [ ] Error tracking configured
- [ ] Analytics enabled

### 5.2 Deploy to Firebase Hosting
```bash
# Deploy entire site
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only database
firebase deploy --only storage
```

### 5.3 Verify Deployment
```bash
# Your site will be live at:
https://who-bible-prod.web.app
# or
https://who-bible-prod.firebaseapp.com
```

## Step 6: Custom Domain Setup (Optional)

### 6.1 Add Custom Domain
```bash
1. Firebase Console > Hosting > Add custom domain
2. Enter your domain: www.who-bible.com
3. Verify ownership (add TXT record to DNS)
4. Add A records to DNS:
   - Host: @ or www
   - Points to: Firebase IPs (provided)
```

### 6.2 Update DNS Records
```bash
# Example DNS settings:
Type  | Host | Value
------|------|-------
A     | @    | 151.101.1.195
A     | @    | 151.101.65.195
TXT   | @    | google-site-verification=...
CNAME | www  | who-bible-prod.web.app.
```

### 6.3 SSL Certificate
```bash
Firebase automatically provisions SSL certificates
Wait 24-48 hours for full propagation
```

## Step 7: Post-Deployment Configuration

### 7.1 Configure Firebase Quotas
```bash
1. Firebase Console > Usage and billing
2. Set budget alerts
3. Monitor quotas:
   - Firestore: 50K reads/day (free tier)
   - Auth: 50 verifications/day (free tier)
   - Storage: 5GB (free tier)
```

### 7.2 Set Up Monitoring
```bash
# Enable Performance Monitoring
1. Firebase Console > Performance
2. Add Performance Monitoring SDK (optional)

# Enable Crashlytics (optional)
1. Firebase Console > Crashlytics
2. Add Crashlytics SDK
```

### 7.3 Configure Analytics
```bash
1. Firebase Console > Analytics
2. Set up conversion events:
   - signup_complete
   - first_quiz
   - achievement_unlocked
   - challenge_completed
```

## Step 8: Testing Production

### 8.1 Smoke Tests
- [ ] Home page loads
- [ ] User can register
- [ ] User can login
- [ ] Quiz works correctly
- [ ] Analytics tracks games
- [ ] Achievements unlock
- [ ] Community features work
- [ ] Admin panel accessible

### 8.2 Performance Tests
```bash
# Run Lighthouse audit
1. Open Chrome DevTools
2. Lighthouse tab
3. Generate report
4. Ensure scores:
   - Performance: 90+
   - Accessibility: 90+
   - Best Practices: 90+
   - SEO: 90+
```

### 8.3 Load Testing (Optional)
```bash
# Use tools like:
- Artillery.io
- Apache JMeter
- k6.io

# Test concurrent users:
- 10 users: Should work smoothly
- 50 users: Monitor Firebase quotas
- 100+ users: Consider upgrading to Blaze plan
```

## Step 9: Monitoring & Maintenance

### 9.1 Daily Checks
```bash
- Check Firebase Console for errors
- Review user reports
- Monitor system health (admin dashboard)
- Check Firebase quota usage
```

### 9.2 Weekly Maintenance
```bash
- Review analytics data
- Check performance metrics
- Update dependencies (if any)
- Backup Firestore data
```

### 9.3 Monthly Tasks
```bash
- Full security audit
- Performance optimization review
- User feedback analysis
- Cost analysis and optimization
```

## Step 10: Scaling Considerations

### When to Upgrade from Spark (Free) to Blaze (Pay-as-you-go)
- Exceeded 50K Firestore reads/day
- Need Cloud Functions
- Need more storage (>5GB)
- Need higher quotas

### Optimization Strategies
```javascript
// 1. Implement query caching
import { cache } from './performance-optimizer.js';

const users = await cache.getOrFetch('all-users', async () => {
  return await getAllUsers();
}, 5 * 60 * 1000); // Cache for 5 minutes

// 2. Use pagination for large lists
const pageSize = 20;
const users = await getUsers(pageSize, lastVisible);

// 3. Lazy load non-critical features
await lazyLoad('./friend-challenges.js');

// 4. Optimize images
// Use WebP format, compress, lazy load

// 5. Minimize Firestore reads
// Batch reads, use listeners efficiently
```

### CDN Configuration
```bash
# Firebase Hosting automatically uses CDN
# Additional optimizations:
1. Set cache headers in firebase.json
2. Optimize static assets
3. Minify CSS/JS (build process)
```

## Troubleshooting

### Common Issues

#### Issue: "Permission denied" errors
**Solution**: Check Firestore security rules, ensure user is authenticated

#### Issue: Firebase quotas exceeded
**Solution**: Optimize queries, implement caching, upgrade plan

#### Issue: Slow page load
**Solution**: Check network waterfall, optimize images, lazy load modules

#### Issue: Admin panel not accessible
**Solution**: Verify admin UID in Firestore `admins` collection

#### Issue: Authentication not working
**Solution**: Check Firebase config, ensure Authentication is enabled

## Rollback Plan

### If Deployment Fails
```bash
# Rollback to previous version
firebase hosting:rollback

# Rollback specific service
firebase deploy --only firestore:rules --version PREVIOUS_VERSION
```

### Emergency Procedures
```bash
1. Disable problematic features via Feature Flags
2. Show maintenance page
3. Restore from backup (Firestore export)
4. Fix issue locally
5. Test thoroughly
6. Redeploy
```

## Backup & Recovery

### Automated Backups
```bash
# Set up scheduled Firestore exports
1. Firebase Console > Firestore Database
2. Enable automated backups (Blaze plan)
3. Schedule: Daily at 2 AM UTC
4. Export to Cloud Storage bucket
```

### Manual Backup
```bash
# Export Firestore collection
gcloud firestore export gs://[BUCKET_NAME] --collection-ids=users,friends,challenges

# Import Firestore collection
gcloud firestore import gs://[BUCKET_NAME]/[EXPORT_FOLDER]
```

## Security Checklist

- [ ] Firebase API keys restricted (Console > Settings > API restrictions)
- [ ] Security rules thoroughly tested
- [ ] HTTPS enforced (automatic with Firebase Hosting)
- [ ] XSS protection implemented
- [ ] Input validation active
- [ ] Rate limiting configured (Cloud Functions)
- [ ] Admin accounts secured with 2FA
- [ ] Sensitive data encrypted
- [ ] Regular security audits scheduled

## Cost Estimation

### Free Tier (Spark Plan)
```
Authentication: 50 verifications/day
Firestore: 50K reads, 20K writes, 20K deletes/day
Storage: 5GB
Hosting: 10GB storage, 360MB/day bandwidth
Realtime Database: 1GB storage, 10GB/month bandwidth

Estimated users: 100-500 daily active users
```

### Paid Tier (Blaze Plan)
```
Pay only for what you use:
Firestore: $0.06 per 100K reads
Authentication: $0.0055 per verification (after 50/day)
Storage: $0.026/GB/month
Hosting: $0.15/GB bandwidth

Estimated cost for 1,000 DAU: $10-30/month
Estimated cost for 10,000 DAU: $100-300/month
```

## Support & Resources

### Documentation
- Firebase Docs: https://firebase.google.com/docs
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/rules-structure
- Firebase Hosting: https://firebase.google.com/docs/hosting

### Community
- Firebase Slack: https://firebase.community
- Stack Overflow: [firebase] tag
- GitHub Issues: (your repository)

### Contact
- Firebase Support: https://firebase.google.com/support
- Project Admin: [your email]

## Conclusion

Your Who-Bible user accounts system is now live! Monitor performance, respond to user feedback, and iterate based on analytics. The system is designed to scale with your user base while maintaining performance and security.

**🎉 Congratulations on deploying a complete user accounts system!**

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Maintainer**: Who-Bible Development Team
