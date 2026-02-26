/**
 * Backfill Audit History
 *
 * This script populates the course_audit_logs table with existing events
 * that are linked to courses, so users can see the delivery history.
 *
 * Run with: node scripts/backfill-audit-history.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillEventAuditLogs() {
  console.log('Starting audit history backfill...\n');

  // Get all events that have a courseId
  const eventsWithCourses = await prisma.events.findMany({
    where: {
      courseId: { not: null }
    },
    select: {
      id: true,
      title: true,
      courseId: true,
      start: true,
      end: true,
      eventType: true,
      deliveryMode: true,
      projectId: true,
      project: {
        select: { title: true }
      }
    },
    orderBy: { start: 'asc' }
  });

  console.log(`Found ${eventsWithCourses.length} events linked to courses\n`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const event of eventsWithCourses) {
    // Check if audit entry already exists for this event
    const existingEntry = await prisma.course_audit_logs.findFirst({
      where: {
        courseId: event.courseId,
        entityType: 'event',
        entityId: event.id,
        actionType: 'create'
      }
    });

    if (existingEntry) {
      skippedCount++;
      continue;
    }

    // Create audit entry for event creation
    await prisma.course_audit_logs.create({
      data: {
        courseId: event.courseId,
        entityType: 'event',
        entityId: event.id,
        actionType: 'create',
        metadata: {
          title: event.title,
          eventType: event.eventType || 'other',
          start: event.start?.toISOString(),
          end: event.end?.toISOString(),
          projectId: event.projectId,
          projectTitle: event.project?.title || 'Unknown Project',
          deliveryMode: event.deliveryMode || 'in_person',
        },
        changedByName: 'System (Backfill)',
        changedAt: event.start || new Date(),
      }
    });

    createdCount++;
    console.log(`Created audit entry for event: ${event.title} (Course ID: ${event.courseId})`);
  }

  console.log(`\nEvent audit entries: ${createdCount} created, ${skippedCount} skipped (already exist)`);

  // Now check for events that have progress (delivery started)
  console.log('\n--- Checking for delivery started events ---\n');

  const eventsWithProgress = await prisma.event_module_progress.findMany({
    distinct: ['eventId'],
    select: {
      eventId: true,
      createdAt: true,
      module: {
        select: {
          courseId: true,
          title: true,
        }
      },
      event: {
        select: {
          title: true,
          projectId: true,
          project: {
            select: { title: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${eventsWithProgress.length} events with progress records\n`);

  let deliveryStartedCount = 0;
  let deliverySkippedCount = 0;

  for (const progress of eventsWithProgress) {
    if (!progress.module?.courseId) continue;

    // Check if delivery_started audit entry already exists
    const existingEntry = await prisma.course_audit_logs.findFirst({
      where: {
        courseId: progress.module.courseId,
        entityType: 'event',
        entityId: progress.eventId,
        actionType: 'delivery_started'
      }
    });

    if (existingEntry) {
      deliverySkippedCount++;
      continue;
    }

    // Create delivery_started audit entry
    await prisma.course_audit_logs.create({
      data: {
        courseId: progress.module.courseId,
        entityType: 'event',
        entityId: progress.eventId,
        actionType: 'delivery_started',
        metadata: {
          title: progress.event?.title || 'Unknown Event',
          moduleTitle: progress.module.title,
          projectId: progress.event?.projectId,
          projectTitle: progress.event?.project?.title || 'Unknown Project',
          message: 'First participant started - course version is now locked',
        },
        changedByName: 'System (Backfill)',
        changedAt: progress.createdAt || new Date(),
      }
    });

    deliveryStartedCount++;
    console.log(`Created delivery_started entry for event: ${progress.event?.title} (Course ID: ${progress.module.courseId})`);
  }

  console.log(`\nDelivery started entries: ${deliveryStartedCount} created, ${deliverySkippedCount} skipped`);

  console.log('\n=== Backfill Complete ===');
  console.log(`Total audit entries created: ${createdCount + deliveryStartedCount}`);

  // Update existing entries with project titles
  await updateExistingEntriesWithProjectTitles();
}

async function updateExistingEntriesWithProjectTitles() {
  console.log('\n--- Updating existing entries with project titles ---\n');

  // Get all event audit entries that might be missing project titles
  const auditEntries = await prisma.course_audit_logs.findMany({
    where: {
      entityType: 'event',
    },
    select: {
      id: true,
      entityId: true,
      metadata: true,
    }
  });

  let updatedCount = 0;

  for (const entry of auditEntries) {
    const metadata = entry.metadata || {};

    // Skip if already has projectTitle
    if (metadata.projectTitle) continue;

    // Get the event to find the project
    const event = await prisma.events.findUnique({
      where: { id: entry.entityId },
      select: {
        projectId: true,
        project: {
          select: { title: true }
        }
      }
    });

    if (event?.project?.title) {
      await prisma.course_audit_logs.update({
        where: { id: entry.id },
        data: {
          metadata: {
            ...metadata,
            projectTitle: event.project.title,
          }
        }
      });
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} existing entries with project titles`);
}

backfillEventAuditLogs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
