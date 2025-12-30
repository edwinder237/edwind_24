/**
 * Course Completion Selectors
 *
 * Derives course completion tracking data from normalized entities
 * following CQRS architecture. Aggregates curriculum, course, event,
 * and participant data to provide comprehensive completion metrics.
 */

import { createSelector } from '@reduxjs/toolkit';
import { entitySelectors } from '../entities';
import { transformCourseWithCompletion, isAttendanceValid } from 'utils/courseCompletionCalculator';

// ==============================|| BASE SELECTORS ||============================== //

const selectAllGroups = entitySelectors.groups.selectAllGroups;
const selectAllEvents = entitySelectors.events.selectAllEvents;
const selectAllParticipants = entitySelectors.participants.selectAllParticipants;

// ==============================|| CURRICULUM EXTRACTION ||============================== //

/**
 * Extract all unique curriculums from groups
 * Groups can have multiple curriculums assigned via group_curriculums
 * Now includes curriculum_courses to know which courses belong to each curriculum
 */
export const selectProjectCurriculums = createSelector(
  [selectAllGroups],
  (groups) => {
    const curriculumMap = new Map();

    groups.forEach(group => {
      if (group.group_curriculums && Array.isArray(group.group_curriculums)) {
        group.group_curriculums.forEach(gc => {
          if (gc.curriculum && gc.isActive) {
            const curriculumId = gc.curriculum.id;
            if (!curriculumMap.has(curriculumId)) {
              // Extract course IDs from curriculum_courses
              const curriculumCourseIds = gc.curriculum.curriculum_courses
                ? gc.curriculum.curriculum_courses.map(cc => cc.courseId)
                : [];

              curriculumMap.set(curriculumId, {
                id: gc.curriculum.id,
                title: gc.curriculum.title,
                description: gc.curriculum.description,
                curriculumCourseIds, // Store the course IDs that belong to this curriculum
                assignedGroups: []
              });
            }
            curriculumMap.get(curriculumId).assignedGroups.push({
              groupId: group.id,
              groupName: group.groupName
            });
          }
        });
      }
    });

    return Array.from(curriculumMap.values());
  }
);

// ==============================|| COURSE EXTRACTION ||============================== //

/**
 * Extract all unique courses from events
 * Events have a course property with full course details
 */
export const selectProjectCourses = createSelector(
  [selectAllEvents],
  (events) => {
    const courseMap = new Map();

    events.forEach(event => {
      if (event.course && event.course.id) {
        const courseId = event.course.id;
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            id: event.course.id,
            title: event.course.title,
            summary: event.course.summary,
            duration: event.course.duration,
            level: event.course.level,
            courseCategory: event.course.courseCategory,
            backgroundImg: event.course.backgroundImg,
            code: event.course.code,
            version: event.course.version,
            modules: event.course.modules || [],
            events: []
          });
        }
        // Add this event to the course's events array
        courseMap.get(courseId).events.push(event);
      }
    });

    return Array.from(courseMap.values());
  }
);

// ==============================|| PARTICIPANT-COURSE MAPPING ||============================== //

/**
 * Calculate which participants are assigned to which courses (via events)
 * and their attendance status for each course
 */
export const selectParticipantCourseAssignments = createSelector(
  [selectProjectCourses, selectAllParticipants],
  (courses, participants) => {
    const assignments = [];

    courses.forEach(course => {
      const courseEvents = course.events || [];
      const participantStats = new Map();

      // Aggregate attendance data across all events for this course
      courseEvents.forEach(event => {
        if (event.event_attendees && Array.isArray(event.event_attendees)) {
          event.event_attendees.forEach(attendee => {
            const participantId = attendee.enrollee?.participant?.id || attendee.enrollee?.id;

            if (participantId) {
              if (!participantStats.has(participantId)) {
                participantStats.set(participantId, {
                  participantId,
                  participant: attendee.enrollee?.participant || {},
                  totalEvents: 0,
                  eventsAttended: 0,
                  eventsAbsent: 0,
                  attendanceRate: 0,
                  statuses: []
                });
              }

              const stats = participantStats.get(participantId);
              stats.totalEvents++;
              stats.statuses.push(attendee.attendance_status);

              if (isAttendanceValid(attendee.attendance_status)) {
                stats.eventsAttended++;
              } else if (attendee.attendance_status === 'absent') {
                stats.eventsAbsent++;
              }
            }
          });
        }
      });

      // Calculate final attendance rate for each participant
      participantStats.forEach(stats => {
        stats.attendanceRate = stats.totalEvents > 0
          ? Math.round((stats.eventsAttended / stats.totalEvents) * 100)
          : 0;
        stats.isCompleted = stats.eventsAttended === stats.totalEvents && stats.totalEvents > 0;
      });

      assignments.push({
        courseId: course.id,
        courseTitle: course.title,
        totalEvents: courseEvents.length,
        participants: Array.from(participantStats.values())
      });
    });

    return assignments;
  }
);

