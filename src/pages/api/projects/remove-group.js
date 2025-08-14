import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { updatedGroups, index, groupId } = req.body;
  
  try {
    console.log('Remove group API called');
    console.log('Group ID to delete:', groupId);
    
    if (groupId) {
      console.log('Deleting group with ID:', groupId);
      
      // Delete related records first to avoid foreign key constraint violations
      
      // 1. Delete from event_groups table
      await prisma.event_groups.deleteMany({
        where: { groupId: parseInt(groupId) }
      });
      console.log('Deleted event_groups records');
      
      // 2. Delete from group_participants table
      await prisma.group_participants.deleteMany({
        where: { groupId: parseInt(groupId) }
      });
      console.log('Deleted group_participants records');
      
      // 3. Delete from group_curriculums table
      await prisma.group_curriculums.deleteMany({
        where: { groupId: parseInt(groupId) }
      });
      console.log('Deleted group_curriculums records');
      
      // 4. Finally delete the group itself
      await prisma.groups.delete({
        where: { id: parseInt(groupId) }
      });
      
      console.log('Group deleted successfully');
    }
    
    const result = {
      newGroupsArray: updatedGroups,
      projectIndex: index,
      deletedGroupId: groupId
    };
    
    return res.status(200).json({ ...result });
  } catch (error) {
    console.error('Error deleting group:', error);
    return res.status(500).json({ error: 'Failed to delete group' });
  } finally {
    await prisma.$disconnect();
  }
}