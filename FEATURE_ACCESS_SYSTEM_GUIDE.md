# Feature Access Control System - Complete Guide

## Overview

You now have a **centralized feature access control system** that manages features, subscriptions, permissions, and resource limits in ONE maintainable place.

## ✅ What's Been Implemented

### 1. Database Schema (3 New Tables)
- **`subscription_plans`** - Master plan definitions (Free, Pro, Enterprise)
- **`subscriptions`** - Organization subscriptions with custom overrides
- **`subscription_history`** - Complete audit trail of all subscription changes

### 2. Centralized Feature Configuration
**File:** `src/lib/features/featureAccess.js`

**THIS IS YOUR SINGLE SOURCE OF TRUTH**

Contains:
- 40+ features cataloged with metadata
- 3 subscription tiers (Free, Pro, Enterprise)
- Resource limits per tier
- Complete access checking functions

### 3. Subscription Service Layer
**File:** `src/lib/features/subscriptionService.js`

Handles:
- CRUD operations for subscriptions
- Resource usage tracking
- Subscription caching (15min TTL)
- Audit history tracking

### 4. Backend Feature Middleware
**File:** `src/lib/features/featureMiddleware.js`

Provides:
- `requireFeature()` - Protect entire API routes
- `requireResourceCapacity()` - Enforce limits
- `checkFeatureAccess()` - Manual checks
- `requireFeatureAndResource()` - Combined protection

### 5. React Hooks for Frontend
**File:** `src/lib/features/useFeatureAccess.js`

Includes:
- `useFeatureAccess()` - Check feature availability
- `useResourceLimit()` - Check resource limits
- `useSubscription()` - Get subscription info
- `useResourceUsage()` - Get usage summary
- `useFeatureFlag()` - Conditional rendering
- `withFeatureAccess()` - HOC wrapper

### 6. Database Seeding
- ✅ 3 subscription plans created in database
- ✅ All existing organizations assigned to Enterprise plan

## 🎯 Current Status

**Your Organizations:**
- Solution Media 360: Enterprise Plan (active)
- Test Organization: Enterprise Plan (active)

**Both organizations have:**
- ✅ Unlimited projects
- ✅ Unlimited participants
- ✅ All 36 enterprise features
- ✅ All advanced features (API access, SSO, white-label, etc.)

---

## 📖 How To Use

### Adding a New Feature

**Step 1:** Add to `src/lib/features/featureAccess.js`

```javascript
export const FEATURES = {
  // ... existing features

  my_new_feature: {
    key: 'my_new_feature',
    name: 'My New Feature',
    description: 'Does something amazing',
    category: FEATURE_CATEGORIES.PROJECTS,
    plans: ['pro', 'enterprise'],  // Available in these plans
    roles: ['Admin', 'Project Manager'],
    permissions: ['my_feature:access']
  }
};
```

**Step 2:** Add to plan definitions in the same file

```javascript
export const PLAN_DEFINITIONS = {
  [PLAN_IDS.PRO]: {
    // ... existing config
    features: [
      // ... existing features
      'my_new_feature'  // Add here
    ]
  }
};
```

**That's it!** The feature is now protected everywhere.

---

### Protecting an API Route

**Option 1: Wrapper Pattern (Recommended)**

```javascript
// src/pages/api/features/bulk-import.js
import { requireFeature } from '@/lib/features/featureMiddleware';

export default requireFeature('bulk_participant_import')(async (req, res) => {
  // Feature guaranteed available
  // req.subscription, req.userClaims, req.organizationId available

  // Process bulk import...
  res.json({ success: true });
});
```

**Option 2: Manual Check**

```javascript
// src/pages/api/features/custom.js
import { checkFeatureAccess } from '@/lib/features/featureMiddleware';

export default async function handler(req, res) {
  const access = await checkFeatureAccess(req, res, 'advanced_analytics');

  if (!access.canAccess) {
    return res.status(403).json({
      error: access.message,
      upgradeUrl: '/upgrade'
    });
  }

  // Proceed...
}
```

**Option 3: With Resource Limits**

```javascript
import { requireResourceCapacity } from '@/lib/features/featureMiddleware';
import { RESOURCES } from '@/lib/features/featureAccess';

export default requireResourceCapacity(RESOURCES.PROJECTS, 1)(async (req, res) => {
  // Guaranteed to have capacity for 1 more project
  // Create project...
  res.json({ success: true });
});
```

---

### Frontend Usage

**Example 1: Conditional Rendering**

```jsx
import { useFeatureAccess } from '@/lib/features/useFeatureAccess';

function BulkImportButton() {
  const { canAccess, loading, requiredPlan } = useFeatureAccess('bulk_participant_import');

  if (loading) return <Skeleton />;

  if (!canAccess) {
    return (
      <Tooltip title={`Requires ${requiredPlan} plan`}>
        <Button disabled startIcon={<LockIcon />}>
          Bulk Import (Upgrade Required)
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button onClick={handleBulkImport} startIcon={<UploadIcon />}>
      Bulk Import
    </Button>
  );
}
```

**Example 2: Resource Limits**

```jsx
import { useResourceLimit } from '@/lib/features/useFeatureAccess';

function CreateProjectButton() {
  const { canCreate, current, limit, percentUsed, loading } = useResourceLimit('projects');

  if (loading) return <Skeleton />;

  return (
    <Box>
      <Button
        disabled={!canCreate}
        onClick={handleCreateProject}
      >
        Create Project
      </Button>
      <LinearProgress
        variant="determinate"
        value={percentUsed}
        color={percentUsed > 80 ? 'error' : 'primary'}
      />
      <Typography variant="caption">
        {current} / {limit === -1 ? '∞' : limit} projects used
      </Typography>
    </Box>
  );
}
```

