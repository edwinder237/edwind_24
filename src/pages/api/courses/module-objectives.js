import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    const { method } = req;

    switch (method) {
      case 'GET':
        return await getModuleObjectives(req, res);
      case 'POST':
        return await createModuleObjective(req, res);
      case 'PUT':
        return await updateModuleObjective(req, res);
      case 'DELETE':
        return await deleteModuleObjective(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// GET - Fetch module objectives
async function getModuleObjectives(req, res) {
  const { moduleId } = req.query;

  if (!moduleId) {
    return res.status(400).json({ error: 'moduleId is required' });
  }

  const parsedModuleId = parseInt(moduleId);
  if (isNaN(parsedModuleId)) {
    return res.status(400).json({ error: 'Invalid moduleId: must be a number' });
  }

  try {
    const objectives = await prisma.module_objectives.findMany({
      where: { moduleId: parsedModuleId },
      orderBy: { objectiveOrder: 'asc' }
    });

    return res.status(200).json({
      success: true,
      objectives: objectives
    });
  } catch (error) {
    console.error('Error fetching module objectives:', error);
    return res.status(500).json({
      error: 'Failed to fetch module objectives',
      details: error.message
    });
  }
}

// POST - Create module objective
async function createModuleObjective(req, res) {
  const { moduleId, objective, createdBy } = req.body;

  if (!moduleId || !objective) {
    return res.status(400).json({ 
      error: 'Missing required fields: moduleId and objective' 
    });
  }

  const parsedModuleId = parseInt(moduleId);
  if (isNaN(parsedModuleId)) {
    return res.status(400).json({ error: 'Invalid moduleId: must be a number' });
  }

  try {
    // Get the next order number
    const lastObjective = await prisma.module_objectives.findFirst({
      where: { moduleId: parsedModuleId },
      orderBy: { objectiveOrder: 'desc' }
    });

    const nextOrder = lastObjective ? lastObjective.objectiveOrder + 1 : 1;

    const newObjective = await prisma.module_objectives.create({
      data: {
        moduleId: parsedModuleId,
        objective: objective.trim(),
        objectiveOrder: nextOrder,
        createdBy: createdBy || null
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Module objective created successfully',
      objective: newObjective
    });
  } catch (error) {
    console.error('Error creating module objective:', error);
    return res.status(500).json({
      error: 'Failed to create module objective',
      details: error.message
    });
  }
}

// PUT - Update module objective
async function updateModuleObjective(req, res) {
  const { id, objective, updatedBy } = req.body;

  if (!id || !objective) {
    return res.status(400).json({ 
      error: 'Missing required fields: id and objective' 
    });
  }

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: 'Invalid id: must be a number' });
  }

  try {
    // Check if objective exists
    const existingObjective = await prisma.module_objectives.findUnique({
      where: { id: parsedId }
    });

    if (!existingObjective) {
      return res.status(404).json({ error: 'Module objective not found' });
    }

    const updatedObjective = await prisma.module_objectives.update({
      where: { id: parsedId },
      data: {
        objective: objective.trim(),
        updatedBy: updatedBy || null
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Module objective updated successfully',
      objective: updatedObjective
    });
  } catch (error) {
    console.error('Error updating module objective:', error);
    return res.status(500).json({
      error: 'Failed to update module objective',
      details: error.message
    });
  }
}

// DELETE - Delete module objective
async function deleteModuleObjective(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: 'Invalid id: must be a number' });
  }

  try {
    // Check if objective exists
    const existingObjective = await prisma.module_objectives.findUnique({
      where: { id: parsedId }
    });

    if (!existingObjective) {
      return res.status(404).json({ error: 'Module objective not found' });
    }

    await prisma.module_objectives.delete({
      where: { id: parsedId }
    });

    // Reorder remaining objectives
    const remainingObjectives = await prisma.module_objectives.findMany({
      where: { moduleId: existingObjective.moduleId },
      orderBy: { objectiveOrder: 'asc' }
    });

    // Update order numbers
    for (let i = 0; i < remainingObjectives.length; i++) {
      await prisma.module_objectives.update({
        where: { id: remainingObjectives[i].id },
        data: { objectiveOrder: i + 1 }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Module objective deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting module objective:', error);
    return res.status(500).json({
      error: 'Failed to delete module objective',
      details: error.message
    });
  }
}