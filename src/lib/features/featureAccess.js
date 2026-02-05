/**
 * ============================================
 * CENTRALIZED FEATURE ACCESS CONTROL
 * ============================================
 *
 * This is THE single source of truth for all feature access control.
 *
 * To add a new feature:
 * 1. Add the feature to FEATURES catalog
 * 2. Add it to the appropriate PLAN_DEFINITIONS
 * 3. The access control will work automatically everywhere
 *
 * To modify a plan:
 * 1. Edit PLAN_DEFINITIONS
 * 2. Changes take effect immediately
 */

// ============================================
// SUBSCRIPTION PLAN DEFINITIONS
// ============================================

export const PLAN_IDS = {
  ESSENTIAL: 'essential',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  CUSTOM: 'custom'
};

// Stripe Product IDs (from Stripe Dashboard)
export const STRIPE_PRODUCT_IDS = {
  ESSENTIAL: 'prod_Ttf9CY9vJg3D9U',
  PROFESSIONAL: 'prod_TtfCECTkNj7VNU',
  ENTERPRISE: 'prod_TtfD6zO0xkPhDH'
};

// Plan definitions - pricing fetched from Stripe (source of truth)
export const PLAN_DEFINITIONS = {
  [PLAN_IDS.ESSENTIAL]: {
    id: 'essential',
    name: 'Essential',
    description: 'Perfect for small teams getting started',
    stripeProductId: STRIPE_PRODUCT_IDS.ESSENTIAL,
    features: [
      'basic_project_management',
      'basic_participant_management',
      'basic_courses',
      'basic_reporting',
      'single_sub_organization'
    ],
    limits: {
      maxProjects: 5,
      maxParticipants: 100,
      maxSubOrganizations: 1,
      maxInstructors: 3,
      maxCourses: 15,
      maxCurriculums: 5,
      maxStorageGB: 5,
      maxProjectsPerMonth: 5,
      maxEmailsPerMonth: 100,
      maxAiSummarizationsPerMonth: 10
    }
  },

  [PLAN_IDS.PROFESSIONAL]: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing teams who need advanced features',
    stripeProductId: STRIPE_PRODUCT_IDS.PROFESSIONAL,
    features: [
      // Include all essential features
      'basic_project_management',
      'basic_participant_management',
      'basic_courses',
      'basic_reporting',
      'single_sub_organization',

      // Professional-only features
      'advanced_analytics',
      'bulk_participant_import',
      'multiple_instructors',
      'custom_assessments',
      'training_recipients',
      'training_plans',
      'participant_roles',
      'topics_tagging',
      'advanced_reporting',
      'course_curriculums',
      'event_management',
      'attendance_tracking',
      'group_management',
      'custom_participant_roles',
      'multiple_sub_organizations'
    ],
    limits: {
      maxProjects: 50,
      maxParticipants: 500,
      maxSubOrganizations: 10,
      maxInstructors: 20,
      maxCourses: 100,
      maxCurriculums: 25,
      maxStorageGB: 50,
      maxProjectsPerMonth: 50,
      maxCustomRoles: 10,
      maxEmailsPerMonth: 1000,
      maxAiSummarizationsPerMonth: 100
    }
  },

  [PLAN_IDS.ENTERPRISE]: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with advanced needs',
    stripeProductId: STRIPE_PRODUCT_IDS.ENTERPRISE,
    features: [
      // Include all professional features
      'basic_project_management',
      'basic_participant_management',
      'basic_courses',
      'basic_reporting',
      'single_sub_organization',
      'advanced_analytics',
      'bulk_participant_import',
      'multiple_instructors',
      'custom_assessments',
      'training_recipients',
      'training_plans',
      'participant_roles',
      'topics_tagging',
      'advanced_reporting',
      'course_curriculums',
      'event_management',
      'attendance_tracking',
      'group_management',
      'custom_participant_roles',
      'multiple_sub_organizations',

      // Enterprise-only features
      'api_access',
      'sso_saml',
      'white_label',
      'custom_integrations',
      'priority_support',
      'dedicated_account_manager',
      'custom_sla',
      'audit_logs',
      'advanced_security',
      'custom_workflows',
      'bulk_operations',
      'advanced_permissions',
      'custom_branding',
      'multi_language',
      'data_export',
      'custom_reports'
    ],
    limits: {
      maxProjects: -1, // Unlimited
      maxParticipants: -1,
      maxSubOrganizations: -1,
      maxInstructors: -1,
      maxCourses: -1,
      maxCurriculums: -1,
      maxStorageGB: 500,
      maxProjectsPerMonth: -1,
      maxCustomRoles: -1,
      maxEmailsPerMonth: -1,
      maxAiSummarizationsPerMonth: -1
    }
  }
};

