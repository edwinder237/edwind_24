import prisma from "../../../lib/prisma";
import { getOrgSubscription } from "../../../lib/features/subscriptionService";
import { canAccessFeature } from "../../../lib/features/featureAccess";
import { createAuditLog } from "../../../lib/utils/auditLog";
import { attachUserClaims } from "../../../lib/auth/middleware";

export default async function handler(req, res) {
    // Try to get user info (non-blocking)
    await attachUserClaims(req, res);

    try {
      const { newEvent, events, projectId, createdByName } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      // Check event_management feature access
      const projectWithOrg = await prisma.projects.findUnique({
        where: { id: parseInt(projectId) },
        select: { sub_organization: { select: { organizationId: true } } }
      });
      if (projectWithOrg?.sub_organization?.organizationId) {
        const subscription = await getOrgSubscription(projectWithOrg.sub_organization.organizationId);
        if (subscription) {
          const featureCheck = canAccessFeature({
            subscription,
            featureKey: 'event_management'
          });
          if (!featureCheck.canAccess) {
            return res.status(403).json({
              error: 'Feature not available',
              message: 'Event management is not available on your current plan',
              upgradeUrl: '/upgrade'
            });
          }
        }
      }

      const event = {
        title: newEvent.title,
        description: newEvent.description,
        eventType: newEvent.eventType || "other",
        start: newEvent.start,
        end: newEvent.end,
        allDay: newEvent.allDay,
        color: newEvent.color,
        textColor: newEvent.textColor,
        backgroundColor: "#4285F4",
        borderColor: "#000000",
        editable: true,
        eventStatus: "Active",
        timezone: newEvent.timezone || null,
        deliveryMode: newEvent.deliveryMode || "in_person",
        meetingLink: newEvent.meetingLink || null,
        extendedProps: {},
        project: {connect: {id: parseInt(projectId)}},
        ...(newEvent.courseId && { course: {connect: {id: parseInt(newEvent.courseId)}} }),
        ...(newEvent.supportActivityId && { supportActivity: {connect: {id: parseInt(newEvent.supportActivityId)}} }),
        ...(newEvent.roomId && { room: {connect: {id: parseInt(newEvent.roomId)}} })
      };
       const createdEvent = await prisma.events.create({
        data: event,
      });

      // Log audit entry if event is linked to a course (delivery scheduled)
      if (newEvent.courseId) {
        // Get project title for the audit log
        const project = await prisma.projects.findUnique({
          where: { id: parseInt(projectId) },
          select: { title: true }
        });

        // Determine who created the event
        const scheduledByName = createdByName || req.userClaims?.name || 'Project Manager';

        await createAuditLog(prisma, {
          courseId: parseInt(newEvent.courseId),
          entityType: 'event',
          entityId: createdEvent.id,
          actionType: 'create',
          metadata: {
            title: newEvent.title,
            eventType: newEvent.eventType || 'other',
            start: newEvent.start,
            end: newEvent.end,
            projectId: parseInt(projectId),
            projectTitle: project?.title || 'Unknown Project',
            deliveryMode: newEvent.deliveryMode || 'in_person',
          },
          changedByName: scheduledByName,
        });
      }

      res.status(200).json(`${newEvent.title} Event created and saved to database`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  
  
  
  
  
  
