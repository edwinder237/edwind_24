require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Plan definitions matching featureAccess.js
const PLANS = [
  {
    planId: 'essential',
    name: 'Essential',
    description: 'Perfect for small teams getting started',
    trialDays: 14,
    isActive: true,
    isPublic: true,
    displayOrder: 1,
    highlightText: null,
    stripeProductId: 'prod_Ttf9CY9vJg3D9U',
    features: [
      'basic_project_management',
      'basic_participant_management',
      'basic_courses',
      'basic_reporting',
      'single_sub_organization',
      'training_recipients',
      'event_management'
    ],
    resourceLimits: {
      maxProjects: 5,
      maxParticipants: 100,
      maxSubOrganizations: 1,
      maxInstructors: 3,
      maxCourses: 15,
      maxCurriculums: 5,
      maxProjectsPerMonth: 5,
      maxTrainingRecipients: 3,
      maxSmartPulsePerDay: 5
    }
  },
  {
    planId: 'professional',
    name: 'Professional',
    description: 'For growing teams who need advanced features',
    trialDays: 14,
    isActive: true,
    isPublic: true,
    displayOrder: 2,
    highlightText: 'Most Popular',
    stripeProductId: 'prod_TtfCECTkNj7VNU',
    features: [
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
      'dashboard',
      'timeline',
      'kirkpatrick'
    ],
    resourceLimits: {
      maxProjects: 50,
      maxParticipants: 500,
      maxSubOrganizations: 10,
      maxInstructors: 20,
      maxCourses: 100,
      maxCurriculums: 25,
      maxProjectsPerMonth: 50,
      maxCustomRoles: 10,
      maxTrainingRecipients: 8,
      maxSmartPulsePerDay: 25
    }
  },
  {
    planId: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with advanced needs',
    trialDays: 30,
    isActive: true,
    isPublic: true,
    displayOrder: 3,
    highlightText: 'Best Value',
    stripeProductId: 'prod_TtfD6zO0xkPhDH',
    features: [
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
      'dashboard',
      'timeline',
      'kirkpatrick',
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
    resourceLimits: {
      maxProjects: -1, // unlimited
      maxParticipants: -1,
      maxSubOrganizations: -1,
      maxInstructors: -1,
      maxCourses: -1,
      maxCurriculums: -1,
      maxProjectsPerMonth: -1,
      maxCustomRoles: -1,
      maxTrainingRecipients: -1,
      maxSmartPulsePerDay: -1
    }
  }
];

async function seedSubscriptionPlans() {
  console.log('📋 Seeding subscription plans...');

  for (const plan of PLANS) {
    await prisma.subscription_plans.upsert({
      where: { planId: plan.planId },
      update: {
        name: plan.name,
        description: plan.description,
        trialDays: plan.trialDays,
        isActive: plan.isActive,
        isPublic: plan.isPublic,
        displayOrder: plan.displayOrder,
        highlightText: plan.highlightText,
        stripeProductId: plan.stripeProductId,
        features: plan.features,
        resourceLimits: plan.resourceLimits
      },
      create: {
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        trialDays: plan.trialDays,
        isActive: plan.isActive,
        isPublic: plan.isPublic,
        displayOrder: plan.displayOrder,
        highlightText: plan.highlightText,
        stripeProductId: plan.stripeProductId,
        features: plan.features,
        resourceLimits: plan.resourceLimits
      }
    });
    console.log(`  ✅ Plan "${plan.name}" upserted`);
  }
}

async function seedOrganizationSubscriptions() {
  console.log('\n📋 Creating subscriptions for organizations...');

  // Get all organizations
  const organizations = await prisma.organizations.findMany({
    select: {
      id: true,
      title: true,
      workos_org_id: true
    }
  });

  console.log(`  Found ${organizations.length} organizations`);

  for (const org of organizations) {
    // Check if subscription already exists
    const existingSubscription = await prisma.subscriptions.findUnique({
      where: { organizationId: org.id }
    });

    if (existingSubscription) {
      console.log(`  ⏭️  Subscription already exists for "${org.title}"`);
      continue;
    }

    // Create subscription with professional plan (or essential for free tier)
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month from now

    await prisma.subscriptions.create({
      data: {
        organizationId: org.id,
        planId: 'professional', // Default to professional plan
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        createdBy: 'system'
      }
    });

    console.log(`  ✅ Created subscription for "${org.title}" (Professional plan)`);
  }
}

async function main() {
  console.log('🌱 Starting subscription seeding...\n');

  try {
    await seedSubscriptionPlans();
    await seedOrganizationSubscriptions();

    console.log('\n✅ Subscription seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding subscriptions:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
