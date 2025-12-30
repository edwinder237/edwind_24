/**
 * ============================================
 * POST /api/projects/fetchSingleProject
 * ============================================
 *
 * Returns comprehensive project data with all relations.
 * FIXED: Previously leaked project data across organizations.
 *
 * Body:
 * - id (required): Project ID to fetch
 *
 * Response:
 * {
 *   project: {...}
 * }
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { id } = req.body;
  const { orgContext } = req;

  if (!id) {
    throw new ValidationError('Project ID is required');
  }

  try {
    const projectId = parseInt(id);

    // First verify project exists and belongs to organization
    const projectOwnership = await scopedFindUnique(orgContext, 'projects', {
      where: { id: projectId }
    });

    if (!projectOwnership) {
      throw new NotFoundError('Project not found');
    }
    const project = await prisma.projects.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        training_recipient: true,
        project_settings: true,  // Include project settings for dates
        project_instructors: {
          include: {
            instructor: true
          }
        },
        participants: {
          where: {
            status: {
              not: 'removed'
            }
          },
          include: {
            courses_enrollee_progress: true,
            participant: {
              include: {
                training_recipient: true,
                role: true // Include role from participants table
              }
            },
          },
        },
        groups: {
          include: {
            participants: {
              include: {
                participant: {
                  include: {
                    participant: {
                      include: {
                        training_recipient: true,
                        role: true // Include role from participants table
                      }
                    }
                  }
                }
              }
            }
          }
        },
        events: {
          include: {
            course: {
              include: {
                modules: {
                  include: {
                    activities: {
                      orderBy: {
                        ActivityOrder: 'asc'
                      }
                    }
                  },
                  orderBy: {
                    moduleOrder: 'asc'
                  }
                },
                course_participant_roles: {
                  include: {
                    role: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
                  }
                }
              }
            },
            event_attendees: {
              select: {
                id: true,
                eventsId: true,
                enrolleeId: true,
                attendance_status: true, // Include attendance status
                enrollee: {
                  select: {
                    id: true,
                    participantId: true,
                    status: true,
                    participant: {
                      include: {
                        training_recipient: true,
                        role: true // Include role from participants table
                      }
                    },
                  },
                },
              },
            },
            event_groups: {
              include: {
                groups: {
                  include: {
                    participants: {
                      include: {
                        participant: {
                          include: {
                            participant: {
                              include: {
                                training_recipient: true,
                                role: true
                              }
                            }
                          }
                        }
                      }
                    },
                  },
                },
              },
            },
          },
        },
        project_curriculums: {
          include: {
            curriculum: {
              include: {
                curriculum_courses: {
                  include: {
                    course: {
                      include: {
                        modules: {
                          include: {
                            activities: {
                              select: {
                                duration: true
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
      },
    });

    if (!project) {
      return res.status(404).json({ Project: null, error: `Project with ID ${id} not found` });
    }

    res.status(200).json({ project });
  } catch (error) {
    console.error('Error fetching single project:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
