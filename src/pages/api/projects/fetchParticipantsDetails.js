import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { projectId } = req.body;

  // Validate projectId
  if (!projectId || isNaN(parseInt(projectId))) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    // Optimized query with includes to fetch related data
    const projectParticipants = await prisma.project_participants.findMany({
      where: {
        projectId: parseInt(projectId),
        status: { not: "removed" } // Only fetch active participants
      },
      include: {
        participant: {
          include: {
            training_recipient: true, // Include training recipient (legacy)
            role: true, // Include role information
            toolAccesses: {
              where: {
                isActive: true // Only include active tool accesses
              },
              orderBy: {
                tool: 'asc' // Sort tools alphabetically
              }
            }
          }
        },
        training_recipient: true, // Include enrollment-level training recipient (NEW architecture)
        group: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        id: 'desc' // Most recent first for better UX
      }
    });

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    res.status(200).json(projectParticipants);
  } catch (error) {
    console.error('[fetchParticipantsDetails] Error:', error);
    res.status(500).json({ 
      error: "Internal Server Error",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
}