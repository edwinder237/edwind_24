# Quick Start Guide - Integration Testing

**5-Minute Setup for Multi-Organization Testing**

---

## 🚀 TL;DR

```bash
# 1. Seed test data
node tests/integration/seed-test-data.js

# 2. Get session cookies (see below)

# 3. Update TEST_ORGS in multi-org-test-suite.js

# 4. Run tests
node tests/integration/multi-org-test-suite.js
```

---

## Step 1: Seed Test Data (2 minutes)

```bash
cd /path/to/EDWIND\ 0.4.3\ redux-refactor
node tests/integration/seed-test-data.js
```

**Save the output!** It contains your TEST_ORGS configuration.

---

## Step 2: Get Session Cookies (2 minutes)

### Method A: Browser DevTools (Easiest)

1. Start dev server: `npm run dev`
2. Open `http://localhost:8081` in browser
3. Login as user in "Test Organization A"
4. Press `F12` (DevTools) → `Application` tab → `Cookies`
5. Find cookie (usually `wos-session`)
6. Copy entire cookie value
7. Logout and repeat for "Test Organization B"

### Method B: Using Network Tab

1. F12 → Network tab
2. Login to the application
3. Find the login/callback request
4. Look at Request Headers → Cookie
5. Copy the session cookie value

---

## Step 3: Configure Tests (1 minute)

Edit `tests/integration/multi-org-test-suite.js`:

Find the `TEST_ORGS` object around line 40 and update:

```javascript
const TEST_ORGS = {
  ORG_A: {
    name: 'Test Organization A',
    sessionCookie: 'PASTE_YOUR_ORG_A_COOKIE_HERE',
    projectId: 123,  // FROM SEED OUTPUT
    participantId: 'abc-uuid',  // FROM SEED OUTPUT
    groupId: 456,  // FROM SEED OUTPUT
    curriculumId: 789,  // FROM SEED OUTPUT
    courseId: 101,  // FROM SEED OUTPUT
    instructorId: 202,  // FROM SEED OUTPUT
    eventId: 303  // FROM SEED OUTPUT
  },
  ORG_B: {
    name: 'Test Organization B',
    sessionCookie: 'PASTE_YOUR_ORG_B_COOKIE_HERE',
    projectId: 124,  // FROM SEED OUTPUT
    participantId: 'def-uuid',  // FROM SEED OUTPUT
    groupId: 457,  // FROM SEED OUTPUT
    curriculumId: 790,  // FROM SEED OUTPUT
    courseId: 102,  // FROM SEED OUTPUT
    instructorId: 203,  // FROM SEED OUTPUT
    eventId: 304  // FROM SEED OUTPUT
  }
};
```

---

## Step 4: Run Tests (< 1 minute)

```bash
node tests/integration/multi-org-test-suite.js
```

**Expected Result (Success):**
```
✅ ALL TESTS PASSED! Multi-tenant isolation is working correctly.

Total Tests: 19
Passed: 19
Failed: 0
Success Rate: 100.0%
```

---

## ⚠️ Troubleshooting

### "Session cookies not configured"
→ You forgot Step 2. Get cookies from browser.

### "Resource IDs not configured"
→ You forgot Step 1. Run seed script.

### "Cannot connect to server"
→ Start dev server: `npm run dev`

### Tests fail with 401
→ Cookies expired. Get fresh cookies (repeat Step 2).

### Tests fail with 404 (all of them)
→ Check resource IDs match seed output.

---

## 📊 What Gets Tested?

| Test Category | Count |
|--------------|-------|
| Cross-org access prevention | 4 tests |
| Participant isolation | 3 tests |
| Group isolation | 3 tests |
| Curriculum isolation | 3 tests |
| Event isolation | 3 tests |
| Same-org access (positive) | 3 tests |
| **TOTAL** | **19 tests** |

---

## ✅ Success Criteria

**All 19 tests must pass.**

If any fail:
1. Note which test failed
2. Check the endpoint implementation
3. Verify it uses `withOrgScope` middleware
4. Verify it uses `scopedFindUnique` for validation

---

## 🔁 Re-running Tests

```bash
# Clean and re-seed
node tests/integration/seed-test-data.js

# Get fresh cookies
# (login again in browser)

# Update TEST_ORGS
# (with new IDs and cookies)

# Run tests
node tests/integration/multi-org-test-suite.js
```

---

## 📚 More Details

For comprehensive documentation, see:
- `tests/integration/README.md` - Full documentation
- `tests/integration/multi-org-test-suite.js` - Test implementation
- `tests/integration/seed-test-data.js` - Seeding logic

---

**Time to Complete:** ~5 minutes
**Prerequisites:** Dev server running, database accessible
**Result:** Comprehensive security validation across 55 endpoints