// ============================================
// FEATURE CATALOG
// ============================================
// Complete list of all features with metadata

export const FEATURE_CATEGORIES = {
  PROJECTS: 'projects',
  PARTICIPANTS: 'participants',
  COURSES: 'courses',
  ANALYTICS: 'analytics',
  INTEGRATIONS: 'integrations',
  ADMIN: 'admin',
  SECURITY: 'security'
};

export const FEATURES = {
  // ==========================================
  // BASIC FEATURES (Free tier)
  // ==========================================

  basic_project_management: {
    key: 'basic_project_management',
    name: 'Basic Project Management',
    description: 'Create and manage training projects',
    category: FEATURE_CATEGORIES.PROJECTS,
    plans: ['essential', 'professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['projects:create', 'projects:read', 'projects:update']
  },

  basic_participant_management: {
    key: 'basic_participant_management',
    name: 'Basic Participant Management',
    description: 'Add and manage participants',
    category: FEATURE_CATEGORIES.PARTICIPANTS,
    plans: ['essential', 'professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['participants:read', 'participants:create']
  },

  basic_courses: {
    key: 'basic_courses',
    name: 'Basic Courses',
    description: 'Create and manage courses',
    category: FEATURE_CATEGORIES.COURSES,
    plans: ['essential', 'professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager', 'Instructor'],
    permissions: ['courses:read', 'courses:create']
  },

  basic_reporting: {
    key: 'basic_reporting',
    name: 'Basic Reporting',
    description: 'View basic project reports',
    category: FEATURE_CATEGORIES.ANALYTICS,
    plans: ['essential', 'professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['reports:read']
  },

  single_sub_organization: {
    key: 'single_sub_organization',
    name: 'Single Sub-Organization',
    description: 'One sub-organization for your team',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['essential', 'professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['sub_organizations:read']
  },

  // ==========================================
  // PROFESSIONAL FEATURES (Pro tier+)
  // ==========================================

  advanced_analytics: {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed dashboards and insights',
    category: FEATURE_CATEGORIES.ANALYTICS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['reports:read', 'analytics:read']
  },

  bulk_participant_import: {
    key: 'bulk_participant_import',
    name: 'Bulk Participant Import',
    description: 'Import participants via CSV',
    category: FEATURE_CATEGORIES.PARTICIPANTS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['participants:create', 'participants:bulk']
  },

  multiple_instructors: {
    key: 'multiple_instructors',
    name: 'Multiple Instructors',
    description: 'Assign multiple instructors per project',
    category: FEATURE_CATEGORIES.PROJECTS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['instructors:assign']
  },

  custom_assessments: {
    key: 'custom_assessments',
    name: 'Custom Assessments',
    description: 'Create custom assessments and grading',
    category: FEATURE_CATEGORIES.COURSES,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Instructor'],
    permissions: ['assessments:create', 'assessments:grade']
  },

  training_recipients: {
    key: 'training_recipients',
    name: 'Training Recipients',
    description: 'Manage training recipient organizations',
    category: FEATURE_CATEGORIES.PARTICIPANTS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['training_recipients:create']
  },

  training_plans: {
    key: 'training_plans',
    name: 'Training Plans',
    description: 'Create structured training plans',
    category: FEATURE_CATEGORIES.PROJECTS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager', 'Instructor'],
    permissions: ['training_plans:create']
  },

  participant_roles: {
    key: 'participant_roles',
    name: 'Participant Roles',
    description: 'Assign roles to participants',
    category: FEATURE_CATEGORIES.PARTICIPANTS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['participants:manage']
  },

  topics_tagging: {
    key: 'topics_tagging',
    name: 'Topics & Tagging',
    description: 'Organize content with topics',
    category: FEATURE_CATEGORIES.COURSES,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['topics:manage']
  },

  advanced_reporting: {
    key: 'advanced_reporting',
    name: 'Advanced Reporting',
    description: 'Custom reports and exports',
    category: FEATURE_CATEGORIES.ANALYTICS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['reports:advanced']
  },

  course_curriculums: {
    key: 'course_curriculums',
    name: 'Course Curriculums',
    description: 'Build structured curriculums',
    category: FEATURE_CATEGORIES.COURSES,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Instructor'],
    permissions: ['curriculums:create']
  },

  event_management: {
    key: 'event_management',
    name: 'Event Management',
    description: 'Schedule and manage training events',
    category: FEATURE_CATEGORIES.PROJECTS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager', 'Instructor'],
    permissions: ['events:create']
  },

  attendance_tracking: {
    key: 'attendance_tracking',
    name: 'Attendance Tracking',
    description: 'Track participant attendance',
    category: FEATURE_CATEGORIES.PARTICIPANTS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager', 'Instructor'],
    permissions: ['attendance:track']
  },

  group_management: {
    key: 'group_management',
    name: 'Group Management',
    description: 'Organize participants into groups',
    category: FEATURE_CATEGORIES.PARTICIPANTS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['groups:manage']
  },

  custom_participant_roles: {
    key: 'custom_participant_roles',
    name: 'Custom Participant Roles',
    description: 'Define custom participant roles',
    category: FEATURE_CATEGORIES.PARTICIPANTS,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['participant_roles:create']
  },

  multiple_sub_organizations: {
    key: 'multiple_sub_organizations',
    name: 'Multiple Sub-Organizations',
    description: 'Create multiple sub-organizations',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['professional', 'enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['sub_organizations:create']
  },

  // ==========================================
  // ENTERPRISE FEATURES (Enterprise tier only)
  // ==========================================

  api_access: {
    key: 'api_access',
    name: 'API Access',
    description: 'Full REST API access',
    category: FEATURE_CATEGORIES.INTEGRATIONS,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['api:access']
  },

  sso_saml: {
    key: 'sso_saml',
    name: 'SSO/SAML',
    description: 'Single sign-on integration',
    category: FEATURE_CATEGORIES.SECURITY,
    plans: ['enterprise'],
    roles: ['Admin'],
    permissions: ['sso:configure']
  },

  white_label: {
    key: 'white_label',
    name: 'White Label Branding',
    description: 'Custom branding and white-labeling',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['branding:customize']
  },

  custom_integrations: {
    key: 'custom_integrations',
    name: 'Custom Integrations',
    description: 'Build custom integrations',
    category: FEATURE_CATEGORIES.INTEGRATIONS,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['integrations:create']
  },

  priority_support: {
    key: 'priority_support',
    name: 'Priority Support',
    description: '24/7 priority support',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: []
  },

  dedicated_account_manager: {
    key: 'dedicated_account_manager',
    name: 'Dedicated Account Manager',
    description: 'Personal account management',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: []
  },

  custom_sla: {
    key: 'custom_sla',
    name: 'Custom SLA',
    description: 'Custom service level agreement',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['enterprise'],
    roles: ['Admin'],
    permissions: []
  },

  audit_logs: {
    key: 'audit_logs',
    name: 'Audit Logs',
    description: 'Comprehensive audit trail',
    category: FEATURE_CATEGORIES.SECURITY,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['audit:read']
  },

  advanced_security: {
    key: 'advanced_security',
    name: 'Advanced Security',
    description: 'Enhanced security features',
    category: FEATURE_CATEGORIES.SECURITY,
    plans: ['enterprise'],
    roles: ['Admin'],
    permissions: ['security:configure']
  },

  custom_workflows: {
    key: 'custom_workflows',
    name: 'Custom Workflows',
    description: 'Build custom approval workflows',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['workflows:create']
  },

  bulk_operations: {
    key: 'bulk_operations',
    name: 'Bulk Operations',
    description: 'Advanced bulk operations',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['bulk:execute']
  },

  advanced_permissions: {
    key: 'advanced_permissions',
    name: 'Advanced Permissions',
    description: 'Granular permission control',
    category: FEATURE_CATEGORIES.SECURITY,
    plans: ['enterprise'],
    roles: ['Admin'],
    permissions: ['permissions:manage']
  },

  custom_branding: {
    key: 'custom_branding',
    name: 'Custom Branding',
    description: 'Full brand customization',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['branding:customize']
  },

  multi_language: {
    key: 'multi_language',
    name: 'Multi-Language Support',
    description: 'Multiple language support',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: []
  },

  data_export: {
    key: 'data_export',
    name: 'Data Export',
    description: 'Export all your data',
    category: FEATURE_CATEGORIES.ADMIN,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin'],
    permissions: ['data:export']
  },

  custom_reports: {
    key: 'custom_reports',
    name: 'Custom Reports',
    description: 'Build custom report templates',
    category: FEATURE_CATEGORIES.ANALYTICS,
    plans: ['enterprise'],
    roles: ['Admin', 'Organization Admin', 'Project Manager'],
    permissions: ['reports:custom']
  }
};

// ============================================
// RESOURCE LIMITS
// ============================================
// Define what counts against each resource

export const RESOURCES = {
  PROJECTS: 'projects',
  PARTICIPANTS: 'participants',
  SUB_ORGANIZATIONS: 'sub_organizations',
  INSTRUCTORS: 'instructors',
  COURSES: 'courses',
  CURRICULUMS: 'curriculums',
  STORAGE: 'storage',
  PROJECTS_PER_MONTH: 'projects_per_month',
  CUSTOM_ROLES: 'custom_roles',
  EMAILS_PER_MONTH: 'emails_per_month',
  AI_SUMMARIZATIONS_PER_MONTH: 'ai_summarizations_per_month'
};

// Map resource names to their limit keys in plan definitions
export const RESOURCE_LIMIT_KEYS = {
  [RESOURCES.PROJECTS]: 'maxProjects',
  [RESOURCES.PARTICIPANTS]: 'maxParticipants',
  [RESOURCES.SUB_ORGANIZATIONS]: 'maxSubOrganizations',
  [RESOURCES.INSTRUCTORS]: 'maxInstructors',
  [RESOURCES.COURSES]: 'maxCourses',
  [RESOURCES.CURRICULUMS]: 'maxCurriculums',
  [RESOURCES.STORAGE]: 'maxStorageGB',
  [RESOURCES.PROJECTS_PER_MONTH]: 'maxProjectsPerMonth',
  [RESOURCES.CUSTOM_ROLES]: 'maxCustomRoles',
  [RESOURCES.EMAILS_PER_MONTH]: 'maxEmailsPerMonth',
  [RESOURCES.AI_SUMMARIZATIONS_PER_MONTH]: 'maxAiSummarizationsPerMonth'
};

// Human-readable metadata for resource limits (used by admin UI)
export const RESOURCE_DISPLAY_INFO = {
  maxProjects: { label: 'Max Projects', description: 'Total active projects allowed' },
  maxProjectsPerMonth: { label: 'Max Projects Per Month', description: 'Projects that can be created per month' },
  maxParticipants: { label: 'Max Participants (Users)', description: 'Total unique participants across all projects' },
  maxInstructors: { label: 'Max Instructors', description: 'Total instructors in the organization' },
  maxSubOrganizations: { label: 'Max Sub-Organizations', description: 'Number of sub-organizations allowed' },
  maxCourses: { label: 'Max Courses', description: 'Total courses that can be created' },
  maxCurriculums: { label: 'Max Curriculums', description: 'Total curriculums that can be created' },
  maxCustomRoles: { label: 'Max Custom Roles', description: 'Custom participant roles per organization' },
  maxStorageGB: { label: 'Max Storage (GB)', description: 'File storage quota in gigabytes' },
  maxEmailsPerMonth: { label: 'Max Emails Per Month', description: 'Outbound emails sent per month' },
  maxAiSummarizationsPerMonth: { label: 'Max AI Summarizations / Month', description: 'AI summarization calls per month' }
};

// ============================================
// CORE ACCESS CHECKING FUNCTIONS
// ============================================

/**
 * Check if a feature is available to a user
 *
 * @param {Object} params - Parameters
 * @param {Object} params.subscription - Organization's subscription object
 * @param {Object} params.userClaims - User's claims with role and permissions
 * @param {string} params.featureKey - Feature key to check
 * @param {Object} params.organizationId - Optional org ID for custom overrides
 * @returns {Object} { canAccess: boolean, reason: string, requiredPlan?: string }
 */
export function canAccessFeature({ subscription, userClaims, featureKey, organizationId }) {
  // Get feature definition
  const feature = FEATURES[featureKey];

  if (!feature) {
    return {
      canAccess: false,
      reason: 'feature_not_found',
      message: `Feature "${featureKey}" does not exist`
    };
  }

  // Check if subscription exists
  if (!subscription) {
    return {
      canAccess: false,
      reason: 'no_subscription',
      message: 'No active subscription found',
      requiredPlan: feature.plans[feature.plans.length - 1] // Suggest highest plan that has it
    };
  }

  // Check custom feature overrides for this organization
  if (subscription.customFeatures && Array.isArray(subscription.customFeatures)) {
    if (subscription.customFeatures.includes(featureKey)) {
      // Feature explicitly enabled for this org
      // Still need to check role/permissions
      return checkRoleAndPermissions(userClaims, feature);
    }
    // Check if explicitly disabled
    if (subscription.customFeatures.includes(`!${featureKey}`)) {
      return {
        canAccess: false,
        reason: 'feature_disabled',
        message: 'This feature has been disabled for your organization'
      };
    }
  }

  // Check if feature is available in the current plan
  const planId = subscription.planId;
  const isFeatureInPlan = feature.plans.includes(planId);

  if (!isFeatureInPlan) {
    // Find the minimum plan that has this feature
    const requiredPlan = feature.plans.find(p =>
      ['essential', 'professional', 'enterprise'].includes(p)
    );

    return {
      canAccess: false,
      reason: 'plan_upgrade_required',
      message: `This feature requires ${requiredPlan} plan or higher`,
      requiredPlan,
      currentPlan: planId
    };
  }

  // Feature is in plan — if no userClaims provided, skip role/permission check (plan-only gating)
  if (!userClaims) {
    return {
      canAccess: true,
      reason: 'plan_authorized',
      message: 'Feature available in current plan'
    };
  }

  // Check role and permissions
  return checkRoleAndPermissions(userClaims, feature);
}

/**
 * Check if user has required role and permissions for a feature.
 *
 * Logic:
 * 1. If the user has ALL required permissions (configured via the internal admin tool / DB),
 *    access is granted regardless of the hardcoded roles array. DB permissions are authoritative.
 * 2. If the user's role matches the hardcoded roles array, also check permissions.
 * 3. If neither permissions nor role match, deny access.
 */
function checkRoleAndPermissions(userClaims, feature) {
  // First: check if user has all required permissions from DB/admin tool.
  // If they do, grant access — DB-configured permissions are authoritative.
  if (feature.permissions && feature.permissions.length > 0) {
    const hasAllPermissions = feature.permissions.every(permission =>
      userHasPermission(userClaims, permission)
    );

    if (hasAllPermissions) {
      return {
        canAccess: true,
        reason: 'authorized',
        message: 'Access granted'
      };
    }
  }

  // If no specific permissions required, fall back to role check
  if (feature.roles && feature.roles.length > 0) {
    const userRole = getUserRole(userClaims);
    const hasRequiredRole = feature.roles.includes(userRole);

    if (hasRequiredRole) {
      return {
        canAccess: true,
        reason: 'authorized',
        message: 'Access granted'
      };
    }

    return {
      canAccess: false,
      reason: 'insufficient_role',
      message: `This feature requires one of these roles: ${feature.roles.join(', ')}`,
      requiredRoles: feature.roles,
      currentRole: userRole
    };
  }

  // No role or permission requirements — allow
  return {
    canAccess: true,
    reason: 'authorized',
    message: 'Access granted'
  };
}

/**
 * Map hierarchy level to standard role name used in FEATURES catalog.
 * DB roles may have custom names (e.g., "Training Manager") but their hierarchy
 * level is the canonical measure of access: 0=Admin, 1=Org Admin, 2=PM, etc.
 */
const HIERARCHY_TO_STANDARD_ROLE = {
  0: 'Admin',
  1: 'Organization Admin',
  2: 'Project Manager',
  3: 'Instructor',
  4: 'Participant',
  5: 'Viewer',
  6: 'Member'
};

/**
 * Get user's primary role from claims
 * Supports both orgContext format (from withOrgScope middleware) and WorkOS claims format.
 * Returns a standard role name that matches FEATURES catalog role arrays.
 */
function getUserRole(userClaims) {
  if (!userClaims) return 'Member';

  // Check if admin via orgContext isAdmin/isClientAdmin flags (Level 0-1)
  if (userClaims.isClientAdmin || userClaims.isAdmin) return 'Admin';

  // Use hierarchy level for reliable mapping to standard role names.
  // DB roles can have custom names (e.g., "Training Manager" at level 2)
  // but FEATURES catalog uses standard names (e.g., "Project Manager").
  const hierarchyLevel = userClaims.hierarchyLevel ?? userClaims.appRole?.hierarchyLevel;
  if (hierarchyLevel !== undefined) {
    return HIERARCHY_TO_STANDARD_ROLE[hierarchyLevel] || 'Member';
  }

  // Fallback: try appRole name directly (string or object)
  if (userClaims.appRole) {
    if (typeof userClaims.appRole === 'string') return userClaims.appRole;
    if (userClaims.appRole.name) return userClaims.appRole.name;
  }

  // Support WorkOS claims format
  if (userClaims.organizations && userClaims.organizations.length > 0) {
    return userClaims.organizations[0].role || 'Member';
  }

  return 'Member';
}

/**
 * Check if user has a specific permission
 * Supports both orgContext format (flat permissions array) and WorkOS claims format
 */
function userHasPermission(userClaims, permission) {
  if (!userClaims) return false;

  // Helper to check if a permission list grants the required permission (with wildcard support)
  const permissionGranted = (permList) => {
    if (!permList || !Array.isArray(permList)) return false;
    const [resource, action] = permission.split(':');
    return permList.some(p => {
      if (p === permission) return true;       // Exact match
      if (p === '*:*') return true;            // Full wildcard
      const [pResource, pAction] = p.split(':');
      if (pResource === resource && pAction === '*') return true; // Resource wildcard
      return false;
    });
  };

  // Support orgContext format (flat permissions array from withOrgScope)
  if (Array.isArray(userClaims.permissions)) {
    return permissionGranted(userClaims.permissions);
  }

  // Support WorkOS claims format
  if (userClaims.organizations) {
    return userClaims.organizations.some(org => permissionGranted(org.permissions));
  }

  return false;
}

/**
 * Check if organization has capacity for more of a resource
 *
 * @param {Object} params - Parameters
 * @param {Object} params.subscription - Organization's subscription
 * @param {string} params.resource - Resource type (from RESOURCES)
 * @param {number} params.currentUsage - Current resource usage
 * @param {number} params.requestedAmount - Amount being requested (default: 1)
 * @returns {Object} { hasCapacity: boolean, current: number, limit: number, available: number }
 */
export function hasResourceCapacity({ subscription, resource, currentUsage, requestedAmount = 1 }) {
  if (!subscription) {
    return {
      hasCapacity: false,
      current: currentUsage,
      limit: 0,
      available: 0,
      reason: 'no_subscription'
    };
  }

  // Get the limit key for this resource
  const limitKey = RESOURCE_LIMIT_KEYS[resource];

  if (!limitKey) {
    return {
      hasCapacity: false,
      current: currentUsage,
      limit: 0,
      available: 0,
      reason: 'invalid_resource'
    };
  }

  // Priority: customLimits (per-org) > DB plan resourceLimits > code PLAN_DEFINITIONS
  let limit;
  if (subscription.customLimits && subscription.customLimits[limitKey] !== undefined) {
    limit = subscription.customLimits[limitKey];
  } else if (subscription.plan?.resourceLimits && subscription.plan.resourceLimits[limitKey] !== undefined) {
    // Check database plan limits (set via admin UI)
    limit = subscription.plan.resourceLimits[limitKey];
  } else {
    // Fall back to hardcoded plan definitions
    const codePlan = PLAN_DEFINITIONS[subscription.planId];
    limit = codePlan ? codePlan.limits[limitKey] : 0;
  }

  // -1 means unlimited
  if (limit === -1) {
    return {
      hasCapacity: true,
      current: currentUsage,
      limit: -1,
      available: -1,
      reason: 'unlimited'
    };
  }

  const available = limit - currentUsage;
  const hasCapacity = available >= requestedAmount;

  return {
    hasCapacity,
    current: currentUsage,
    limit,
    available,
    reason: hasCapacity ? 'within_limit' : 'limit_exceeded'
  };
}

/**
 * Get all features available to a user
 *
 * @param {Object} subscription - Organization's subscription
 * @param {Object} userClaims - User's claims
 * @returns {Array} Array of available feature keys
 */
export function getAvailableFeatures(subscription, userClaims) {
  const availableFeatures = [];

  Object.keys(FEATURES).forEach(featureKey => {
    const result = canAccessFeature({ subscription, userClaims, featureKey });
    if (result.canAccess) {
      availableFeatures.push(featureKey);
    }
  });

  return availableFeatures;
}

/**
 * Get features grouped by category
 *
 * @param {Object} subscription - Organization's subscription
 * @param {Object} userClaims - User's claims
 * @returns {Object} Features grouped by category
 */
export function getFeaturesByCategory(subscription, userClaims) {
  const featuresByCategory = {};

  Object.keys(FEATURE_CATEGORIES).forEach(category => {
    featuresByCategory[category] = [];
  });

  Object.values(FEATURES).forEach(feature => {
    const result = canAccessFeature({
      subscription,
      userClaims,
      featureKey: feature.key
    });

    featuresByCategory[feature.category].push({
      ...feature,
      canAccess: result.canAccess,
      accessInfo: result
    });
  });

  return featuresByCategory;
}

/**
 * Get upgrade requirements for a feature
 *
 * @param {string} featureKey - Feature key
 * @param {string} currentPlanId - Current plan ID
 * @returns {Object} Upgrade information
 */
export function getUpgradeRequirements(featureKey, currentPlanId) {
  const feature = FEATURES[featureKey];

  if (!feature) {
    return null;
  }

  // Find minimum plan that has this feature
  const planOrder = ['essential', 'professional', 'enterprise'];
  const currentPlanIndex = planOrder.indexOf(currentPlanId);

  const requiredPlan = feature.plans
    .filter(p => planOrder.includes(p))
    .sort((a, b) => planOrder.indexOf(a) - planOrder.indexOf(b))[0];

  const requiredPlanIndex = planOrder.indexOf(requiredPlan);

  if (requiredPlanIndex <= currentPlanIndex) {
    return {
      upgradeRequired: false,
      currentPlan: currentPlanId,
      message: 'Feature available in current plan'
    };
  }

  return {
    upgradeRequired: true,
    currentPlan: currentPlanId,
    requiredPlan,
    planDefinition: PLAN_DEFINITIONS[requiredPlan],
    message: `Upgrade to ${PLAN_DEFINITIONS[requiredPlan].name} to access this feature`
  };
}

/**
 * Get resource usage summary for an organization
 *
 * @param {Object} subscription - Organization's subscription
 * @param {Object} currentUsage - Object with current usage for each resource
 * @returns {Object} Resource usage summary
 */
export function getResourceUsageSummary(subscription, currentUsage) {
  const summary = {};

  Object.keys(RESOURCES).forEach(resourceKey => {
    const resource = RESOURCES[resourceKey];
    const usage = currentUsage[resource] || 0;

    const capacityCheck = hasResourceCapacity({
      subscription,
      resource,
      currentUsage: usage,
      requestedAmount: 0
    });

    summary[resource] = {
      current: capacityCheck.current,
      limit: capacityCheck.limit,
      available: capacityCheck.available,
      percentUsed: capacityCheck.limit > 0
        ? Math.round((capacityCheck.current / capacityCheck.limit) * 100)
        : 0,
      isUnlimited: capacityCheck.limit === -1
    };
  });

  return summary;
}

export default {
  PLAN_IDS,
  PLAN_DEFINITIONS,
  FEATURES,
  FEATURE_CATEGORIES,
  RESOURCES,
  RESOURCE_LIMIT_KEYS,
  canAccessFeature,
  hasResourceCapacity,
  getAvailableFeatures,
  getFeaturesByCategory,
  getUpgradeRequirements,
  getResourceUsageSummary
};
