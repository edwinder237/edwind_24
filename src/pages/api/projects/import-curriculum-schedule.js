import prisma from '../../../lib/prisma';
import { calculateCourseDurationFromModules } from '../../../utils/durationCalculations';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Fetch project with project settings
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        project_settings: true
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }


    // Get or create project settings with defaults
    let projectSettings = project.project_settings;
    if (!projectSettings) {
      projectSettings = await prisma.project_settings.create({
        data: {
          projectId: parseInt(projectId),
          startOfDayTime: '09:00',
          endOfDayTime: '17:00',
          lunchTime: '12:00-13:00',
          timezone: 'UTC',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          createdBy: 'system'
        }
      });
    }


    // Parse project settings
    const startOfDay = parseInt(projectSettings.startOfDayTime.split(':')[0]);
    const endOfDay = parseInt(projectSettings.endOfDayTime.split(':')[0]);
    const [lunchStart, lunchEnd] = projectSettings.lunchTime.split('-').map(time => parseInt(time.split(':')[0]));
    const workingDays = projectSettings.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    // Use dates from project_settings, not the main project table
    const projectEndDate = new Date(projectSettings.endDate);
    const projectStartDate = new Date(projectSettings.startDate);
    

    // Fetch groups first
    const groups = await prisma.groups.findMany({
      where: { projectId: parseInt(projectId) }
    });

    if (groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No groups found in this project'
      });
    }


    // For each group, fetch their curriculums and courses separately
    const groupsWithCurriculums = [];
    for (const group of groups) {
      
      const groupCurriculums = await prisma.group_curriculums.findMany({
        where: { 
          groupId: group.id,
          isActive: true 
        },
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
      });

      groupsWithCurriculums.push({
        ...group,
        group_curriculums: groupCurriculums
      });
    }


    // Helper function to check if a day is a working day
    const isWorkingDay = (date) => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      return workingDays.includes(dayName);
    };

    // Helper function to advance to next working day
    const advanceToNextWorkingDay = (date) => {
      let newDate = new Date(date);
      do {
        newDate.setDate(newDate.getDate() + 1);
      } while (!isWorkingDay(newDate));
      return newDate;
    };

    // Helper function to parse time string and set on date
    const setTimeOnDate = (date, timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate;
    };

    const createdEvents = [];
    let currentScheduleTime = new Date(projectStartDate);
    
    
    // Ensure we start on a working day
    if (!isWorkingDay(currentScheduleTime)) {
      currentScheduleTime = advanceToNextWorkingDay(currentScheduleTime);
    }
    
    currentScheduleTime.setHours(startOfDay, 0, 0, 0);

    // Check if project end date allows for any scheduling
    if (currentScheduleTime >= projectEndDate) {
      return res.status(400).json({
        success: false,
        message: `Cannot schedule courses: Project end date (${projectEndDate.toLocaleDateString()}) is before the project start date (${projectStartDate.toLocaleDateString()}). Please extend the project end date.`
      });
    }


    // Track which days already have lunch events
    const lunchDatesCreated = new Set();

    // First, collect all unique courses with their assigned groups
    const courseGroupMap = new Map();
    
    for (const group of groupsWithCurriculums) {
      if (!group.group_curriculums || group.group_curriculums.length === 0) {
        continue;
      }

      // Process each curriculum assigned to this group
      for (const groupCurriculum of group.group_curriculums) {
        for (const curriculumCourse of groupCurriculum.curriculum.curriculum_courses) {
          const course = curriculumCourse.course;
          const courseKey = course.id;

          if (!courseGroupMap.has(courseKey)) {
            courseGroupMap.set(courseKey, {
              course: course,
              groups: [],
              curriculumTitle: groupCurriculum.curriculum.title
            });
          }

          // Add this group to the course
          courseGroupMap.get(courseKey).groups.push({
            id: group.id,
            groupName: group.groupName,
            chipColor: group.chipColor
          });
        }
      }
    }


    // Process each course and schedule all its group sessions before moving to next course
    for (const [courseId, courseData] of courseGroupMap) {
      const course = courseData.course;
      const assignedGroups = courseData.groups;
      
      
      // Calculate course duration
      const courseDuration = calculateCourseDurationFromModules(course.modules || []);

      // Schedule sessions for all groups assigned to this course
      for (const group of assignedGroups) {
        
        // Check if we can fit this course before project end date
        const estimatedEndDate = new Date(currentScheduleTime);
        estimatedEndDate.setMinutes(estimatedEndDate.getMinutes() + courseDuration);
        
        if (estimatedEndDate > projectEndDate) {
          break;
        }

        // Ensure we start at the beginning of a working day if needed
        if (!isWorkingDay(currentScheduleTime)) {
          currentScheduleTime = advanceToNextWorkingDay(currentScheduleTime);
          currentScheduleTime.setHours(startOfDay, 0, 0, 0);
        }

        const eventStart = new Date(currentScheduleTime);
        const eventEnd = new Date(eventStart);
        eventEnd.setMinutes(eventEnd.getMinutes() + courseDuration);


        // Create the course event
        const eventData = {
          title: `${course.title} - ${group.groupName}`,
          start: eventStart.toISOString(),
          end: eventEnd.toISOString(),
          eventType: 'course',
          courseId: course.id,
          projectId: parseInt(projectId),
          extendedProps: {
            notes: `Auto-imported from curriculum "${courseData.curriculumTitle}" for group "${group.groupName}". Duration: ${courseDuration} minutes`,
            groupId: group.id,
            groupName: group.groupName
          },
          eventStatus: 'scheduled',
          allDay: false,
          color: group.chipColor || '#2196F3',
          backgroundColor: group.chipColor || '#2196F3',
          editable: true
        };

        const createdEvent = await prisma.events.create({
          data: eventData,
          include: {
            course: true
          }
        });

        createdEvents.push(createdEvent);

        // Check if we need to create a lunch event for this day
        const eventDate = eventStart.toDateString();
        if (!lunchDatesCreated.has(eventDate)) {
          
          // Create lunch event based on project settings time
          const lunchDate = new Date(eventStart);
          lunchDate.setHours(lunchStart, 0, 0, 0); // Use lunchStart from project settings
          
          const lunchEndDate = new Date(lunchDate);
          lunchEndDate.setHours(lunchEnd, 0, 0, 0); // Use lunchEnd from project settings

          const lunchEventData = {
            title: 'Lunch',
            start: lunchDate.toISOString(),
            end: lunchEndDate.toISOString(),
            eventType: 'other',
            projectId: parseInt(projectId),
            extendedProps: {
              notes: `Daily lunch break from ${projectSettings.lunchTime}`,
              lunchEvent: true
            },
            eventStatus: 'scheduled',
            allDay: false,
            color: '#FFA726',
            backgroundColor: '#FFA726',
            editable: true
          };

          const lunchEvent = await prisma.events.create({
            data: lunchEventData
          });

          createdEvents.push(lunchEvent);
          lunchDatesCreated.add(eventDate);
        }

        // Set next course start time to end of current course
        currentScheduleTime = new Date(eventEnd);
        
        // If we're past the end of day, move to next working day
        if (currentScheduleTime.getHours() >= endOfDay) {
          currentScheduleTime = advanceToNextWorkingDay(currentScheduleTime);
          currentScheduleTime.setHours(startOfDay, 0, 0, 0);
        }
      }
      
    }

    // Calculate total courses across all groups
    const totalCourses = groupsWithCurriculums.reduce((total, group) => {
      return total + (group.group_curriculums?.flatMap(gc => 
        gc.curriculum.curriculum_courses
      ).length || 0);
    }, 0);

    const response = {
      success: true,
      message: `Successfully imported ${createdEvents.length} events (courses + lunch breaks) from curriculum for ${groupsWithCurriculums.length} groups`,
      events: createdEvents,
      totalCourses: totalCourses,
      importedCount: createdEvents.length,
      groupsProcessed: groupsWithCurriculums.length
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Error importing curriculum schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import curriculum schedule',
      error: error.message
    });
  }
}