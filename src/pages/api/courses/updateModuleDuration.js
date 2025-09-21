import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { moduleId, customDuration } = req.body;

    if (!moduleId) {
      return res.status(400).json({ message: 'Module ID is required' });
    }

    // If customDuration is null or undefined, we're resetting to calculated duration
    const updateData = customDuration !== null && customDuration !== undefined 
      ? { customDuration: parseInt(customDuration) }
      : { customDuration: null };

    // Update the module in the database
    const updatedModule = await prisma.module.update({
      where: { id: parseInt(moduleId) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: customDuration !== null && customDuration !== undefined 
        ? 'Module duration updated successfully'
        : 'Module duration reset to calculated value',
      module: updatedModule
    });

  } catch (error) {
    console.error('Error updating module duration:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update module duration',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}