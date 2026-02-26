/**
 * Migration Script: Create Initial Versions for Existing Courses
 *
 * This script creates v1.0.0 published versions for all existing courses
 * that don't already have versions.
 *
 * Run with: node scripts/migrate-to-versioning.js
 *
 * IMPORTANT: Backup your database before running this script!
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateExistingCourses() {
  console.log('Starting course versioning migration...\n');

  try {
    // Get all courses that don't have a currentVersionId set
    const courses = await prisma.courses.findMany({
      where: {
        currentVersionId: null
      },
      include: {
        modules: {
          include: {
            activities: true
          },
          orderBy: { moduleOrder: 'asc' }
        }
      }
    });

    console.log(`Found ${courses.length} courses without versions.\n`);

    if (courses.length === 0) {
      console.log('No courses need migration. Exiting.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const course of courses) {
      try {
        console.log(`Processing: "${course.title}" (ID: ${course.id})...`);

        // Use a transaction to create all version records
        await prisma.$transaction(async (tx) => {
          // Create course version
          const courseVersion = await tx.course_versions.create({
            data: {
              courseId: course.id,
              version: course.version || '1.0.0',
              status: 'published',
              title: course.title,
              summary: course.summary,
              duration: course.duration,
              JSONSyllabus: course.JSONSyllabus,
              snapshotData: {
                code: course.code,
                language: course.language,
                deliveryMethod: course.deliveryMethod,
                level: course.level,
                courseCategory: course.courseCategory,
                CourseType: course.CourseType,
                targetAudience: course.targetAudience,
                certification: course.certification
              },
              publishedAt: new Date(),
              createdAt: course.createdAt || new Date(),
              createdBy: course.createdBy
            }
          });

          // Create module versions
          for (const module of course.modules) {
            const moduleVersion = await tx.module_versions.create({
              data: {
                moduleId: module.id,
                courseVersionId: courseVersion.id,
                version: '1.0.0',
                status: 'published',
                title: module.title,
                summary: module.summary,
                content: module.content,
                JSONContent: module.JSONContent,
                duration: module.duration,
                customDuration: module.customDuration,
                moduleOrder: module.moduleOrder,
                snapshotData: {
                  level: module.level,
                  moduleStatus: module.moduleStatus,
                  backgroundImg: module.backgroundImg
                },
                publishedAt: new Date(),
                createdAt: module.createdAt
              }
            });

            // Create activity versions
            for (const activity of module.activities) {
              await tx.activity_versions.create({
                data: {
                  activityId: activity.id,
                  moduleVersionId: moduleVersion.id,
                  version: '1.0.0',
                  status: 'published',
                  title: activity.title,
                  summary: activity.summary,
                  content: activity.content,
                  contentUrl: activity.contentUrl,
                  activityType: activity.activityType,
                  duration: activity.duration,
                  ActivityOrder: activity.ActivityOrder,
                  snapshotData: {
                    activityCategory: activity.activityCategory,
                    activityStatus: activity.activityStatus,
                    backgroundImg: activity.backgroundImg
                  },
                  publishedAt: new Date(),
                  createdAt: activity.createdAt
                }
              });
            }
          }

          // Update course to point to this version
          await tx.courses.update({
            where: { id: course.id },
            data: {
              currentVersionId: courseVersion.id,
              version: courseVersion.version
            }
          });

          // Add changelog entry
          await tx.version_changelogs.create({
            data: {
              courseVersionId: courseVersion.id,
              changeType: 'major',
              changeCategory: 'migration',
              description: 'Initial version created from existing course content during migration',
              entityType: 'course',
              entityId: course.id
            }
          });
        });

        console.log(`  ✓ Created v${course.version || '1.0.0'} with ${course.modules.length} modules`);
        successCount++;

      } catch (courseError) {
        console.error(`  ✗ Error processing course ${course.id}:`, courseError.message);
        errorCount++;
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Successfully migrated: ${successCount} courses`);
    console.log(`Failed: ${errorCount} courses`);
    console.log('-------------------------\n');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExistingCourses()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
