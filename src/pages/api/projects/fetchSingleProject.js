import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { id } = req.body;
  try {
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
    console.error(error);
    res
      .status(500)
      .json({ error: `Internal Server Error from fetch single project ${id}` });
  }
}
