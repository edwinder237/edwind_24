import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    // Fetch comprehensive project data with all necessary relations
    const project = await prisma.projects.findUnique({
      where: {
        id: parseInt(projectId),
      },
      include: {
        training_recipient: true,
        project_settings: true,
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
          }
        },
        groups: {
          include: {
            participants: true
          }
        },
        events: {
          include: {
            event_attendees: true,
            course: true
          }
        },
        project_curriculums: {
          include: {
            curriculum: {
              include: {
                curriculum_courses: {
                  include: {
                    course: {
                      include: {
                        course_checklist_items: {
                          include: {
                            module: true
                          }
                        },
                        modules: {
                          include: {
                            activities: true
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
        checklist_progress: {
          include: {
            checklistItem: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate dashboard metrics
    const dashboardData = calculateDashboardMetrics(project);

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching project dashboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch project dashboard', 
      details: error.message 
    });
  }
}

function calculateDashboardMetrics(project) {
  // Basic project info
  const projectInfo = {
    id: project.id,
    title: project.title,
    summary: project.summary,
    projectStatus: project.projectStatus,
    projectType: project.projectType,
    projectCategory: project.projectCategory,
    language: project.language,
    location: project.location,
    trainingRecipientId: project.trainingRecipientId,
    training_recipient: project.training_recipient,
    createdAt: project.createdAt,
    lastUpdated: project.lastUpdated
  };

  // NOTE: Counts are now calculated by derived selectors from Redux store
  // We only return minimal metadata here to avoid duplicate calculations

  // 4. Project Dates and Duration
  let projectDates = {
    startDate: null,
    endDate: null,
    duration: 0 // in days
  };

  if (project.startDate && project.endDate) {
    projectDates.startDate = project.startDate;
    projectDates.endDate = project.endDate;
    
    // Calculate duration in days
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const diffTime = Math.abs(end - start);
    projectDates.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (project.project_settings?.startDate && project.project_settings?.endDate) {
    // Fallback to project settings dates
    projectDates.startDate = project.project_settings.startDate;
    projectDates.endDate = project.project_settings.endDate;
    
    const start = new Date(project.project_settings.startDate);
    const end = new Date(project.project_settings.endDate);
    const diffTime = Math.abs(end - start);
    projectDates.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 5. Training Recipient
  const trainingRecipient = project.training_recipient ? {
    id: project.training_recipient.id,
    name: project.training_recipient.name,
    description: project.training_recipient.description,
    contactPerson: project.training_recipient.contactPerson,
    email: project.training_recipient.email,
    phone: project.training_recipient.phone
  } : null;

  // 6. Project Lead Instructor
  const leadInstructor = project.project_instructors?.find(pi => pi.instructorType === 'lead') || project.project_instructors?.find(pi => pi.instructorType === 'main') || project.project_instructors?.[0];
  const projectLeadInstructor = leadInstructor ? {
    id: leadInstructor.instructor.id,
    firstName: leadInstructor.instructor.firstName,
    lastName: leadInstructor.instructor.lastName,
    email: leadInstructor.instructor.email,
    phone: leadInstructor.instructor.phone,
    instructorType: leadInstructor.instructorType
  } : null;

  // 7. Technical Completion (based on project checklist)
  // Get all checklist item IDs from project curriculums
  const allChecklistItems = [];
  project.project_curriculums?.forEach(projectCurriculum => {
    projectCurriculum.curriculum?.curriculum_courses?.forEach(curriculumCourse => {
      curriculumCourse.course?.course_checklist_items?.forEach(item => {
        allChecklistItems.push(item.id);
      });
    });
  });

  // Create a map of progress records for quick lookup
  const progressMap = {};
  project.checklist_progress?.forEach(progress => {
    progressMap[progress.checklistItemId] = progress;
  });

  // Calculate completion based on the same logic as frontend
  const totalChecklistItems = allChecklistItems.length;
  const completedChecklistItems = allChecklistItems.filter(itemId => {
    const progress = progressMap[itemId];
    return progress?.completed || false;
  }).length;
  
  const technicalCompletion = {
    totalChecklistItems: totalChecklistItems,
    completedChecklistItems: completedChecklistItems,
    completionPercentage: totalChecklistItems > 0 
      ? parseFloat(((completedChecklistItems / totalChecklistItems) * 100).toFixed(1))
      : 0
  };

  // 8. Calculate Attendance Rate FIRST (needed for overall completion)
  // Only count project_participants that have NOT been removed
  const activeProjectParticipants = project.participants?.filter(p =>
    p.status !== 'removed'
  ) || [];
  const activeParticipantsCount = activeProjectParticipants.length;

  // Create set of active project_participant IDs (the enrollment record IDs)
  // event_attendees.enrolleeId references project_participants.id (not participantId!)
  const activeEnrolleeIds = new Set(activeProjectParticipants.map(p => p.id));

  let calculatedAttendanceRate = 0;
  let attendanceMetrics = {
    totalSessions: sessionsCount,
    totalParticipants: activeParticipantsCount,
    totalPossibleAttendees: 0,
    actualAttendees: 0,
    attendancePercentage: 0
  };

  if (sessionsCount > 0 && activeParticipantsCount > 0) {
    const totalPossibleAttendees = sessionsCount * activeParticipantsCount;

    // Count attendance only for active project participants
    // Present and late both count as attendance (they showed up)
    const actualAttendees = project.events?.reduce((sum, event) => {
      const validAttendees = event.event_attendees?.filter(attendee => {
        // Check if attendee was present (includes present or late)
        const isPresent = attendee.attendance_status === 'present' ||
                          attendee.attendance_status === 'late';
        // event_attendees.enrolleeId references project_participants.id
        const isActiveEnrollee = activeEnrolleeIds.has(attendee.enrolleeId);
        return isPresent && isActiveEnrollee;
      }).length || 0;

      return sum + validAttendees;
    }, 0) || 0;

    calculatedAttendanceRate = totalPossibleAttendees > 0
      ? Math.round((actualAttendees / totalPossibleAttendees) * 100)
      : 0;

    // Debug logging
    console.log('[Dashboard] Attendance Calculation:', {
      projectId: project.id,
      sessionsCount,
      activeParticipantsCount,
      totalPossibleAttendees,
      actualAttendees,
      calculatedAttendanceRate: `${calculatedAttendanceRate}%`,
      formula: `${actualAttendees} / ${totalPossibleAttendees} * 100`
    });

    attendanceMetrics = {
      totalSessions: sessionsCount,
      totalParticipants: activeParticipantsCount,
      totalPossibleAttendees,
      actualAttendees,
      attendancePercentage: calculatedAttendanceRate
    };
  }

  // 9. Overall Completion (project-level) - uses real calculated metrics
  const learningProgress = 30; // TODO: Calculate from module/activity completion
  const attendanceRate = calculatedAttendanceRate;
  const technicalSetupProgress = technicalCompletion.completionPercentage;

  const overallCompletionPercentage = (learningProgress + technicalSetupProgress + attendanceRate) / 3;

  const overallCompletion = {
    isCompleted: project.projectStatus === 'completed',
    status: project.projectStatus,
    completionPercentage: parseFloat(overallCompletionPercentage.toFixed(1)),
    breakdown: {
      learning: learningProgress,
      technical: technicalSetupProgress,
      attendance: attendanceRate
    }
  };

  // 10. Prepare structure for future metrics
  const futureMetrics = {
    // Passing rate - to be calculated when assessment data is available
    passingRate: {
      totalParticipants: participantsCount,
      passedParticipants: 0,
      passingPercentage: 0,
      note: "Requires assessment data implementation"
    },
    attendanceRate: attendanceMetrics
  };

  // Curriculum and Content Overview
  const curriculumOverview = {
    totalCurriculums: project.project_curriculums?.length || 0,
    totalCourses: project.project_curriculums?.reduce((sum, pc) => 
      sum + (pc.curriculum?.curriculum_courses?.length || 0), 0) || 0,
    totalModules: project.project_curriculums?.reduce((sum, pc) => 
      sum + (pc.curriculum?.curriculum_courses?.reduce((courseSum, cc) => 
        courseSum + (cc.course?.modules?.length || 0), 0) || 0), 0) || 0,
    totalActivities: project.project_curriculums?.reduce((sum, pc) => 
      sum + (pc.curriculum?.curriculum_courses?.reduce((courseSum, cc) => 
        courseSum + (cc.course?.modules?.reduce((moduleSum, module) => 
          moduleSum + (module.activities?.length || 0), 0) || 0), 0) || 0), 0) || 0
  };

  return {
    projectInfo,
    metrics: {
      groupsCount,
      groupsDetails,
      sessionsCount,
      participantsCount,
      projectDates,
      trainingRecipient,
      projectLeadInstructor,
      technicalCompletion,
      overallCompletion,
      curriculumOverview,
      // Future implementation placeholders
      ...futureMetrics
    },
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  };
}