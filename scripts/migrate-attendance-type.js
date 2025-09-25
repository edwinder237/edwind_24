// Migration script to set attendanceType for existing event_attendees records
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAttendanceType() {
  console.log('🚀 Starting migration of attendanceType for existing event_attendees...');

  try {
    // Get all existing event_attendees (since new field has default 'group', we need to check each)
    const allAttendees = await prisma.event_attendees.findMany();

    console.log(`📊 Found ${allAttendees.length} records to check and update`);

    if (allAttendees.length === 0) {
      console.log('✅ No records found - all done!');
      return;
    }

    let groupAttendees = 0;
    let individualAttendees = 0;

    // Update each record
    for (const attendee of allAttendees) {
      try {
        // Check if this participant was added via a group
        // Look for event_groups that contain this event and see if the participant is in that group
        const eventGroups = await prisma.event_groups.findMany({
          where: {
            eventsId: attendee.eventsId
          },
          include: {
            groups: {
              include: {
                participants: true
              }
            }
          }
        });

        let isGroupAttendee = false;
        
        // Check if this attendee is in any of the groups assigned to this event
        for (const eventGroup of eventGroups) {
          const groupHasParticipant = eventGroup.groups.participants.some(
            gp => gp.participantId === attendee.enrolleeId
          );
          
          if (groupHasParticipant) {
            isGroupAttendee = true;
            break;
          }
        }

        const attendanceType = isGroupAttendee ? 'group' : 'individual';
        
        await prisma.event_attendees.update({
          where: { id: attendee.id },
          data: { attendanceType }
        });

        if (isGroupAttendee) {
          groupAttendees++;
        } else {
          individualAttendees++;
        }

        if ((groupAttendees + individualAttendees) % 10 === 0) {
          console.log(`📈 Progress: ${groupAttendees + individualAttendees}/${allAttendees.length} records updated`);
        }

      } catch (error) {
        console.error(`❌ Error updating attendee ${attendee.id}:`, error.message);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log(`📊 Results:`);
    console.log(`   - Group attendees: ${groupAttendees}`);
    console.log(`   - Individual attendees: ${individualAttendees}`);
    console.log(`   - Total updated: ${groupAttendees + individualAttendees}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateAttendanceType()
  .then(() => {
    console.log('🎉 Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });