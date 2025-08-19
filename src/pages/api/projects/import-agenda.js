import prisma from '../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// In-memory job tracking (in production, use Redis or database)
const jobStore = new Map();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleImportAgenda(req, res);
  } else if (req.method === 'GET') {
    return handleJobStatus(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function handleJobStatus(req, res) {
  const { jobId } = req.query;
  
  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }
  
  const job = jobStore.get(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  return res.status(200).json(job);
}

async function handleImportAgenda(req, res) {
  const { 
    projectId, 
    trainingPlanId, 
    selectedGroups = [], 
    includeAllParticipants = false,
    followProjectHours = true,
    assignByRole = false,
    selectedRoles = [],
    preserveExistingEvents = true
  } = req.body;

  if (!projectId || !trainingPlanId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID and Training Plan ID are required'
    });
  }

  // Create job ID for progress tracking
  const jobId = uuidv4();
  
  // Initialize job status
  const initialJobStatus = {
    jobId,
    processed: 0,
    total: 0,
    warnings: 0,
    status: 'starting',
    message: 'Initializing import process...',
    events: [],
    startedAt: new Date().toISOString()
  };
  
  jobStore.set(jobId, initialJobStatus);
  
  // Return job ID immediately for client to track progress
  res.status(202).json({ 
    success: true, 
    jobId,
    message: 'Import process started. Use jobId to track progress.'
  });
  
  // Start background processing
  processImportAgenda({
    projectId,
    trainingPlanId,
    selectedGroups,
    includeAllParticipants,
    followProjectHours,
    assignByRole,
    selectedRoles,
    preserveExistingEvents,
    jobId
  }).catch(error => {
    console.error('Import agenda error:', error);
    const job = jobStore.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date().toISOString();
      jobStore.set(jobId, job);
    }
  });
}