**Example 3: Feature Flags in Navigation**

```jsx
import { useFeatureFlag } from '@/lib/features/useFeatureAccess';

function NavigationMenu() {
  const bulkImport = useFeatureFlag('bulk_participant_import');
  const analytics = useFeatureFlag('advanced_analytics');
  const apiAccess = useFeatureFlag('api_access');

  return (
    <Menu>
      <MenuItem>Dashboard</MenuItem>
      <MenuItem>Projects</MenuItem>
      {bulkImport.show && <MenuItem>Bulk Import</MenuItem>}
      {analytics.show && <MenuItem>Analytics</MenuItem>}
      {apiAccess.show && <MenuItem>API Keys</MenuItem>}
    </Menu>
  );
}
```

**Example 4: HOC Wrapper**

```jsx
import { withFeatureAccess } from '@/lib/features/useFeatureAccess';

const AdvancedAnalytics = withFeatureAccess(
  'advanced_analytics',
  UpgradePromptComponent
)(function Analytics() {
  return (
    <Box>
      <h1>Advanced Analytics Dashboard</h1>
      {/* Dashboard content */}
    </Box>
  );
});
```

---

## 📊 Available Features

### Free Tier (3 projects, 50 participants)
- Basic project management
- Basic participant management
- Basic courses
- Basic reporting
- Single sub-organization

### Professional Tier ($49/month - 50 projects, 500 participants)
All Free features plus:
- Advanced analytics
- Bulk participant import
- Multiple instructors
- Custom assessments
- Training recipients & plans
- Participant roles
- Topics & tagging
- Event management
- Attendance tracking
- Group management
- Multiple sub-organizations (up to 10)

### Enterprise Tier (Custom pricing - Unlimited)
All Pro features plus:
- API access
- SSO/SAML
- White-label branding
- Custom integrations
- Priority support
- Dedicated account manager
- Custom SLA
- Audit logs
- Advanced security
- Custom workflows
- Advanced permissions
- Multi-language support
- Data export
- Custom reports

---

## 🔧 Maintenance

### To Add a New Feature:
1. Edit `src/lib/features/featureAccess.js`
2. Add feature to `FEATURES` object
3. Add feature key to appropriate plan in `PLAN_DEFINITIONS`
4. Done! No other changes needed.

### To Modify Plan Limits:
1. Edit `src/lib/features/featureAccess.js`
2. Update `limits` in `PLAN_DEFINITIONS`
3. Done! Changes take effect immediately.

### To Change a Feature's Tier:
1. Edit `src/lib/features/featureAccess.js`
2. Update `plans` array in the feature definition
3. Done!

---

## 🎨 Example: Full Implementation

```javascript
// ============================================
// BACKEND: src/pages/api/projects/bulk-create.js
// ============================================
import { requireFeatureAndResource } from '@/lib/features/featureMiddleware';
import { RESOURCES } from '@/lib/features/featureAccess';

export default requireFeatureAndResource(
  'bulk_participant_import',  // Feature required
  RESOURCES.PROJECTS,          // Resource to check
  10                           // Amount requested
)(async (req, res) => {
  // Both checks passed:
  // 1. User has 'bulk_participant_import' feature
  // 2. Organization has capacity for 10 more projects

  const { projects } = req.body;

  // Create projects...

  res.json({ success: true, created: projects.length });
});

// ============================================
// FRONTEND: src/components/BulkCreateDialog.jsx
// ============================================
import { useFeatureAccess, useResourceLimit } from '@/lib/features/useFeatureAccess';

function BulkCreateDialog({ open, onClose }) {
  const feature = useFeatureAccess('bulk_participant_import');
  const capacity = useResourceLimit('projects');

  if (feature.loading || capacity.loading) {
    return <Skeleton />;
  }

  if (!feature.canAccess) {
    return (
      <UpgradeDialog
        feature="Bulk Import"
        requiredPlan={feature.requiredPlan}
        onClose={onClose}
      />
    );
  }

  const maxAllowed = capacity.available;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Bulk Create Projects</DialogTitle>
      <DialogContent>
        <Alert severity="info">
          You can create up to {maxAllowed} more projects.
        </Alert>
        {/* Upload CSV form */}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🚀 Next Steps (Optional)

### To Create Subscription Management API Routes:
Create files in `src/pages/api/subscriptions/`:
- `index.js` - GET subscription info
- `upgrade.js` - POST upgrade plan
- `usage.js` - GET resource usage
- `webhook.js` - POST Stripe webhook handler

### To Create Feature API Routes:
Create files in `src/pages/api/features/`:
- `check-access.js` - POST check feature access
- `available.js` - GET list of available features
- `resource-usage.js` - GET resource usage

### To Add Stripe Integration:
1. Add Stripe SDK
2. Create webhook handler for subscription events
3. Update `subscriptionService.js` with Stripe calls
4. Add payment UI components

---

## 📝 Notes

- All existing organizations have Enterprise plans (unlimited everything)
- Subscription data is cached for 15 minutes
- Resource usage is calculated on-demand
- All subscription changes are logged in history
- Custom features/limits can be set per organization

---

## 🎉 Summary

**You now have:**
- ✅ ONE file to manage all features (`featureAccess.js`)
- ✅ Complete subscription management system
- ✅ Backend middleware for API protection
- ✅ React hooks for frontend feature gates
- ✅ Resource usage tracking and limits
- ✅ Full audit trail
- ✅ All organizations on Enterprise plan

**To add/modify features:** Just edit `featureAccess.js`!

**To protect routes:** Just wrap with `requireFeature()`!

**To check in UI:** Just use `useFeatureAccess()` hook!

It's that simple! 🚀
