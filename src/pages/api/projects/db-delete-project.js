import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { projectCUID } = req.body;
  
  try {
    // Use a transaction to delete all related records and then the project
    await prisma.$transaction(async (tx) => {
      // First, delete all group_participants associated with groups of this project
      await tx.group_participants.deleteMany({
        where: {
          group: {
            projectId: projectCUID
          }
        }
      });

      // Delete all event_groups associated with events of this project
      await tx.event_groups.deleteMany({
        where: {
          event: {
            projectId: projectCUID
          }
        }
      });

      // Delete all event_attendees associated with events of this project
      await tx.event_attendees.deleteMany({
        where: {
          event: {
            projectId: projectCUID
          }
        }
      });

      // Delete all groups associated with this project
      await tx.groups.deleteMany({
        where: {
          projectId: projectCUID
        }
      });


      // Delete all courses_enrollee_progress associated with project participants
      await tx.courses_enrollee_progress.deleteMany({
        where: {
          enrollee: {
            projectId: projectCUID
          }
        }
      });

      // Delete all project_participants
      await tx.project_participants.deleteMany({
        where: {
          projectId: projectCUID
        }
      });

      // Delete all project_curriculums
      await tx.project_curriculums.deleteMany({
        where: {
          projectId: projectCUID
        }
      });

      // Delete all events (this should cascade to event_attendees and event_groups due to onDelete: Cascade)
      await tx.events.deleteMany({
        where: {
          projectId: projectCUID
        }
      });

      // Delete all daily_focus entries
      await tx.daily_focus.deleteMany({
        where: {
          projectId: projectCUID
        }
      });

      // Finally, delete the project itself
      await tx.projects.delete({
        where: {
          id: projectCUID,
        },
      });
    });

    res.status(200).json({ success: true, message: "Project and all related data removed from database" });
    console.log("Project and all related data removed from database");
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      details: "Failed to delete project and related data"
    });
  }
}
