import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

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

  const objectives = await prisma.module_objectives.findMany({
    where: { moduleId: parsedModuleId },
    orderBy: { objectiveOrder: 'asc' }
  });

  return res.status(200).json({
    success: true,
    objectives: objectives
  });
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
}

export default createHandler({
  scope: 'org',
  GET: getModuleObjectives,
  POST: createModuleObjective,
  PUT: updateModuleObjective,
  DELETE: deleteModuleObjective
});
