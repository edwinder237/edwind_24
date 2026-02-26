/**
 * Backfill authorName field for existing courses
 *
 * This script looks up the user who created each course (via createdBy field)
 * and populates the authorName field with their full name.
 *
 * Run with: node scripts/backfill-author-names.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillAuthorNames() {
  console.log('Starting authorName backfill...\n');

  try {
    // Find all courses without an authorName
    const coursesWithoutAuthor = await prisma.courses.findMany({
      where: {
        authorName: null
      },
      select: {
        id: true,
        title: true,
        createdBy: true
      }
    });

    console.log(`Found ${coursesWithoutAuthor.length} courses without authorName\n`);

    let updated = 0;
    let skipped = 0;

    for (const course of coursesWithoutAuthor) {
      // Try to find the user who created the course
      const user = await prisma.user.findUnique({
        where: { id: course.createdBy },
        select: {
          firstName: true,
          lastName: true,
          name: true
        }
      });

      if (user) {
        // Build full name from firstName + lastName, or use name field
        const authorName = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.name || 'Unknown Author';

        await prisma.courses.update({
          where: { id: course.id },
          data: { authorName }
        });

        console.log(`✓ Updated course "${course.title}" (ID: ${course.id}) -> Author: ${authorName}`);
        updated++;
      } else {
        console.log(`⚠ Skipped course "${course.title}" (ID: ${course.id}) - User not found for createdBy: ${course.createdBy}`);
        skipped++;
      }
    }

    console.log(`\n========================================`);
    console.log(`Backfill complete!`);
    console.log(`  Updated: ${updated} courses`);
    console.log(`  Skipped: ${skipped} courses`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillAuthorNames();
