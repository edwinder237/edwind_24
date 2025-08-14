const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToIsActive() {
  try {
    console.log('🚀 Starting migration from courseStatus to isActive...');

    // Step 1: Get all courses with their current status
    const courses = await prisma.courses.findMany({
      select: {
        id: true,
        title: true,
        courseStatus: true
      }
    });

    console.log(`📊 Found ${courses.length} courses to migrate`);

    // Step 2: Update each course based on courseStatus
    let updatedCourses = 0;
    let activeCount = 0;
    let inactiveCount = 0;

    for (const course of courses) {
      const isActive = course.courseStatus !== 'inactive';
      
      await prisma.courses.update({
        where: { id: course.id },
        data: { isActive }
      });

      if (isActive) {
        activeCount++;
      } else {
        inactiveCount++;
      }

      updatedCourses++;
      console.log(`✅ Updated "${course.title}" - isActive: ${isActive} (was: ${course.courseStatus || 'null'})`);
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Total courses: ${updatedCourses}`);
    console.log(`   Active courses: ${activeCount}`);
    console.log(`   Inactive courses: ${inactiveCount}`);

    // Step 3: Verify the migration
    const verificationActive = await prisma.courses.count({
      where: { isActive: true }
    });
    
    const verificationInactive = await prisma.courses.count({
      where: { isActive: false }
    });

    console.log('\n🔍 Verification:');
    console.log(`   Active count in DB: ${verificationActive}`);
    console.log(`   Inactive count in DB: ${verificationInactive}`);
    console.log(`   Total in DB: ${verificationActive + verificationInactive}`);

    if (verificationActive === activeCount && verificationInactive === inactiveCount) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('❌ Migration verification failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateToIsActive();