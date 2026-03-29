import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';
import { WorkOS } from '@workos-inc/node';
const workos = new WorkOS(process.env.WORKOS_API_KEY);

async function authenticateUser(req) {
  const userId = req.cookies.workos_user_id;
  if (!userId) {
    return null;
  }
  const user = await workos.userManagement.getUser(userId);
  return user || null;
}

export default createHandler({
  scope: 'org',

  GET: async (req, res) => {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Fetch all parking lot items for a project
    const items = await prisma.parking_lot_items.findMany({
      where: {
        projectId: parseInt(projectId)
      },
      orderBy: [
        { status: 'asc' }, // open first, then in_progress, then resolved
        { createdAt: 'desc' }
      ]
    });

    return res.status(200).json(items);
  },

  POST: async (req, res) => {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Create new parking lot item(s)
    const { items: newItems, item: singleItem } = req.body;

    // Handle bulk create (multiple items)
    if (newItems && Array.isArray(newItems)) {
      const createdItems = await prisma.parking_lot_items.createMany({
        data: newItems.map(item => ({
          projectId: parseInt(projectId),
          type: item.type || 'issue',
          title: item.title,
          description: item.description || null,
          priority: item.priority || 'medium',
          status: 'open',
          reportedDate: new Date(),
          reportedBy: item.reportedBy || null,
          notes: item.notes || null,
          createdBy: user.id
        }))
      });

      // Fetch the created items to return them
      const allItems = await prisma.parking_lot_items.findMany({
        where: {
          projectId: parseInt(projectId)
        },
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return res.status(201).json({
        message: `${createdItems.count} items created successfully`,
        items: allItems
      });
    }

    // Handle single item create
    if (singleItem || req.body.title) {
      const itemData = singleItem || req.body;

      if (!itemData.title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const createdItem = await prisma.parking_lot_items.create({
        data: {
          projectId: parseInt(projectId),
          type: itemData.type || 'issue',
          title: itemData.title,
          description: itemData.description || null,
          priority: itemData.priority || 'medium',
          status: 'open',
          reportedDate: new Date(),
          reportedBy: itemData.reportedBy || null,
          notes: itemData.notes || null,
          createdBy: user.id
        }
      });

      return res.status(201).json(createdItem);
    }

    return res.status(400).json({ error: 'No item data provided' });
  },

  PUT: async (req, res) => {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { projectId, id } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Update a parking lot item
    if (!id) {
      return res.status(400).json({ error: 'Item ID is required for update' });
    }

    const updateData = req.body;

    // Build update object with only provided fields
    const updateFields = {};
    if (updateData.type !== undefined) updateFields.type = updateData.type;
    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.priority !== undefined) updateFields.priority = updateData.priority;
    if (updateData.status !== undefined) {
      updateFields.status = updateData.status;
      // Auto-set solvedDate when marking as resolved
      if (updateData.status === 'resolved') {
        updateFields.solvedDate = new Date();
      } else if (updateData.status !== 'resolved') {
        updateFields.solvedDate = null;
      }
    }
    if (updateData.reportedBy !== undefined) updateFields.reportedBy = updateData.reportedBy;
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes;

    updateFields.updatedBy = user.id;

    const updatedItem = await prisma.parking_lot_items.update({
      where: {
        id: parseInt(id)
      },
      data: updateFields
    });

    return res.status(200).json(updatedItem);
  },

  DELETE: async (req, res) => {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { projectId, id } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Delete a parking lot item
    if (!id) {
      return res.status(400).json({ error: 'Item ID is required for delete' });
    }

    await prisma.parking_lot_items.delete({
      where: {
        id: parseInt(id)
      }
    });

    return res.status(200).json({ message: 'Item deleted successfully' });
  }
});
