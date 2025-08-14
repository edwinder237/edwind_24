import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { moduleId } = req.body;
  
  try {
    // Use a transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete module role assignments first
      await tx.module_participant_roles.deleteMany({
        where: {
          moduleId: parseInt(moduleId)
        }
      });


      // Delete activities
      await tx.activities.deleteMany({
        where: {
          moduleId: parseInt(moduleId)
        }
      });


      // Delete course checklist items related to this module
      await tx.course_checklist_items.deleteMany({
        where: {
          moduleId: parseInt(moduleId)
        }
      });


      // Finally delete the module itself
      await tx.modules.delete({
        where: {
          id: parseInt(moduleId)
        }
      });
    });

    res.status(200).json({ message: "Module and all related data deleted successfully" });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: "Failed to delete module" });
  }
}

  
  
  
  
  
  