// ==============================|| MAIN COURSE COMPLETION SELECTOR ||============================== //

/**
 * Complete course completion data structured by curriculum
 * This is the main selector the component will use
 */
export const selectCourseCompletionData = createSelector(
  [selectProjectCurriculums, selectProjectCourses, selectParticipantCourseAssignments, selectAllGroups, selectAllParticipants],
  (curriculums, courses, participantAssignments, groups, allParticipants) => {
    // If no curriculums, return empty structure
    if (curriculums.length === 0) {
      return {
        curriculums: [],
        totalCourses: 0,
        totalParticipants: allParticipants.length,
        overallCompletionRate: 0
      };
    }

    // Map courses to curriculums using curriculum_courses relationship
    const curriculumCourses = curriculums.map(curriculum => {
      // Use the curriculumCourseIds from the curriculum_courses table
      // This tells us exactly which courses belong to this curriculum
      const curriculumCourseIdsArray = curriculum.curriculumCourseIds || [];

      // Build course list with participant data
      const coursesWithParticipants = curriculumCourseIdsArray
        .map(courseId => {
          const course = courses.find(c => c.id === courseId);

          // Skip if course not found in events (course exists in curriculum but has no events in this project)
          if (!course) return null;

          const participantData = participantAssignments.find(pa => pa.courseId === courseId);

          return {
            id: course.id,
            title: course.title,
            summary: course.summary,
            courseCategory: course.courseCategory,
            code: course.code,
            version: course.version,
            totalEvents: participantData?.totalEvents || 0,
            participants: participantData?.participants || [],
            participantCount: participantData?.participants?.length || 0,
            completedParticipants: participantData?.participants?.filter(p => p.isCompleted).length || 0,
            averageAttendanceRate: participantData?.participants?.length > 0
              ? Math.round(
                  participantData.participants.reduce((sum, p) => sum + p.attendanceRate, 0) /
                  participantData.participants.length
                )
              : 0
          };
        })
        .filter(course => course !== null); // Remove null entries

      return {
        id: curriculum.id,
        title: curriculum.title,
        description: curriculum.description,
        courseCount: coursesWithParticipants.length,
        courses: coursesWithParticipants,
        assignedGroups: curriculum.assignedGroups,
        totalParticipants: coursesWithParticipants.reduce((sum, c) =>
          Math.max(sum, c.participantCount), 0
        )
      };
    });

    // Calculate overall statistics
    const totalCourses = curriculumCourses.reduce((sum, c) => sum + c.courseCount, 0);
    const totalCompletedObjectives = curriculumCourses.reduce((sum, curr) =>
      sum + curr.courses.reduce((courseSum, course) =>
        courseSum + course.completedParticipants, 0
      ), 0
    );
    const totalObjectives = curriculumCourses.reduce((sum, curr) =>
      sum + curr.courses.reduce((courseSum, course) =>
        courseSum + course.participantCount, 0
      ), 0
    );
    const overallCompletionRate = totalObjectives > 0
      ? Math.round((totalCompletedObjectives / totalObjectives) * 100)
      : 0;

    return {
      curriculums: curriculumCourses,
      totalCourses,
      totalParticipants: allParticipants.length,
      overallCompletionRate,
      totalObjectives,
      completedObjectives: totalCompletedObjectives
    };
  }
);

// ==============================|| ROLE DISTRIBUTION SELECTOR ||============================== //

/**
 * Calculate role distribution across all participants in courses
 */
export const selectCourseParticipantRoleDistribution = createSelector(
  [selectAllParticipants],
  (participants) => {
    const roleDistribution = {};

    participants.forEach(p => {
      // Extract participant data (handle nested structure)
      const participant = p.participant || p;
      const role = participant.role?.title || participant.participantType || 'Learner';

      if (!roleDistribution[role]) {
        roleDistribution[role] = { role, count: 0 };
      }
      roleDistribution[role].count++;
    });

    const totalParticipants = participants.length;

    return Object.values(roleDistribution).map((r, index) => ({
      ...r,
      percentage: totalParticipants > 0 ? Math.round((r.count / totalParticipants) * 100) : 0,
      color: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4'][index % 6]
    }));
  }
);
