/**
 * ============================================
 * SEED SUBSCRIPTION PLANS
 * ============================================
 *
 * Creates default subscription plan definitions in the database.
 * Run this once to populate the subscription_plans table.
 *
 * Usage: node scripts/seed-subscription-plans.js
 */

const { PrismaClient } = require('@prisma/client');
const { PLAN_DEFINITIONS } = require('../src/lib/features/featureAccess');

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding subscription plans...\n');

  try {
    // Free Plan
    console.log('📦 Creating Free Plan...');
    const freePlan = await prisma.subscription_plans.upsert({
      where: { planId: 'free' },
      update: {
        name: PLAN_DEFINITIONS.free.name,
        description: PLAN_DEFINITIONS.free.description,
        price: PLAN_DEFINITIONS.free.price,
        currency: 'USD',
        billingInterval: PLAN_DEFINITIONS.free.billingInterval,
        trialDays: 0,
        isActive: true,
        isPublic: true,
        features: PLAN_DEFINITIONS.free.features,
        resourceLimits: PLAN_DEFINITIONS.free.limits,
        displayOrder: 1,
        highlightText: null,
        updatedBy: 'system'
      },
      create: {
        planId: 'free',
        name: PLAN_DEFINITIONS.free.name,
        description: PLAN_DEFINITIONS.free.description,
        price: PLAN_DEFINITIONS.free.price,
        currency: 'USD',
        billingInterval: PLAN_DEFINITIONS.free.billingInterval,
        trialDays: 0,
        isActive: true,
        isPublic: true,
        features: PLAN_DEFINITIONS.free.features,
        resourceLimits: PLAN_DEFINITIONS.free.limits,
        displayOrder: 1,
        highlightText: null,
        createdBy: 'system'
      }
    });
    console.log(`   ✅ Free Plan created (ID: ${freePlan.id})`);
    console.log(`   - Features: ${PLAN_DEFINITIONS.free.features.length}`);
    console.log(`   - Max Projects: ${PLAN_DEFINITIONS.free.limits.maxProjects}`);
    console.log(`   - Max Participants: ${PLAN_DEFINITIONS.free.limits.maxParticipants}\n`);

    // Pro Plan
    console.log('📦 Creating Professional Plan...');
    const proPlan = await prisma.subscription_plans.upsert({
      where: { planId: 'pro' },
      update: {
        name: PLAN_DEFINITIONS.pro.name,
        description: PLAN_DEFINITIONS.pro.description,
        price: PLAN_DEFINITIONS.pro.price,
        currency: 'USD',
        billingInterval: PLAN_DEFINITIONS.pro.billingInterval,
        trialDays: 14,
        isActive: true,
        isPublic: true,
        features: PLAN_DEFINITIONS.pro.features,
        resourceLimits: PLAN_DEFINITIONS.pro.limits,
        displayOrder: 2,
        highlightText: 'Most Popular',
        updatedBy: 'system'
      },
      create: {
        planId: 'pro',
        name: PLAN_DEFINITIONS.pro.name,
        description: PLAN_DEFINITIONS.pro.description,
        price: PLAN_DEFINITIONS.pro.price,
        currency: 'USD',
        billingInterval: PLAN_DEFINITIONS.pro.billingInterval,
        trialDays: 14,
        isActive: true,
        isPublic: true,
        features: PLAN_DEFINITIONS.pro.features,
        resourceLimits: PLAN_DEFINITIONS.pro.limits,
        displayOrder: 2,
        highlightText: 'Most Popular',
        createdBy: 'system'
      }
    });
    console.log(`   ✅ Professional Plan created (ID: ${proPlan.id})`);
    console.log(`   - Price: $${PLAN_DEFINITIONS.pro.price}/month`);
    console.log(`   - Features: ${PLAN_DEFINITIONS.pro.features.length}`);
    console.log(`   - Max Projects: ${PLAN_DEFINITIONS.pro.limits.maxProjects}`);
    console.log(`   - Max Participants: ${PLAN_DEFINITIONS.pro.limits.maxParticipants}\n`);

    // Enterprise Plan
    console.log('📦 Creating Enterprise Plan...');
    const enterprisePlan = await prisma.subscription_plans.upsert({
      where: { planId: 'enterprise' },
      update: {
        name: PLAN_DEFINITIONS.enterprise.name,
        description: PLAN_DEFINITIONS.enterprise.description,
        price: 0, // Custom pricing
        currency: 'USD',
        billingInterval: 'custom',
        trialDays: 30,
        isActive: true,
        isPublic: true,
        features: PLAN_DEFINITIONS.enterprise.features,
        resourceLimits: PLAN_DEFINITIONS.enterprise.limits,
        displayOrder: 3,
        highlightText: 'Best Value',
        updatedBy: 'system'
      },
      create: {
        planId: 'enterprise',
        name: PLAN_DEFINITIONS.enterprise.name,
        description: PLAN_DEFINITIONS.enterprise.description,
        price: 0, // Custom pricing
        currency: 'USD',
        billingInterval: 'custom',
        trialDays: 30,
        isActive: true,
        isPublic: true,
        features: PLAN_DEFINITIONS.enterprise.features,
        resourceLimits: PLAN_DEFINITIONS.enterprise.limits,
        displayOrder: 3,
        highlightText: 'Best Value',
        createdBy: 'system'
      }
    });
    console.log(`   ✅ Enterprise Plan created (ID: ${enterprisePlan.id})`);
    console.log(`   - Price: Custom pricing`);
    console.log(`   - Features: ${PLAN_DEFINITIONS.enterprise.features.length}`);
    console.log(`   - Max Projects: Unlimited`);
    console.log(`   - Max Participants: Unlimited\n`);

    console.log('✅ All subscription plans seeded successfully!\n');

    // Display summary
    const allPlans = await prisma.subscription_plans.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    console.log('📊 Summary:');
    console.log(`   Total plans: ${allPlans.length}`);
    allPlans.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.planId}): ${plan.features.length} features`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedPlans()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed subscription plans:', error);
    process.exit(1);
  });