async function processImportAgenda(options) {
  const {
    projectId,
    trainingPlanId,
    selectedGroups,
    includeAllParticipants,
    followProjectHours,
    assignByRole,
    selectedRoles,
    preserveExistingEvents,
    jobId
  } = options;

  let job = jobStore.get(jobId);
  
  try {
    // Update job status
    job.status = 'in-progress';
    job.message = 'Fetching project and training plan data...';
    jobStore.set(jobId, job);

    // Fetch project with settings
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        project_settings: true,
        groups: {
          include: {
            participants: {
              include: {
                participant: {
                  include: {
                    participant: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get or create project settings with defaults
    let projectSettings = project.project_settings;
    if (!projectSettings) {
      projectSettings = await prisma.project_settings.create({
        data: {
          projectId: parseInt(projectId),
          startDate: project.startDate || new Date(),
          endDate: project.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          startOfDayTime: '09:00',
          endOfDayTime: '17:00',
          lunchTime: '12:00-13:00',
          timezone: 'UTC',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          createdBy: 'system'
        }
      });
    }

    // Fetch training plan with all nested data
    const trainingPlan = await prisma.training_plans.findUnique({
      where: { id: parseInt(trainingPlanId) },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            modules: {
              orderBy: { moduleOrder: 'asc' },
              include: {
                course: {
                  include: {
                    course_participant_roles: {
                      include: {
                        role: true
                      }
                    },
                    modules: true
                  }
                },
                module: {
                  include: {
                    course: {
                      include: {
                        course_participant_roles: {
                          include: {
                            role: true
                          }
                        }
                      }
                    },
                    activities: true
                  }
                },
                supportActivity: true
              }
            }
          }
        }
      }
    });

    if (!trainingPlan) {
      throw new Error('Training plan not found');
    }

    // Calculate total items for progress tracking
    const totalItems = trainingPlan.days.reduce((total, day) => total + day.modules.length, 0);
    job.total = totalItems;
    job.message = `Processing ${totalItems} training items...`;
    jobStore.set(jobId, job);

    // Determine which groups to process
    let targetGroups = project.groups;
    if (!includeAllParticipants && selectedGroups.length > 0) {
      targetGroups = project.groups.filter(g => selectedGroups.includes(g.id));
    }

    if (targetGroups.length === 0) {
      throw new Error('No valid groups found for assignment');
    }

    // Get existing events if preserving
    let existingEvents = [];
    if (preserveExistingEvents) {
      existingEvents = await prisma.events.findMany({
        where: { projectId: parseInt(projectId) },
        select: { start: true, end: true }
      });
    }
    
    // Helper function to ensure date is on a working day
    const ensureWorkingDayHelper = (date, workingDays) => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      let current = new Date(date);
      
      while (!workingDays.includes(dayNames[current.getDay()])) {
        current.setDate(current.getDate() + 1);
      }
      
      return current;
    };

    // Initialize scheduling
    const workingHours = parseWorkingHours(projectSettings);
    
    // Start at the project start date and time
    let currentScheduleTime = new Date(projectSettings.startDate);
    
    // Set the time to the start of the working day
    const [startHour, startMinute] = projectSettings.startOfDayTime.split(':').map(Number);
    currentScheduleTime.setHours(startHour, startMinute, 0, 0);
    
    // Ensure we start on a working day
    currentScheduleTime = ensureWorkingDayHelper(currentScheduleTime, workingHours.workingDays);
    
    console.log('Starting schedule at:', currentScheduleTime.toISOString(), 
                'Working hours:', projectSettings.startOfDayTime, '-', projectSettings.endOfDayTime);
    
    const createdEvents = [];
    const warnings = [];

    // Process each training plan day
    for (const planDay of trainingPlan.days) {
      job.message = `Processing day ${planDay.dayNumber} of ${trainingPlan.totalDays}...`;
      jobStore.set(jobId, job);

      // Calculate the target date for this training plan day
      const projectStartDate = new Date(projectSettings.startDate);
      const targetDate = new Date(projectStartDate);
      
      // Each training plan day maps to a calendar day (Day 1 = start date, Day 2 = start date + 1, etc.)
      targetDate.setDate(targetDate.getDate() + (planDay.dayNumber - 1));
      
      // Ensure target date is a working day
      const workingHours = parseWorkingHours(projectSettings);
      const adjustedTargetDate = ensureWorkingDay(targetDate, workingHours.workingDays);
      
      // Set the schedule time to the start of this training day
      currentScheduleTime = new Date(adjustedTargetDate);
      const [startHour, startMinute] = projectSettings.startOfDayTime.split(':').map(Number);
      currentScheduleTime.setHours(startHour, startMinute, 0, 0);
      
      console.log(`Training plan day ${planDay.dayNumber} scheduled for:`, currentScheduleTime.toISOString());

      // Track if this day has any events (for lunch break creation)
      let dayHasEvents = false;

      // Process items in the exact sequence they appear in the training plan
      // First pass: Group modules by course to understand course boundaries
      const courseGroups = new Map();
      const sequencedItems = [];

      // Group modules by course and track the sequence
      for (const planModule of planDay.modules) {
        console.log('Processing planModule:', {
          id: planModule.id,
          moduleOrder: planModule.moduleOrder,
          moduleId: planModule.moduleId,
          courseId: planModule.courseId,
          supportActivityId: planModule.supportActivityId,
          customTitle: planModule.customTitle,
          hasModule: !!planModule.module,
          hasCourse: !!planModule.course,
          moduleTitle: planModule.module?.title,
          moduleParentCourseId: planModule.module?.courseId,
          moduleParentCourseTitle: planModule.module?.course?.title,
          directCourseTitle: planModule.course?.title
        });

        if (planModule.supportActivity || planModule.supportActivityId) {
          // Support activity - add directly to sequence
          sequencedItems.push({
            type: 'supportActivity',
            order: planModule.moduleOrder,
            data: planModule
          });
        } else if (planModule.customTitle && !planModule.courseId && !planModule.moduleId) {
          // Custom activity - add directly to sequence  
          sequencedItems.push({
            type: 'custom',
            order: planModule.moduleOrder,
            data: planModule
          });
        } else {
          // This is either a direct course reference or a module
          let courseId = null;
          let courseInfo = null;

          if (planModule.courseId || planModule.course) {
            // Direct course reference
            courseId = planModule.courseId;
            courseInfo = {
              course: planModule.course,
              modules: [],
              customTitle: planModule.course?.title || planModule.customTitle,
              customDuration: planModule.customDuration
            };
          } else if (planModule.moduleId && planModule.module?.courseId) {
            // Module reference - use parent course
            courseId = planModule.module.courseId;
            courseInfo = {
              course: planModule.module.course,
              modules: [planModule.module],
              customTitle: planModule.module.course?.title,
              customDuration: planModule.customDuration || planModule.module.course?.duration
            };
          }

          if (courseId) {
            if (courseGroups.has(courseId)) {
              // Add module to existing course group
              if (planModule.module && !courseGroups.get(courseId).modules.some(m => m.id === planModule.module.id)) {
                courseGroups.get(courseId).modules.push(planModule.module);
              }
              // Always ensure we're using the course title
              const existingInfo = courseGroups.get(courseId);
              if (planModule.module?.course?.title) {
                existingInfo.customTitle = planModule.module.course.title;
              }
              // Update the earliest order for this course
              const existingItem = sequencedItems.find(item => item.type === 'course' && item.courseId === courseId);
              if (existingItem && planModule.moduleOrder < existingItem.order) {
                existingItem.order = planModule.moduleOrder;
              }
            } else {
              // Create new course group
              courseGroups.set(courseId, courseInfo);
              // Add course to sequence
              sequencedItems.push({
                type: 'course',
                order: planModule.moduleOrder,
                courseId: courseId,
                data: courseInfo
              });
            }
          }
        }
      }

      // Sort items by their sequence order
      sequencedItems.sort((a, b) => a.order - b.order);

      console.log('Sequenced items for day', planDay.dayNumber, ':', 
        sequencedItems.map(item => ({
          type: item.type,
          order: item.order,
          title: item.type === 'course' ? item.data.customTitle : 
                 item.type === 'supportActivity' ? (item.data.customTitle || item.data.supportActivity?.title) :
                 item.data.customTitle
        }))
      );

      // Process each item in sequence
      for (const sequencedItem of sequencedItems) {
        if (sequencedItem.type === 'course') {
          const courseId = sequencedItem.courseId;
          const courseInfo = sequencedItem.data;
          
          try {
          // Create course item info
          const itemInfo = {
            type: 'course',
            id: courseId,
            title: courseInfo.customTitle || courseInfo.course?.title || 'Course',
            duration: courseInfo.customDuration || courseInfo.course?.duration,
            item: courseInfo.course,
            modules: courseInfo.modules
          };
          
          const duration = resolveDuration(itemInfo);
          
          console.log(`Scheduling ${itemInfo.title} for all ${targetGroups.length} groups back-to-back`);
          
          // Get required roles for this course
          const requiredRoles = getRequiredRoles(itemInfo, assignByRole, selectedRoles);
          
          // Schedule this course for ALL groups back-to-back
          for (let i = 0; i < targetGroups.length; i++) {
            const assignedGroup = targetGroups[i];
            
            // Check if group has participants with required roles
            const eligibleParticipants = getEligibleParticipants(assignedGroup, requiredRoles);
            
            if (eligibleParticipants.length === 0 && requiredRoles.length > 0) {
              warnings.push(`No participants in group "${assignedGroup.groupName}" match required roles for "${itemInfo.title}" - skipping group`);
              console.log(`Skipping ${itemInfo.title} for ${assignedGroup.groupName} - no eligible participants`);
              continue; // Skip this group and don't create events for it
            }

            console.log(`Scheduling ${itemInfo.title} for ${assignedGroup.groupName} at ${currentScheduleTime.toISOString()}`);

            // Schedule the event(s) - may split across days
            const eventDates = await scheduleEvent({
              startTime: currentScheduleTime,
              duration,
              workingHours,
              existingEvents,
              preserveExistingEvents,
              projectSettings
            });

            // Create event(s)
            for (const { start, end } of eventDates) {
              const eventTitle = `${itemInfo.title} - ${assignedGroup.groupName}`;
              
              const event = await createEvent({
                projectId: parseInt(projectId),
                title: eventTitle,
                start,
                end,
                itemInfo,
                assignedGroup,
                eligibleParticipants,
                trainingPlan,
                isSupportActivity: false
              });

              createdEvents.push(event);
              dayHasEvents = true; // Mark that this day has events
              
              // Update existing events list for future conflict detection
              if (preserveExistingEvents) {
                existingEvents.push({ start, end });
              }
            }

            // Update schedule time for next group's session of this course
            if (eventDates.length > 0) {
              currentScheduleTime = new Date(eventDates[eventDates.length - 1].end);
            }

            // Update progress
            job.processed++;
            job.events = createdEvents;
            jobStore.set(jobId, job);
          }

          } catch (itemError) {
            console.error(`Error processing course ${courseId}:`, itemError);
            warnings.push(`Failed to process course "${itemInfo.title}": ${itemError.message}`);
            job.processed++;
            jobStore.set(jobId, job);
          }
          
        } else if (sequencedItem.type === 'supportActivity') {
          // Process support activity
          const supportActivity = sequencedItem.data;
          
          try {
            const itemInfo = {
              type: 'supportActivity',
              id: supportActivity.supportActivityId,
              title: supportActivity.customTitle || supportActivity.supportActivity?.title || 'Support Activity',
              duration: supportActivity.customDuration || supportActivity.supportActivity?.duration,
              item: supportActivity.supportActivity
            };
            
            const duration = resolveDuration(itemInfo);
            
            console.log('Processing support activity:', {
              title: itemInfo.title,
              duration,
              day: planDay.dayNumber,
              order: sequencedItem.order
            });

            // Schedule the support activity
            const eventDates = await scheduleEvent({
              startTime: currentScheduleTime,
              duration,
              workingHours,
              existingEvents,
              preserveExistingEvents,
              projectSettings
            });

            // Create event(s) for support activity
            for (const { start, end } of eventDates) {
              const event = await createEvent({
                projectId: parseInt(projectId),
                title: itemInfo.title,
                start,
                end,
                itemInfo,
                assignedGroup: null, // No group assignment for support activities
                eligibleParticipants: [],
                trainingPlan,
                isSupportActivity: true
              });

              createdEvents.push(event);
              dayHasEvents = true; // Mark that this day has events
              
              if (preserveExistingEvents) {
                existingEvents.push({ start, end });
              }
            }

            // Update schedule time
            if (eventDates.length > 0) {
              currentScheduleTime = new Date(eventDates[eventDates.length - 1].end);
            }

            job.processed++;
            job.events = createdEvents;
            jobStore.set(jobId, job);

          } catch (itemError) {
            console.error(`Error processing support activity:`, itemError);
            warnings.push(`Failed to process support activity "${itemInfo.title}": ${itemError.message}`);
            job.processed++;
            jobStore.set(jobId, job);
          }
        }
      }

      // Create lunch break event if this day has training events
      console.log(`Day ${planDay.dayNumber} summary:`, {
        dayHasEvents,
        lunchTime: projectSettings.lunchTime,
        eventsCount: existingEvents.length
      });
      
      if (dayHasEvents && projectSettings.lunchTime) {
        try {
          console.log(`Attempting to create lunch break for day ${planDay.dayNumber}`);
          const lunchEvent = await createLunchBreakEvent({
            projectId: parseInt(projectId),
            projectSettings,
            planDay,
            trainingPlan,
            preserveExistingEvents,
            existingEvents
          });

          if (lunchEvent) {
            createdEvents.push(lunchEvent);
            
            if (preserveExistingEvents) {
              existingEvents.push({ 
                start: lunchEvent.start, 
                end: lunchEvent.end 
              });
            }
            
            console.log(`Created lunch break for day ${planDay.dayNumber}:`, {
              title: lunchEvent.title,
              start: lunchEvent.start,
              end: lunchEvent.end
            });
          } else {
            console.log(`No lunch break created for day ${planDay.dayNumber}`);
          }
        } catch (lunchError) {
          console.error(`Error creating lunch break for day ${planDay.dayNumber}:`, lunchError);
          warnings.push(`Failed to create lunch break for day ${planDay.dayNumber}: ${lunchError.message}`);
        }
      } else {
        console.log(`Skipping lunch break for day ${planDay.dayNumber}:`, {
          dayHasEvents,
          hasLunchTime: !!projectSettings.lunchTime
        });
      }

    }

    // Complete the job
    job.status = 'completed';
    job.warnings = warnings.length;
    job.warningMessages = warnings;
    job.message = `Import completed. Created ${createdEvents.length} events with ${warnings.length} warnings.`;
    job.completedAt = new Date().toISOString();
    jobStore.set(jobId, job);

  } catch (error) {
    console.error('Import agenda processing error:', error);
    job.status = 'failed';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
    jobStore.set(jobId, job);
    throw error;
  }
}

// Helper functions

function parseWorkingHours(projectSettings) {
  const [startHour, startMinute] = projectSettings.startOfDayTime.split(':').map(Number);
  const [endHour, endMinute] = projectSettings.endOfDayTime.split(':').map(Number);
  
  return {
    startOfDay: startHour * 60 + startMinute, // minutes from midnight
    endOfDay: endHour * 60 + endMinute,
    workingDays: projectSettings.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    timezone: projectSettings.timezone || 'UTC'
  };
}

function resolveDuration(itemInfo) {
  // Priority: duration already set > default 60 minutes
  return itemInfo.duration || 60;
}

function getRequiredRoles(itemInfo, assignByRole, selectedRoles) {
  if (!assignByRole || selectedRoles.length === 0) {
    return [];
  }

  let itemRoles = [];
  
  // Only courses have role assignments
  if (itemInfo.type === 'course') {
    // Check if we have course_participant_roles directly on the item
    if (itemInfo.item?.course_participant_roles) {
      itemRoles = itemInfo.item.course_participant_roles.map(cpr => cpr.role);
    } 
    // Or if this was originally a module, check its parent course
    else if (itemInfo.item?.course?.course_participant_roles) {
      itemRoles = itemInfo.item.course.course_participant_roles.map(cpr => cpr.role);
    }
  }

  // Filter to only selected roles
  return itemRoles.filter(role => selectedRoles.includes(role.id));
}

function getEligibleParticipants(group, requiredRoles) {
  if (requiredRoles.length === 0) {
    // No role filtering, return all participants
    return group.participants.map(gp => gp.participant);
  }

  // Filter participants by required roles
  const requiredRoleIds = requiredRoles.map(role => role.id);
  return group.participants.filter(gp => {
    const participant = gp.participant.participant;
    return participant.roleId && requiredRoleIds.includes(participant.roleId);
  }).map(gp => gp.participant);
}

async function scheduleEvent({ startTime, duration, workingHours, existingEvents, preserveExistingEvents, projectSettings }) {
  const events = [];
  let remaining = duration;
  let currentStart = new Date(startTime);

  while (remaining > 0) {
    // Ensure we're on a working day
    currentStart = ensureWorkingDay(currentStart, workingHours.workingDays);
    
    // Ensure we're within working hours
    currentStart = ensureWorkingHours(currentStart, workingHours);
    
    // Check for conflicts with existing events
    if (preserveExistingEvents) {
      currentStart = findNextAvailableSlot(currentStart, duration, existingEvents, workingHours);
    }
    
    // Check for lunch time conflicts and adjust
    currentStart = avoidLunchTime(currentStart, duration, projectSettings);

    // Calculate how much time we can use today, considering lunch break
    const { availableMinutes, todayDuration } = calculateAvailableTime(currentStart, remaining, workingHours, projectSettings);

    if (todayDuration > 0) {
      const eventEnd = new Date(currentStart);
      eventEnd.setMinutes(eventEnd.getMinutes() + todayDuration);
      
      events.push({
        start: new Date(currentStart),
        end: eventEnd
      });

      remaining -= todayDuration;
    }

    // Move to next working day if needed
    if (remaining > 0) {
      currentStart = getNextWorkingDay(currentStart, workingHours.workingDays);
      currentStart.setHours(0, 0, 0, 0);
      currentStart.setMinutes(workingHours.startOfDay);
    }
  }

  return events;
}

function ensureWorkingDay(date, workingDays) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let current = new Date(date);
  
  while (!workingDays.includes(dayNames[current.getDay()])) {
    current.setDate(current.getDate() + 1);
  }
  
  return current;
}

function ensureWorkingHours(date, workingHours) {
  const current = new Date(date);
  const currentMinutes = current.getHours() * 60 + current.getMinutes();
  
  if (currentMinutes < workingHours.startOfDay) {
    current.setHours(0, 0, 0, 0);
    current.setMinutes(workingHours.startOfDay);
  } else if (currentMinutes >= workingHours.endOfDay) {
    // Move to next working day
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
    current.setMinutes(workingHours.startOfDay);
    return ensureWorkingDay(current, workingHours.workingDays);
  }
  
  return current;
}

function findNextAvailableSlot(startTime, duration, existingEvents, workingHours) {
  let current = new Date(startTime);
  
  // Simple conflict detection - in production, use more sophisticated algorithm
  for (const existing of existingEvents) {
    const existingStart = new Date(existing.start);
    const existingEnd = new Date(existing.end);
    const proposedEnd = new Date(current);
    proposedEnd.setMinutes(proposedEnd.getMinutes() + duration);
    
    // Check for overlap
    if (current < existingEnd && proposedEnd > existingStart) {
      // Move start time to after the existing event
      current = new Date(existingEnd);
      current = ensureWorkingHours(current, workingHours);
    }
  }
  
  return current;
}

function getNextWorkingDay(date, workingDays) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let next = new Date(date);
  next.setDate(next.getDate() + 1);
  
  while (!workingDays.includes(dayNames[next.getDay()])) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

async function createEvent({ projectId, title, start, end, itemInfo, assignedGroup, eligibleParticipants, trainingPlan, isSupportActivity }) {
  // Create the event
  const eventData = {
    title,
    start: start.toISOString(),
    end: end.toISOString(),
    eventType: itemInfo.type === 'course' ? 'course' : 'other',
    courseId: itemInfo.type === 'course' ? itemInfo.id : null,
    projectId,
    extendedProps: {
      notes: `Auto-imported from training plan "${trainingPlan.title}"`,
      trainingPlanId: trainingPlan.id,
      itemType: itemInfo.type,
      itemId: itemInfo.id,
      groupId: isSupportActivity ? null : assignedGroup?.id,
      groupName: isSupportActivity ? null : assignedGroup?.groupName,
      isSupportActivity: isSupportActivity,
      audit: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        source: 'training_plan_import',
        trainingPlanId: trainingPlan.id
      }]
    },
    eventStatus: 'scheduled',
    allDay: false,
    color: isSupportActivity ? '#FFA726' : (assignedGroup?.chipColor || '#2196F3'),
    backgroundColor: isSupportActivity ? '#FFA726' : (assignedGroup?.chipColor || '#2196F3'),
    editable: true
  };

  const event = await prisma.events.create({
    data: eventData
  });

  // Only create group and attendee associations for non-support activities
  if (!isSupportActivity && assignedGroup) {
    // Create event-group association
    await prisma.event_groups.create({
      data: {
        eventsId: event.id,
        groupId: assignedGroup.id
      }
    });

    // Create event-attendee associations
    for (const participant of eligibleParticipants) {
      await prisma.event_attendees.create({
        data: {
          eventsId: event.id,
          enrolleeId: participant.id,
          attendance_status: 'scheduled',
          createdBy: 'system'
        }
      });
    }
  }

  return event;
}

async function createLunchBreakEvent({ projectId, projectSettings, planDay, trainingPlan, preserveExistingEvents, existingEvents }) {
  if (!projectSettings.lunchTime) {
    return null;
  }

  // Parse lunch time (format: "12:00-13:00")
  const lunchTimeMatch = projectSettings.lunchTime.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
  if (!lunchTimeMatch) {
    console.warn('Invalid lunch time format:', projectSettings.lunchTime);
    return null;
  }

  const [, startHour, startMinute, endHour, endMinute] = lunchTimeMatch.map(Number);

  // Calculate the lunch date based on the project start date and day number
  const projectStartDate = new Date(projectSettings.startDate);
  const lunchDate = new Date(projectStartDate);
  
  // Add days to get to the correct training day
  // Day 1 = project start date, Day 2 = project start date + 1, etc.
  lunchDate.setDate(lunchDate.getDate() + (planDay.dayNumber - 1));
  
  // Ensure it's a working day
  const workingHours = parseWorkingHours(projectSettings);
  const adjustedLunchDate = ensureWorkingDay(lunchDate, workingHours.workingDays);
  
  // Set preferred lunch start time
  let lunchStart = new Date(adjustedLunchDate);
  lunchStart.setHours(startHour, startMinute, 0, 0);
  
  // Set preferred lunch end time  
  let lunchEnd = new Date(adjustedLunchDate);
  lunchEnd.setHours(endHour, endMinute, 0, 0);

  // Get events for this specific day to find the best lunch slot
  const dayEvents = existingEvents.filter(existing => {
    const existingStart = new Date(existing.start);
    const eventDate = new Date(existingStart);
    eventDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(adjustedLunchDate);
    targetDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === targetDate.getTime();
  }).sort((a, b) => new Date(a.start) - new Date(b.start));

  // If there are conflicts with the preferred lunch time, try to find a gap
  const hasConflict = dayEvents.some(existing => {
    const existingStart = new Date(existing.start);
    const existingEnd = new Date(existing.end);
    return (lunchStart < existingEnd && lunchEnd > existingStart);
  });

  if (hasConflict) {
    console.log(`Preferred lunch time conflicts with existing events for day ${planDay.dayNumber}, skipping lunch break`);
    console.log(`Existing events on this day:`, dayEvents.map(e => ({
      start: new Date(e.start).toISOString(),
      end: new Date(e.end).toISOString()
    })));
    return null; // Don't create lunch break if it conflicts
  }

  // Create the lunch break event
  const eventData = {
    title: 'Lunch Break',
    start: lunchStart.toISOString(),
    end: lunchEnd.toISOString(),
    eventType: 'other',
    courseId: null,
    projectId,
    extendedProps: {
      notes: `Auto-created lunch break for training day ${planDay.dayNumber}`,
      trainingPlanId: trainingPlan.id,
      itemType: 'lunchBreak',
      dayNumber: planDay.dayNumber,
      isLunchBreak: true,
      audit: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        source: 'training_plan_import_lunch',
        trainingPlanId: trainingPlan.id
      }]
    },
    eventStatus: 'scheduled',
    allDay: false,
    color: '#9E9E9E', // Gray color for lunch breaks
    backgroundColor: '#9E9E9E',
    editable: true
  };

  const event = await prisma.events.create({
    data: eventData
  });

  return event;
}

function avoidLunchTime(startTime, duration, projectSettings) {
  if (!projectSettings.lunchTime) {
    return startTime;
  }

  // Parse lunch time (format: "12:00-13:00")
  const lunchTimeMatch = projectSettings.lunchTime.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
  if (!lunchTimeMatch) {
    return startTime;
  }

  const [, lunchStartHour, lunchStartMinute, lunchEndHour, lunchEndMinute] = lunchTimeMatch.map(Number);
  
  const currentDate = new Date(startTime);
  
  // Create lunch start and end times for the same day
  const lunchStart = new Date(currentDate);
  lunchStart.setHours(lunchStartHour, lunchStartMinute, 0, 0);
  
  const lunchEnd = new Date(currentDate);
  lunchEnd.setHours(lunchEndHour, lunchEndMinute, 0, 0);
  
  // Calculate proposed event end time
  const proposedEnd = new Date(startTime);
  proposedEnd.setMinutes(proposedEnd.getMinutes() + duration);
  
  // Check if the event would overlap with lunch time
  const eventOverlapsLunch = (startTime < lunchEnd && proposedEnd > lunchStart);
  
  if (eventOverlapsLunch) {
    console.log(`Event would overlap with lunch time, moving to after lunch`);
    // Move the start time to after lunch
    return new Date(lunchEnd);
  }
  
  return startTime;
}

function calculateAvailableTime(startTime, remaining, workingHours, projectSettings) {
  // Calculate end of working day
  const dayEnd = new Date(startTime);
  dayEnd.setHours(0, 0, 0, 0);
  dayEnd.setMinutes(workingHours.endOfDay);
  
  let availableMinutes = Math.max(0, (dayEnd - startTime) / (1000 * 60));
  
  // Check if lunch time would interrupt this session
  if (projectSettings.lunchTime) {
    const lunchTimeMatch = projectSettings.lunchTime.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    if (lunchTimeMatch) {
      const [, lunchStartHour, lunchStartMinute, lunchEndHour, lunchEndMinute] = lunchTimeMatch.map(Number);
      
      const lunchStart = new Date(startTime);
      lunchStart.setHours(lunchStartHour, lunchStartMinute, 0, 0);
      
      const lunchEnd = new Date(startTime);
      lunchEnd.setHours(lunchEndHour, lunchEndMinute, 0, 0);
      
      // If lunch time is between start and end of day, we need to account for it
      if (startTime < lunchStart && dayEnd > lunchEnd) {
        // Calculate time until lunch starts
        const timeUntilLunch = Math.max(0, (lunchStart - startTime) / (1000 * 60));
        
        // If we would hit lunch time, limit available time to before lunch
        if (timeUntilLunch < availableMinutes) {
          availableMinutes = timeUntilLunch;
        }
      }
    }
  }
  
  const todayDuration = Math.min(remaining, availableMinutes);
  
  return { availableMinutes, todayDuration };
}