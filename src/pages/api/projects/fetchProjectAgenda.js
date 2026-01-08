import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.body;
  const { orgContext } = req;

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  try {
    // First verify project exists and belongs to organization
    const projectOwnership = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) }
    });

    if (!projectOwnership) {
      throw new NotFoundError('Project not found');
    }

    // Single optimized query to get all agenda-related data
    const agendaData = await prisma.projects.findUnique({
      where: {
        id: parseInt(projectId),
      },
      select: {
        id: true,
        title: true,
        projectStatus: true,
        startDate: true,
        endDate: true,
        
        // Events with all necessary relations for agenda view
        events: {
          select: {
            id: true,
            title: true,
            description: true,
            eventType: true,
            projectId: true,
            courseId: true,
            supportActivityId: true,
            start: true,
            end: true,
            allDay: true,
            color: true,
            textColor: true,
            backgroundColor: true,
            borderColor: true,
            editable: true,
            eventStatus: true,
            extendedProps: true,
            
            // Course information for each event
            course: {
              select: {
                id: true,
                title: true,
                summary: true,
                duration: true,
                level: true,
                courseCategory: true,
                backgroundImg: true,
                code: true,
                version: true,
                
                // Modules and activities for course content
                modules: {
                  select: {
                    id: true,
                    title: true,
                    summary: true,
                    duration: true,
                    moduleOrder: true,
                    level: true,
                    moduleStatus: true,
                    backgroundImg: true,
                    
                    activities: {
                      select: {
                        id: true,
                        title: true,
                        summary: true,
                        duration: true,
                        activityType: true,
                        activityCategory: true,
                        activityStatus: true,
                        ActivityOrder: true,
                        backgroundImg: true
                      },
                      orderBy: {
                        ActivityOrder: 'asc'
                      }
                    }
                  },
                  orderBy: {
                    moduleOrder: 'asc'
                  }
                },
                
                // Course participant roles for role-based filtering
                course_participant_roles: {
                  select: {
                    id: true,
                    isRequired: true,
                    role: {
                      select: {
                        id: true,
                        title: true,
                        description: true
                      }
                    }
                  }
                }
              }
            },
            
            // Support activity information
            supportActivity: {
              select: {
                id: true,
                title: true,
                description: true,
                activityType: true,
                duration: true
              }
            },
            
            // Event attendees with participant details
            event_attendees: {
              select: {
                id: true,
                enrolleeId: true,
                attendance_status: true,
                attendanceType: true,

                enrollee: {
                  select: {
                    id: true,
                    participantId: true,
                    status: true,
                    
                    participant: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        participantStatus: true,
                        participantType: true,
                        profileImg: true,
                        
                        role: {
                          select: {
                            id: true,
                            title: true,
                            description: true
                          }
                        },
                        
                        training_recipient: {
                          select: {
                            id: true,
                            name: true
                          }
                        }
                      }
                    }
                  }
                }
              },
              where: {
                enrollee: {
                  status: {
                    not: 'removed'
                  }
                }
              }
            },
            
            // Event groups with participant details
            event_groups: {
              select: {
                id: true,
                groupId: true,

                groups: {
                  select: {
                    id: true,
                    groupName: true,
                    chipColor: true,
                    
                    participants: {
                      select: {
                        id: true,
                        
                        participant: {
                          select: {
                            id: true,
                            participantId: true,
                            status: true,
                            
                            participant: {
                              select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                participantStatus: true,
                                participantType: true,
                                profileImg: true,
                                
                                role: {
                                  select: {
                                    id: true,
                                    title: true,
                                    description: true
                                  }
                                },
                                
                                training_recipient: {
                                  select: {
                                    id: true,
                                    name: true
                                  }
                                }
                              }
                            }
                          }
                        }
                      },
                      where: {
                        participant: {
                          status: {
                            not: 'removed'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            
            // Event instructors
            event_instructors: {
              select: {
                id: true,
                role: true,
                
                instructor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    instructorType: true,
                    status: true,
                    profileImage: true,
                    expertise: true
                  }
                }
              }
            }
          },
          orderBy: {
            start: 'asc'
          }
        },
        
        // Groups data for agenda operations
        groups: {
          select: {
            id: true,
            projectId: true,
            groupName: true,
            chipColor: true,

            participants: {
              select: {
                id: true,

                participant: {
                  select: {
                    id: true,
                    participantId: true,
                    status: true,

                    participant: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        participantStatus: true,
                        participantType: true,
                        profileImg: true,

                        role: {
                          select: {
                            id: true,
                            title: true,
                            description: true
                          }
                        },

                        training_recipient: {
                          select: {
                            id: true,
                            name: true
                          }
                        }
                      }
                    }
                  }
                }
              },
              where: {
                participant: {
                  status: {
                    not: 'removed'
                  }
                }
              }
            },

            group_curriculums: {
              select: {
                id: true,
                curriculumId: true,
                isActive: true,
                assignedAt: true,
                assignedBy: true,

                curriculum: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    curriculum_courses: {
                      select: {
                        id: true,
                        courseId: true,
                        course: {
                          select: {
                            id: true,
                            title: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        
        // Project participants for agenda operations
        participants: {
          select: {
            id: true,
            participantId: true,
            status: true,
            
            participant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                participantStatus: true,
                participantType: true,
                profileImg: true,
                
                role: {
                  select: {
                    id: true,
                    title: true,
                    description: true
                  }
                },
                
                training_recipient: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          where: {
            status: {
              not: 'removed'
            }
          }
        },
        
        // Project curriculums for context
        project_curriculums: {
          select: {
            id: true,
            
            curriculum: {
              select: {
                id: true,
                title: true,
                description: true,
                
                curriculum_courses: {
                  select: {
                    id: true,

                    course: {
                      select: {
                        id: true,
                        title: true,
                        summary: true,
                        courseCategory: true,
                        duration: true,
                        level: true,
                        backgroundImg: true,
                        version: true,

                        // Course participant roles for scheduling stats
                        course_participant_roles: {
                          select: {
                            id: true,
                            isRequired: true,
                            role: {
                              select: {
                                id: true,
                                title: true
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        
        // Project instructors
        project_instructors: {
          select: {
            id: true,
            instructorType: true,
            
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                instructorType: true,
                status: true,
                profileImage: true,
                expertise: true
              }
            }
          }
        }
      }
    });

    if (!agendaData) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate additional metrics that might be useful for agenda
    const metrics = {
      totalEvents: agendaData.events.length,
      totalParticipants: agendaData.participants.length,
      totalGroups: agendaData.groups.length,
      totalInstructors: agendaData.project_instructors.length,
      eventsThisWeek: agendaData.events.filter(event => {
        const eventDate = new Date(event.start);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        return eventDate >= weekStart && eventDate <= weekEnd;
      }).length,
      upcomingEvents: agendaData.events.filter(event => {
        const eventDate = new Date(event.start);
        const now = new Date();
        return eventDate > now;
      }).length,
      completedEvents: agendaData.events.filter(event => {
        const eventDate = new Date(event.end);
        const now = new Date();
        return eventDate < now;
      }).length
    };

    // Structure the response
    const response = {
      projectInfo: {
        id: agendaData.id,
        title: agendaData.title,
        projectStatus: agendaData.projectStatus,
        startDate: agendaData.startDate,
        endDate: agendaData.endDate
      },
      events: agendaData.events,
      groups: agendaData.groups,
      participants: agendaData.participants,
      curriculums: agendaData.project_curriculums,
      instructors: agendaData.project_instructors,
      metrics: metrics,
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching project agenda:', error);
    res.status(500).json({
      error: 'Failed to fetch project agenda',
      details: error.message
    });
  }
}

export default withOrgScope(asyncHandler(handler));