/**
 * ============================================
 * GET /api/participants/fetchSingle
 * ============================================
 *
 * Fetches a single participant with all related data including:
 * - Projects enrolled in
 * - Courses with completion status
 * - Curriculums with progress
 * - Events with attendance
 * - Assessment scores
 * - Checklist items
 *
 * Multi-tenancy: All queries are scoped to the user's organization via:
 * 1. withOrgScope middleware validates authentication and org membership
 * 2. Primary participant lookup verifies sub_organization ownership
 * 3. All related data queries filter by sub_organizationId
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { participantId } = req.query;

  if (!participantId) {
    return res.status(400).json({
      success: false,
      message: 'Participant ID is required'
    });
  }

  try {
    // Multi-tenancy gate: First verify participant belongs to user's organization
    // Query with org filter to prevent enumeration attacks
    const participant = await prisma.participants.findFirst({
      where: {
        id: participantId,
        sub_organization: {
          in: orgContext.subOrganizationIds
        }
      },
      include: {
        role: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        training_recipient: {
          // Only include if training recipient belongs to same org
          select: {
            id: true,
            name: true,
            industry: true,
            address: true,
            sub_organizationId: true
          }
        },
        toolAccesses: {
          where: { isActive: true },
          select: {
            id: true,
            tool: true,
            toolType: true,
            toolUrl: true,
            toolDescription: true,
            username: true,
            isActive: true
          }
        }
      }
    });

    // Return 404 for both not found AND access denied (prevents enumeration)
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Additional validation: ensure training recipient is also in org scope
    // (defensive check - should already be scoped via participant's sub_org)
    if (participant.training_recipient &&
        !orgContext.subOrganizationIds.includes(participant.training_recipient.sub_organizationId)) {
      // Don't expose training recipient from different org
      participant.training_recipient = null;
    }

    // Get all projects the participant is enrolled in with enrollment details
    const projectParticipants = await prisma.project_participants.findMany({
      where: {
        participantId: participantId,
        project: {
          sub_organizationId: {
            in: orgContext.subOrganizationIds
          }
        }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            projectStatus: true,
            startDate: true,
            endDate: true,
            trainingRecipientId: true,
            project_curriculums: {
              include: {
                curriculum: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    sub_organizationId: true, // Include for validation
                    curriculum_courses: {
                      include: {
                        course: {
                          select: {
                            id: true,
                            title: true,
                            duration: true,
                            sub_organizationId: true // Include for validation
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
        group: {
          include: {
            group: {
              select: {
                id: true,
                groupName: true,
                chipColor: true
              }
            }
          }
        },
        courses_enrollee_progress: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                duration: true,
                CourseType: true,
                level: true,
                sub_organizationId: true // Include for validation
              }
            }
          }
        },
        event_attendees: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                start: true,
                end: true,
                eventType: true,
                eventStatus: true,
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
        },
        assessment_scores: {
          include: {
            courseAssessment: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            },
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            assessmentDate: 'desc'
          }
        },
        checklist_progress: {
          include: {
            checklistItem: {
              include: {
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
    });

    // Get additional event attendance data for events the participant attended via groups
    const groupAttendedEvents = await prisma.events.findMany({
      where: {
        project: {
          sub_organizationId: {
            in: orgContext.subOrganizationIds
          },
          participants: {
            some: {
              participantId: participantId
            }
          }
        },
        event_groups: {
          some: {
            groups: {
              participants: {
                some: {
                  participant: {
                    participantId: participantId
                  }
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        start: true,
        end: true,
        eventType: true,
        eventStatus: true,
        courseId: true,
        course: {
          select: {
            id: true,
            title: true
          }
        },
        event_attendees: {
          where: {
            enrollee: {
              participantId: participantId
            }
          },
          select: {
            attendance_status: true
          }
        }
      }
    });

    // Process and aggregate the data with multi-tenancy filtering
    const projects = projectParticipants.map(pp => {
      // Filter curriculums to only include those from user's org
      const scopedCurriculums = pp.project.project_curriculums
        .filter(pc => orgContext.subOrganizationIds.includes(pc.curriculum.sub_organizationId))
        .map(pc => {
          // Filter courses within curriculum to only include those from user's org
          const scopedCourses = pc.curriculum.curriculum_courses
            .filter(cc => orgContext.subOrganizationIds.includes(cc.course.sub_organizationId))
            .map(cc => ({
              id: cc.course.id,
              title: cc.course.title,
              duration: cc.course.duration
            }));

          return {
            id: pc.curriculum.id,
            title: pc.curriculum.title,
            description: pc.curriculum.description,
            courseCount: scopedCourses.length,
            courses: scopedCourses
          };
        });

      return {
        id: pp.project.id,
        title: pp.project.title,
        status: pp.project.projectStatus,
        enrollmentStatus: pp.status,
        startDate: pp.project.startDate,
        endDate: pp.project.endDate,
        groups: pp.group.map(g => ({
          id: g.group.id,
          name: g.group.groupName,
          color: g.group.chipColor
        })),
        curriculums: scopedCurriculums
      };
    });

    // Aggregate courses across all projects (with org scoping)
    const coursesMap = new Map();
    projectParticipants.forEach(pp => {
      pp.courses_enrollee_progress
        .filter(cep => orgContext.subOrganizationIds.includes(cep.course.sub_organizationId))
        .forEach(cep => {
          const courseId = cep.course.id;
          if (!coursesMap.has(courseId)) {
            coursesMap.set(courseId, {
              id: courseId,
              title: cep.course.title,
              duration: cep.course.duration,
              type: cep.course.CourseType,
              level: cep.course.level,
              completed: cep.completed,
              projectId: pp.project.id,
              projectTitle: pp.project.title,
              lastUpdated: cep.lastUpdated
            });
          } else if (cep.completed && !coursesMap.get(courseId).completed) {
            // Update if this enrollment shows completed
            coursesMap.get(courseId).completed = true;
            coursesMap.get(courseId).lastUpdated = cep.lastUpdated;
          }
        });
    });
    const courses = Array.from(coursesMap.values());

    // Aggregate events across all projects
    const eventsMap = new Map();
    projectParticipants.forEach(pp => {
      pp.event_attendees.forEach(ea => {
        const eventId = ea.event.id;
        if (!eventsMap.has(eventId)) {
          eventsMap.set(eventId, {
            id: eventId,
            title: ea.event.title,
            start: ea.event.start,
            end: ea.event.end,
            eventType: ea.event.eventType,
            eventStatus: ea.event.eventStatus,
            attendanceStatus: ea.attendance_status,
            courseId: ea.event.courseId,
            courseTitle: ea.event.course?.title,
            projectId: pp.project.id,
            projectTitle: pp.project.title
          });
        }
      });
    });

    // Add group-attended events
    groupAttendedEvents.forEach(event => {
      if (!eventsMap.has(event.id)) {
        eventsMap.set(event.id, {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          eventType: event.eventType,
          eventStatus: event.eventStatus,
          attendanceStatus: event.event_attendees[0]?.attendance_status || 'scheduled',
          courseId: event.courseId,
          courseTitle: event.course?.title
        });
      }
    });
    const events = Array.from(eventsMap.values()).sort((a, b) =>
      new Date(b.start) - new Date(a.start)
    );

    // Aggregate assessments across all projects
    const assessments = [];
    projectParticipants.forEach(pp => {
      pp.assessment_scores.forEach(score => {
        assessments.push({
          id: score.id,
          assessmentId: score.courseAssessmentId,
          assessmentTitle: score.courseAssessment.title,
          courseId: score.courseAssessment.course.id,
          courseTitle: score.courseAssessment.course.title,
          scoreEarned: score.scoreEarned,
          scoreMaximum: score.scoreMaximum,
          scorePercentage: score.scorePercentage,
          passed: score.passed,
          attemptNumber: score.attemptNumber,
          assessmentDate: score.assessmentDate,
          feedback: score.feedback,
          instructorName: score.instructor
            ? `${score.instructor.firstName} ${score.instructor.lastName}`
            : null,
          projectId: pp.project.id,
          projectTitle: pp.project.title
        });
      });
    });

    // Aggregate checklist items
    const checklistItems = [];
    projectParticipants.forEach(pp => {
      pp.checklist_progress.forEach(cp => {
        checklistItems.push({
          id: cp.id,
          itemId: cp.checklistItem.id,
          title: cp.checklistItem.title,
          description: cp.checklistItem.description,
          category: cp.checklistItem.category,
          completed: cp.completed,
          completedAt: cp.completedAt,
          courseId: cp.checklistItem.course?.id,
          courseTitle: cp.checklistItem.course?.title,
          projectId: pp.project.id,
          projectTitle: pp.project.title
        });
      });
    });

    // Calculate statistics
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.enrollmentStatus === 'active').length,
      totalCourses: courses.length,
      completedCourses: courses.filter(c => c.completed).length,
      totalEvents: events.length,
      attendedEvents: events.filter(e => e.attendanceStatus === 'present' || e.attendanceStatus === 'late').length,
      totalAssessments: assessments.length,
      passedAssessments: assessments.filter(a => a.passed).length,
      averageScore: assessments.length > 0
        ? (assessments.reduce((sum, a) => sum + a.scorePercentage, 0) / assessments.length).toFixed(1)
        : 0,
      checklistProgress: checklistItems.length > 0
        ? ((checklistItems.filter(c => c.completed).length / checklistItems.length) * 100).toFixed(0)
        : 0
    };

    // Get all unique curriculums from the participant's projects
    const curriculumsMap = new Map();
    projects.forEach(project => {
      project.curriculums.forEach(curriculum => {
        if (!curriculumsMap.has(curriculum.id)) {
          // Calculate completion for this curriculum
          const curriculumCourseIds = curriculum.courses.map(c => c.id);
          const completedCurriculumCourses = courses.filter(
            c => curriculumCourseIds.includes(c.id) && c.completed
          ).length;

          curriculumsMap.set(curriculum.id, {
            ...curriculum,
            completedCourses: completedCurriculumCourses,
            totalCourses: curriculum.courseCount,
            progress: curriculum.courseCount > 0
              ? Math.round((completedCurriculumCourses / curriculum.courseCount) * 100)
              : 0,
            projectId: project.id,
            projectTitle: project.title
          });
        }
      });
    });
    const curriculums = Array.from(curriculumsMap.values());

    // Clean up training recipient data (remove internal org ID)
    const cleanTrainingRecipient = participant.training_recipient ? {
      id: participant.training_recipient.id,
      name: participant.training_recipient.name,
      industry: participant.training_recipient.industry,
      address: participant.training_recipient.address
    } : null;

    return res.status(200).json({
      success: true,
      participant: {
        id: participant.id,
        firstName: participant.firstName,
        middleName: participant.middleName,
        lastName: participant.lastName,
        email: participant.email,
        status: participant.participantStatus,
        type: participant.participantType,
        department: participant.derpartement,
        tag: participant.tag,
        notes: participant.notes,
        profileImg: participant.profileImg,
        role: participant.role,
        trainingRecipient: cleanTrainingRecipient,
        toolAccesses: participant.toolAccesses,
        createdAt: participant.createdAt,
        lastUpdated: participant.lastUpdated
      },
      projects,
      courses,
      curriculums,
      events,
      assessments,
      checklistItems,
      stats
    });

  } catch (error) {
    console.error('Error fetching participant details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch participant details',
      error: error.message
    });
  }
}

export default withOrgScope(handler);
