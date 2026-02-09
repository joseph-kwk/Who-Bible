# 🔒 Security Quick Reference Guide

**For Developers & System Administrators**

---

## 🚀 Quick Deploy Checklist

Before going live, complete these steps:

```bash
# 1. Deploy Firebase Rules
firebase deploy --only database

# 2. Verify security.js is included
grep -r "security.js" index.html host.html
# Should see: <script src="assets/js/security.js?v=20260116"></script>

# 3. Test XSS protection
# Try joining with name: <script>alert('XSS')</script>
# Should display as text, not execute

# 4. Test rate limiting
# Try creating 10 rooms rapidly
# Should block after 5 attempts

# 5. Verify Firebase rules in console
https://console.firebase.google.com → Realtime Database → Rules tab
```

---

## 🛡️ Security Features Overview

### 1. Input Validation
**Where:** `assets/js/security.js`

```javascript
// Validate player name
const validation = SecurityModule.validatePlayerName(name);
if (!validation.valid) {
  showError(validation.error);
  return;
}

// Always use: validation.value (sanitized)
```

### 2. XSS Protection
**Rule:** Never use `innerHTML` with user data

```javascript
// ❌ BAD - Vulnerable to XSS
element.innerHTML = `<div>${userName}</div>`;

// ✅ GOOD - Safe from XSS
const div = document.createElement('div');
div.textContent = userName;
element.appendChild(div);
```

### 3. Rate Limiting
**Where:** Before any Firebase write operation

```javascript
// Check rate limit before action
if (!RateLimiter.check('actionName', 10)) {
  showToast('Too many attempts', 'error');
  return;
}
// Proceed with action
```

### 4. Firebase Rules
**File:** `database.rules.json`

Key rules:
- ✅ Read: Anyone (needed for joining)
- ✅ Write: Only if game not finished
- ✅ Validation: All data types and lengths
- ✅ Write-once: Responses can't be changed

---

## 📋 Common Tasks

### Add New User Input Field

```javascript
// 1. Create validation function in security.js
validateNewField(input) {
  if (!input || input.length > 100) {
    return { valid: false, error: 'Invalid input' };
  }
  return { valid: true, value: input.trim() };
}

// 2. Use in your code
const validation = SecurityModule.validateNewField(userInput);
if (!validation.valid) {
  showToast(validation.error, 'error');
  return;
}

// 3. Sanitize before displaying
const safe = SecurityModule.sanitizeHTML(validation.value);
```

### Update Firebase Rules

```bash
# 1. Edit database.rules.json
nano database.rules.json

# 2. Test locally (optional)
firebase serve --only database

# 3. Deploy to production
firebase deploy --only database

# 4. Verify in console
https://console.firebase.google.com
```

### Block Profanity

```javascript
// Add words to list in security.js
PROFANITY_LIST: [
  'damn', 'hell', 'crap', 'stupid', 'idiot',
  'yourword1', 'yourword2' // Add here
],

// Used automatically by validatePlayerName()
```

---

## 🔍 Debugging Security Issues

### Player Can't Join

```javascript
// Check console for errors
console.log('[Debug] Room code:', code);
console.log('[Debug] Player name:', name);

// Verify validation passed
const nameValidation = SecurityModule.validatePlayerName(name);
console.log('[Debug] Name validation:', nameValidation);

// Check Firebase rules
// Go to Firebase Console → Database → Rules tab
```

### XSS Attack Detected

```javascript
// 1. Find where innerHTML is used
grep -r "innerHTML" assets/js/host.js

// 2. Replace with textContent
element.textContent = userInput; // Safe

// 3. Or use SecurityModule
element.textContent = SecurityModule.sanitizeHTML(userInput);
```

### Rate Limit Too Strict

```javascript
// Adjust limit in code
if (!RateLimiter.check('createRoom', 10)) { // Was 5, now 10
  // ...
}

// Or reset for testing
RateLimiter.reset('createRoom');
```

---

## 🚨 Incident Response

### If XSS Attack Succeeds

```bash
# 1. Immediate: Take site offline
# Edit index.html: <body><h1>Maintenance Mode</h1></body>

# 2. Find vulnerable code
grep -r "innerHTML.*player" assets/js/

# 3. Fix vulnerability (use textContent)

# 4. Test fix locally
python -m http.server 5500

# 5. Deploy fix
git add .
git commit -m "Security fix: XSS vulnerability"
git push origin main

# 6. Bring site back online
```

### If Database Compromised

```bash
# 1. Immediate: Disable writes
# In Firebase Console: Database → Rules → Set .write: false

# 2. Export data
firebase database:get / > backup.json

# 3. Investigate
# Check database logs in Firebase Console

# 4. Clean compromised data
# Manually in Firebase Console or via script

# 5. Re-enable with strict rules
firebase deploy --only database
```

---

## 📊 Monitoring

### Daily Checks

```javascript
// Run in browser console on host.html

// 1. Check rate limiter stats
console.log('Create room attempts:', RateLimiter.getAttempts('createRoom'));
console.log('Join attempts:', RateLimiter.getAttempts('joinClassroom'));

// 2. Check for old games
const database = firebase.database();
database.ref('classrooms').once('value', snap => {
  const games = snap.val();
  const now = Date.now();
  Object.entries(games).forEach(([code, game]) => {
    const age = (now - game.createdAt) / (1000 * 60 * 60); // hours
    if (age > 24) {
      console.warn(`Old game: ${code} (${age.toFixed(1)}h old)`);
    }
  });
});

// 3. Check Firebase rules active
// Visit: https://console.firebase.google.com → Database → Rules
// Verify last updated date is recent
```

### Weekly Tasks

```bash
# 1. Review Firebase logs
# Firebase Console → Analytics → Events

# 2. Check for security updates
npm outdated

# 3. Run manual cleanup if needed
# In browser console:
DataCleanup.cleanupOldGames(firebase.database(), 24);

# 4. Review error logs
# Check browser console for security warnings
```

---

## 🎓 Security Training

### For Hosts (Teachers/Pastors)

**Best Practices:**
1. ✅ Don't share room codes publicly (prevents trolls)
2. ✅ Monitor lobby for inappropriate names
3. ✅ End game if someone misbehaves
4. ✅ Use new room code each time
5. ✅ Report issues to admin

**Red Flags:**
- 🚩 Player name with HTML tags
- 🚩 Player name with profanity
- 🚩 Multiple players joining rapidly
- 🚩 Unusual characters in names (emojis OK)

### For Developers

**Code Review Checklist:**
- [ ] No `innerHTML` with user data
- [ ] All inputs validated
- [ ] Rate limiting on Firebase writes
- [ ] Sanitize before display
- [ ] Test with malicious inputs

**Security Testing:**
```javascript
// Test 1: XSS
name = '<img src=x onerror="alert(1)">';
// Should display as text

// Test 2: SQL Injection (N/A for Firebase)
// N/A - Firebase not vulnerable

// Test 3: NoSQL Injection
name = '{"$ne": null}';
// Should be rejected or sanitized

// Test 4: Rate limiting
for (let i = 0; i < 20; i++) createRoom();
// Should block after configured limit
```

---

## 📝 Change Log

### Version 1.0 (Jan 16, 2026)
- ✅ Initial security implementation
- ✅ XSS protection added
- ✅ Firebase rules updated
- ✅ Rate limiting implemented
- ✅ Input validation added
- ✅ Data cleanup system
- ✅ Documentation complete

### Planned Updates
- ⏳ CAPTCHA integration (Phase 2)
- ⏳ Advanced logging (Phase 2)
- ⏳ CSP headers (Phase 2)
- ⏳ Report system (Phase 3)

---

## 🔗 Quick Links

**Code Files:**
- [security.js](assets/js/security.js) - Security module
- [host.js](assets/js/host.js) - Host view logic
- [app.js](assets/js/app.js) - Main app logic
- [database.rules.json](database.rules.json) - Firebase rules

**Documentation:**
- [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) - Full audit
- [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md) - Implementation details
- [KAHOOT_CLASSROOM_MODE.md](KAHOOT_CLASSROOM_MODE.md) - Feature docs

**External:**
- [Firebase Console](https://console.firebase.google.com)
- [OWASP XSS Guide](https://owasp.org/www-community/attacks/xss/)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)

---

## 💡 Tips & Tricks

### Performance
```javascript
// Batch Firebase writes
const updates = {};
updates[`classrooms/${code}/players/${id}/name`] = name;
updates[`classrooms/${code}/players/${id}/score`] = 0;
firebase.database().ref().update(updates);
```

### Debugging
```javascript
// Enable verbose logging
SecurityModule.debug = true;
RateLimiter.debug = true;

// View all rate limits
console.table(Array.from(RateLimiter.limits.entries()));
```

### Testing
```javascript
// Reset rate limits for testing
RateLimiter.clearAll();

// Manually trigger cleanup
DataCleanup.cleanupOldGames(firebase.database(), 0); // 0 hours = all
```

---

## 📞 Support

**Questions?**
- Check [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md)
- Review code comments in `security.js`
- Test in browser console

**Found a vulnerability?**
- Document steps to reproduce
- Don't exploit it!
- Report immediately to security team
- Wait for fix before disclosing publicly

---

**Last Updated:** January 16, 2026  
**Security Level:** 🟢 PRODUCTION-READY  
**Maintained By:** Development Team
