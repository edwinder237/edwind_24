import { withOrgScope } from '../../../lib/middleware/withOrgScope';
import prisma from '../../../lib/prisma';

export default withOrgScope(async (req, res) => {
  const { id } = req.query;
  const { orgContext } = req;
  const roomId = parseInt(id);

  if (isNaN(roomId)) {
    return res.status(400).json({ error: 'Invalid room ID' });
  }

  // Verify room belongs to a training recipient in user's sub-organizations
  const room = await prisma.rooms.findFirst({
    where: {
      id: roomId,
      training_recipient: {
        sub_organizationId: { in: orgContext.subOrganizationIds }
      }
    },
    include: {
      training_recipient: {
        select: { id: true, name: true }
      }
    }
  });

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // GET - Return single room
  if (req.method === 'GET') {
    return res.json(room);
  }

  // PUT - Update room
  if (req.method === 'PUT') {
    try {
      const { name, location, capacity, type, roomType, status, equipment, notes, trainingRecipientId } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: 'Room name is required' });
      }

      // If changing training recipient, verify access
      if (trainingRecipientId && trainingRecipientId !== room.trainingRecipientId) {
        const newRecipient = await prisma.training_recipients.findFirst({
          where: {
            id: trainingRecipientId,
            sub_organizationId: { in: orgContext.subOrganizationIds }
          }
        });
        if (!newRecipient) {
          return res.status(403).json({ error: 'Invalid training recipient' });
        }
      }

      const updated = await prisma.rooms.update({
        where: { id: roomId },
        data: {
          name: name.trim(),
          location: location || null,
          capacity: capacity ? parseInt(capacity) : null,
          type: type || 'Physical',
          roomType: roomType || 'Conference',
          status: status || 'Available',
          equipment: equipment || [],
          notes: notes || null,
          trainingRecipientId: trainingRecipientId || room.trainingRecipientId,
          updatedBy: orgContext.userId
        },
        include: {
          training_recipient: {
            select: { id: true, name: true }
          }
        }
      });
      return res.json(updated);
    } catch (error) {
      console.error('Error updating room:', error);
      return res.status(500).json({ error: 'Failed to update room' });
    }
  }

  // DELETE - Soft delete
  if (req.method === 'DELETE') {
    try {
      await prisma.rooms.update({
        where: { id: roomId },
        data: {
          isActive: false,
          updatedBy: orgContext.userId
        }
      });
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting room:', error);
      return res.status(500).json({ error: 'Failed to delete room' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
