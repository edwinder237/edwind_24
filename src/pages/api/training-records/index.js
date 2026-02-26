import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import prisma from '../../../lib/prisma';
import { errorHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const {
      projectId,
      courses,
      participants,
      instructors,
      companies,
      trainingRecipients,
      projects,
      status,
      startDate,
      endDate,
      topics,
      assessments,
      page = 1,
      limit = 100
    } = req.query;

    // Handle array parameters that come as 'param[]' format
    const projectsArray = projects || req.query['projects[]'];
    const coursesArray = courses || req.query['courses[]'];
    const participantsArray = participants || req.query['participants[]'];
    const instructorsArray = instructors || req.query['instructors[]'];
    const companiesArray = companies || req.query['companies[]'];
    const trainingRecipientsArray = trainingRecipients || req.query['trainingRecipients[]'];
    const statusArray = status || req.query['status[]'];
    const topicsArray = topics || req.query['topics[]'];
    const assessmentsArray = assessments || req.query['assessments[]'];


    // Build where clause for events with multi-tenant scoping
    const eventWhere = {
      eventType: 'course', // Only course events
      courseId: { not: null }, // Must have a courseId
      // Multi-tenant scoping: Only fetch events from projects in accessible sub-organizations
      project: {
        sub_organizationId: {
          in: orgContext.subOrganizationIds
        }
      }
    };

    // Handle project filtering - projects filter takes precedence over single projectId
    if (projectsArray) {
      // Handle both array and string cases (query params can be strings)
      const projectIds = Array.isArray(projectsArray) ? projectsArray : [projectsArray];
      const validProjectIds = projectIds.filter(id => id && id.toString().trim() !== '');

      if (validProjectIds.length > 0) {
        eventWhere.projectId = {
          in: validProjectIds.map(id => parseInt(id))
        };
      }
    } else if (projectId) {
      eventWhere.projectId = parseInt(projectId);
    }

    if (coursesArray && (Array.isArray(coursesArray) ? coursesArray.length > 0 : coursesArray)) {
      const courseIds = Array.isArray(coursesArray) ? coursesArray : [coursesArray];
      eventWhere.courseId = {
        in: courseIds.map(id => parseInt(id))
      };
    }

    if (instructorsArray && (Array.isArray(instructorsArray) ? instructorsArray.length > 0 : instructorsArray)) {
      const instructorIds = Array.isArray(instructorsArray) ? instructorsArray : [instructorsArray];
      eventWhere.event_instructors = {
        some: {
          instructorId: {
            in: instructorIds.map(id => parseInt(id))
          }
        }
      };
    }

    if (startDate) {
      eventWhere.start = {
        ...eventWhere.start,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      eventWhere.end = {
        ...eventWhere.end,
        lte: new Date(endDate)
      };
    }

    // Handle topics filter through course relationship
    if (topicsArray && (Array.isArray(topicsArray) ? topicsArray.length > 0 : topicsArray)) {
      const topicTitles = Array.isArray(topicsArray) ? topicsArray : [topicsArray];
      eventWhere.course = {
        course_topics: {
          some: {
            topic: {
              title: {
                in: topicTitles
              }
            }
          }
        }
      };
    }

    // Fetch events with their attendees (no pagination at event level)
    const events = await prisma.events.findMany({
      where: eventWhere,
      include: {
        course: {
          include: {
            course_topics: {
              include: {
                topic: true
              }
            }
          }
        },
        event_instructors: {
          include: {
            instructor: true
          }
        },
        event_attendees: {
          include: {
            enrollee: {
              include: {
                participant: {
                  include: {
                    role: true,
                    training_recipient: true
                  }
                }
              }
            }
          }
        },
        project: true
      },
      orderBy: {
        start: 'desc'
      }
    });

    // Fetch assessment scores if assessments filter is provided
    let assessmentScoresMap = {};
    if (assessmentsArray && (Array.isArray(assessmentsArray) ? assessmentsArray.length > 0 : assessmentsArray)) {
      const assessmentIds = Array.isArray(assessmentsArray) ? assessmentsArray : [assessmentsArray];
      const validAssessmentIds = assessmentIds.filter(id => id && id.toString().trim() !== '').map(id => parseInt(id));

      if (validAssessmentIds.length > 0) {
        // Get all participant IDs from events (use project_participants.id, not participants UUID)
        const participantIds = events.flatMap(event =>
          event.event_attendees.map(attendee => attendee.enrollee.id)
        );

        // Fetch assessment scores for these participants and assessments
        const assessmentScores = await prisma.participant_assessment_scores.findMany({
          where: {
            participantId: { in: participantIds },
            courseAssessmentId: { in: validAssessmentIds },
            isCurrent: true
          },
          include: {
            courseAssessment: {
              select: {
                id: true,
                title: true,
                maxScore: true,
                passingScore: true
              }
            }
          },
          orderBy: {
            assessmentDate: 'desc'
          }
        });

        // Create a map for quick lookup: participantId_assessmentId -> score
        assessmentScores.forEach(score => {
          const key = `${score.participantId}_${score.courseAssessmentId}`;
          assessmentScoresMap[key] = score;
        });
      }
    }

    // Transform the data into training records format
    const trainingRecords = [];

    for (const event of events) {
      for (const attendee of event.event_attendees) {
        const participant = attendee.enrollee.participant;

        // Apply participant filter if provided
        if (participantsArray && (Array.isArray(participantsArray) ? participantsArray.length > 0 : participantsArray)) {
          const participantIds = Array.isArray(participantsArray) ? participantsArray : [participantsArray];
          if (!participantIds.includes(participant.id)) {
            continue;
          }
        }

        // Apply company filter if provided
        if (companiesArray && (Array.isArray(companiesArray) ? companiesArray.length > 0 : companiesArray)) {
          const companyNames = Array.isArray(companiesArray) ? companiesArray : [companiesArray];
          if (!companyNames.includes(participant.training_recipient?.name)) {
            continue;
          }
        }

        // Apply training recipient filter if provided
        if (trainingRecipientsArray && (Array.isArray(trainingRecipientsArray) ? trainingRecipientsArray.length > 0 : trainingRecipientsArray)) {
          const recipientNames = Array.isArray(trainingRecipientsArray) ? trainingRecipientsArray : [trainingRecipientsArray];
          if (!recipientNames.includes(participant.training_recipient?.name)) {
            continue;
          }
        }

        // Determine completion status based on attendance
        let completionStatus = 'Not Started';
        let isCompleted = false;

        if (attendee.attendance_status === 'present' || attendee.attendance_status === 'late') {
          completionStatus = 'Completed';
          isCompleted = true;
        } else if (attendee.attendance_status === 'absent') {
          completionStatus = 'Not Completed';
        } else if (attendee.attendance_status === 'scheduled') {
          completionStatus = 'Scheduled';
        }

        // Apply status filter if provided
        if (statusArray && (Array.isArray(statusArray) ? statusArray.length > 0 : statusArray)) {
          const statusValues = Array.isArray(statusArray) ? statusArray : [statusArray];
          if (!statusValues.includes(completionStatus)) {
            continue;
          }
        }

        // Calculate duration - only for completed events
        const duration = isCompleted && event.end && event.start
          ? Math.round((new Date(event.end) - new Date(event.start)) / 60000) // minutes
          : null;

        // Get assessment scores for this participant if assessment filter is active
        let assessmentData = null;
        if (assessmentsArray && (Array.isArray(assessmentsArray) ? assessmentsArray.length > 0 : assessmentsArray)) {
          const assessmentIds = Array.isArray(assessmentsArray) ? assessmentsArray : [assessmentsArray];
          const validAssessmentIds = assessmentIds.filter(id => id && id.toString().trim() !== '').map(id => parseInt(id));

          // Get the first assessment score (in case multiple assessments selected, show first one)
          const firstAssessmentId = validAssessmentIds[0];
          const scoreKey = `${attendee.enrollee.id}_${firstAssessmentId}`;
          const scoreRecord = assessmentScoresMap[scoreKey];

          if (scoreRecord) {
            assessmentData = {
              assessmentId: scoreRecord.courseAssessmentId,
              assessmentName: scoreRecord.courseAssessment.title,
              score: scoreRecord.scorePercentage,
              scoreEarned: scoreRecord.scoreEarned,
              scoreMaximum: scoreRecord.scoreMaximum,
              passed: scoreRecord.passed,
              attemptNumber: scoreRecord.attemptNumber,
              assessmentDate: scoreRecord.assessmentDate?.toISOString()?.split('T')[0],
              feedback: scoreRecord.feedback
            };
          }
        }

        trainingRecords.push({
          id: `${event.id}-${attendee.id}`,
          participantId: participant.id,
          participantName: `${participant.firstName} ${participant.lastName}`,
          participantEmail: participant.email,
          participantDepartment: participant.derpartement,
          participantCompany: participant.training_recipient?.name || 'Unknown',
          participantRole: participant.role?.title || 'No Role',
          participantTrainingRecipient: participant.training_recipient?.name || 'Unknown',
          courseId: event.courseId,
          courseName: event.course?.title || event.title,
          courseVersion: event.course?.version || null,
          participantExternalId: participant.externalId || null,
          courseTopics: event.course?.course_topics?.map(ct => ct.topic.title) || [],
          instructorId: event.event_instructors[0]?.instructorId || null,
          instructorName: event.event_instructors[0]?.instructor
            ? `${event.event_instructors[0].instructor.firstName} ${event.event_instructors[0].instructor.lastName}`
            : 'No Instructor',
          instructorSpecialization: event.event_instructors[0]?.instructor?.expertise || [],
          eventId: event.id,
          projectId: event.projectId,
          projectName: event.project?.title || event.project?.name || `Project ${event.projectId}`,
          completionDate: isCompleted ? event.end?.toISOString()?.split('T')[0] : null,
          startedDate: event.start?.toISOString()?.split('T')[0],
          duration: duration,
          status: completionStatus,
          attendanceStatus: attendee.attendance_status,
          score: assessmentData?.score || null,
          passed: assessmentData ? assessmentData.passed : isCompleted,
          assessmentAttempts: assessmentData?.attemptNumber || null,
          assessmentDate: assessmentData?.assessmentDate || null,
          certificateIssued: false,
          certificateUrl: null,
          notes: event.description || null,
          createdAt: attendee.createdAt,
          updatedAt: attendee.lastUpdated,
          // Assessment-specific fields (only populated when assessments filter is active)
          assessment: assessmentData
        });
      }
    }

    // Get total count for pagination
    const totalCount = trainingRecords.length;

    // Apply pagination to the transformed data
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedRecords = trainingRecords.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching training records:', error);
    return errorHandler(error, req, res);
  }
}

export default withOrgScope(handler);
