import prisma from '../../../lib/prisma';
import { calculateCourseDurationFromModules } from '../../../utils/durationCalculations';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Import curriculum schedule API called with body:', req.body);
    const { projectId } = req.body;

    if (!projectId) {
      console.log('Error: No project ID provided');
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    console.log('Processing import for project ID:', projectId);

    // Fetch project with project settings
    console.log('Fetching project...');
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        project_settings: true
      }
    });

    if (!project) {
      console.log('Project not found');
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('Project found:', project.title);

    // Get or create project settings with defaults
    let projectSettings = project.project_settings;
    if (!projectSettings) {
      console.log('Creating default project settings...');
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

    console.log('Project settings loaded:', projectSettings);

    // Parse project settings
    const startOfDay = parseInt(projectSettings.startOfDayTime.split(':')[0]);
    const endOfDay = parseInt(projectSettings.endOfDayTime.split(':')[0]);
    const [lunchStart, lunchEnd] = projectSettings.lunchTime.split('-').map(time => parseInt(time.split(':')[0]));
    const workingDays = projectSettings.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    // Use dates from project_settings, not the main project table
    const projectEndDate = new Date(projectSettings.endDate);
    const projectStartDate = new Date(projectSettings.startDate);
    
    console.log('Using dates from project_settings:');
    console.log('Start date:', projectStartDate);
    console.log('End date:', projectEndDate);

    // Fetch groups first
    console.log('Fetching groups...');
    const groups = await prisma.groups.findMany({
      where: { projectId: parseInt(projectId) }
    });

    if (groups.length === 0) {
      console.log('No groups found');
      return res.status(400).json({
        success: false,
        message: 'No groups found in this project'
      });
    }

    console.log(`Found ${groups.length} groups`);

    // For each group, fetch their curriculums and courses separately
    const groupsWithCurriculums = [];
    for (const group of groups) {
      console.log(`Processing group: ${group.groupName}`);
      
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

    console.log('All groups with curriculums loaded');

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

    console.log('Setting up scheduling variables...');
    const createdEvents = [];
    let currentScheduleTime = new Date(projectStartDate);
    
    console.log('Project start date:', projectStartDate);
    console.log('Project end date:', projectEndDate);
    console.log('Initial schedule time:', currentScheduleTime);
    
    // Ensure we start on a working day
    if (!isWorkingDay(currentScheduleTime)) {
      console.log('Start date is not a working day, advancing...');
      currentScheduleTime = advanceToNextWorkingDay(currentScheduleTime);
    }
    
    currentScheduleTime.setHours(startOfDay, 0, 0, 0);
    console.log('Final schedule start time:', currentScheduleTime);

    // Check if project end date allows for any scheduling
    if (currentScheduleTime >= projectEndDate) {
      console.log('Project end date is before start date, cannot schedule');
      return res.status(400).json({
        success: false,
        message: `Cannot schedule courses: Project end date (${projectEndDate.toLocaleDateString()}) is before the project start date (${projectStartDate.toLocaleDateString()}). Please extend the project end date.`
      });
    }

    console.log('Starting to process courses for scheduling...');

    // Track which days already have lunch events
    const lunchDatesCreated = new Set();

    // First, collect all unique courses with their assigned groups
    const courseGroupMap = new Map();
    
    for (const group of groupsWithCurriculums) {
      if (!group.group_curriculums || group.group_curriculums.length === 0) {
        console.log(`Group ${group.groupName} has no assigned curriculums, skipping...`);
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

    console.log(`Found ${courseGroupMap.size} unique courses to schedule`);

    // Process each course and schedule all its group sessions before moving to next course
    for (const [courseId, courseData] of courseGroupMap) {
      const course = courseData.course;
      const assignedGroups = courseData.groups;
      
      console.log(`\n=== Scheduling Course: ${course.title} ===`);
      console.log(`Assigned to ${assignedGroups.length} groups: ${assignedGroups.map(g => g.groupName).join(', ')}`);
      
      // Calculate course duration
      const courseDuration = calculateCourseDurationFromModules(course.modules || []);
      console.log(`Course duration: ${courseDuration} minutes`);

      // Schedule sessions for all groups assigned to this course
      for (const group of assignedGroups) {
        console.log(`Scheduling ${course.title} for group: ${group.groupName}`);
        
        // Check if we can fit this course before project end date
        const estimatedEndDate = new Date(currentScheduleTime);
        estimatedEndDate.setMinutes(estimatedEndDate.getMinutes() + courseDuration);
        
        if (estimatedEndDate > projectEndDate) {
          console.log(`Stopping import: Course "${course.title}" for group "${group.groupName}" would exceed project end date`);
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

        console.log(`Creating event from ${eventStart} to ${eventEnd}`);

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

        console.log('Creating course event in database...');
        const createdEvent = await prisma.events.create({
          data: eventData,
          include: {
            course: true
          }
        });

        createdEvents.push(createdEvent);
        console.log('Course event created successfully');

        // Check if we need to create a lunch event for this day
        const eventDate = eventStart.toDateString();
        if (!lunchDatesCreated.has(eventDate)) {
          console.log(`Creating lunch event for ${eventDate}`);
          
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
          console.log('Daily lunch event created successfully');
        } else {
          console.log(`Lunch event already exists for ${eventDate}, skipping`);
        }

        // Set next course start time to end of current course
        currentScheduleTime = new Date(eventEnd);
        
        // If we're past the end of day, move to next working day
        if (currentScheduleTime.getHours() >= endOfDay) {
          currentScheduleTime = advanceToNextWorkingDay(currentScheduleTime);
          currentScheduleTime.setHours(startOfDay, 0, 0, 0);
        }
      }
      
      console.log(`=== Completed scheduling for Course: ${course.title} ===`);
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

    console.log('API response:', response);
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