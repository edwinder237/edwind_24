import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Training recipient ID is required' });
  }

  try {
    // Fetch the training recipient 
    const recipient = await prisma.training_recipients.findUnique({
      where: {
        id: parseInt(id)
      }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Training recipient not found' });
    }

    // Fetch projects linked to this training recipient
    const projects = await prisma.projects.findMany({
      where: {
        trainingRecipientId: parseInt(id)
      },
      include: {
        participants: {
          include: {
            participant: {
              include: {
                role: true
              }
            }
          },
          where: {
            status: { not: "removed" }
          }
        },
        groups: true,
        events: {
          select: {
            id: true,
            title: true,
            start: true,
            end: true,
            eventStatus: true
          }
        }
      }
    });

    // Fetch participants directly linked to this training recipient
    const participants = await prisma.participants.findMany({
      where: {
        trainingRecipientId: parseInt(id)
      },
      include: {
        role: true,
        training_recipient: true,
        projects: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                projectStatus: true
              }
            }
          },
          where: {
            status: { not: "removed" }
          }
        }
      }
    });

    // Aggregate participant data from all projects
    const allParticipants = [];
    const participantMap = new Map();

    // Process participants from projects
    if (projects) {
      projects.forEach(project => {
        if (project.participants) {
          project.participants.forEach(projectParticipant => {
            const participant = projectParticipant.participant;
            if (participant) {
              const key = participant.id;
              if (!participantMap.has(key)) {
                participantMap.set(key, {
                  ...participant,
                  projects: [],
                  projectIds: new Set() // Track unique project IDs
                });
              }
              const participantData = participantMap.get(key);
              
              // Only add if this project hasn't been added yet
              if (!participantData.projectIds.has(project.id)) {
                participantData.projectIds.add(project.id);
                participantData.projects.push({
                  id: project.id,
                  title: project.title,
                  status: project.projectStatus,
                  role: participant.role?.name || 'Participant'
                });
              }
            }
          });
        }
      });
    }

    // Add participants that are directly linked to training recipient
    if (participants) {
      participants.forEach(participant => {
        const key = participant.id;
        if (!participantMap.has(key)) {
          participantMap.set(key, {
            ...participant,
            projects: [],
            projectIds: new Set() // Track unique project IDs
          });
        }
        const participantData = participantMap.get(key);
        
        // Add project info from projects relationship
        if (participant.projects) {
          participant.projects.forEach(pp => {
            if (pp.project) {
              // Only add if this project hasn't been added yet
              if (!participantData.projectIds.has(pp.project.id)) {
                participantData.projectIds.add(pp.project.id);
                participantData.projects.push({
                  id: pp.project.id,
                  title: pp.project.title,
                  status: pp.project.projectStatus,
                  role: participant.role?.name || 'Participant'
                });
              }
            }
          });
        }
      });
    }

    // Convert map to array and clean up internal tracking fields
    participantMap.forEach(participant => {
      // Remove the projectIds Set before adding to response
      const { projectIds, ...cleanParticipant } = participant;
      allParticipants.push(cleanParticipant);
    });

    // Calculate statistics
    const stats = {
      totalProjects: projects?.length || 0,
      activeProjects: projects?.filter(p => p.projectStatus === 'active' || p.projectStatus === 'ongoing')?.length || 0,
      totalParticipants: allParticipants.length,
      totalEvents: projects?.reduce((sum, project) => sum + (project.events?.length || 0), 0) || 0
    };

    // Parse location JSON if it exists
    let parsedRecipient = { ...recipient };
    if (recipient.location) {
      try {
        parsedRecipient.location = typeof recipient.location === 'string' 
          ? JSON.parse(recipient.location) 
          : recipient.location;
      } catch (error) {
        console.error('Error parsing location JSON:', error);
        parsedRecipient.location = null;
      }
    }

    // Prepare response data
    const responseData = {
      recipient: {
        ...parsedRecipient,
        stats
      },
      participants: allParticipants,
      projects: projects?.map(project => ({
        id: project.id,
        title: project.title,
        status: project.projectStatus,
        startDate: project.startDate,
        endDate: project.endDate,
        description: project.summary,
        participantCount: project.participants?.length || 0,
        groupCount: project.groups?.length || 0,
        eventCount: project.events?.length || 0,
        participants: project.participants?.map(pp => ({
          id: pp.participant?.id,
          firstName: pp.participant?.firstName,
          lastName: pp.participant?.lastName,
          email: pp.participant?.email,
          phone: pp.participant?.phone,
          role: pp.participant?.role?.name || 'Participant',
          status: pp.status
        })) || []
      })) || []
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('[fetchSingle] Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
}