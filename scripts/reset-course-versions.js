/**
 * Data Migration Script: Reset Course Versions
 *
 * This script resets all course versions based on their current status:
 * - Draft/non-published courses: version = "0.0.0"
 * - Published courses: version = "1.0.0"
 *
 * Run with: node scripts/reset-course-versions.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRAFT_VERSION = '0.0.0';
const PUBLISHED_VERSION = '1.0.0';
const PUBLISHED_STATUS = 'published';

async function resetCourseVersions() {
  console.log('Starting course version reset migration...\n');

  try {
    // Get all courses
    const courses = await prisma.courses.findMany({
      select: {
        id: true,
        title: true,
        courseStatus: true,
        version: true,
      },
    });

    console.log(`Found ${courses.length} courses to process.\n`);

    let draftCount = 0;
    let publishedCount = 0;
    let unchangedCount = 0;

    for (const course of courses) {
      const isPublished = course.courseStatus === PUBLISHED_STATUS;
      const targetVersion = isPublished ? PUBLISHED_VERSION : DRAFT_VERSION;

      if (course.version === targetVersion) {
        unchangedCount++;
        continue;
      }

      await prisma.courses.update({
        where: { id: course.id },
        data: { version: targetVersion },
      });

      if (isPublished) {
        publishedCount++;
        console.log(`  [PUBLISHED] "${course.title}" (ID: ${course.id}): ${course.version || 'null'} -> ${targetVersion}`);
      } else {
        draftCount++;
        console.log(`  [DRAFT] "${course.title}" (ID: ${course.id}): ${course.version || 'null'} -> ${targetVersion}`);
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Total courses: ${courses.length}`);
    console.log(`Draft courses reset to ${DRAFT_VERSION}: ${draftCount}`);
    console.log(`Published courses reset to ${PUBLISHED_VERSION}: ${publishedCount}`);
    console.log(`Already correct (unchanged): ${unchangedCount}`);
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetCourseVersions();
