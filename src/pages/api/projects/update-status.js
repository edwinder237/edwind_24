import prisma from '../../../lib/prisma';
import { PROJECT_STATUS } from '../../../constants';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, status } = req.body;

    if (!projectId || !status) {
      return res.status(400).json({ message: 'Project ID and status are required' });
    }

    // Validate status
    const validStatuses = Object.values(PROJECT_STATUS);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Update project status
    const updatedProject = await prisma.projects.update({
      where: { id: parseInt(projectId) },
      data: { 
        projectStatus: status,
        lastUpdated: new Date()
      }
    });

    res.status(200).json({
      message: 'Project status updated successfully',
      project: {
        id: updatedProject.id,
        projectStatus: updatedProject.projectStatus,
        lastUpdated: updatedProject.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ 
      message: 'Failed to update project status', 
      error: error.message 
    });
  }
}