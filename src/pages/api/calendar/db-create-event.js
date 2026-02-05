import prisma from "../../../lib/prisma";
import { getOrgSubscription } from "../../../lib/features/subscriptionService";
import { canAccessFeature } from "../../../lib/features/featureAccess";

export default async function handler(req, res) {
    try {

      const { newEvent, events, projectId } = req.body;

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
        extendedProps: { location: "Conference Room A", priority: "High" },
        project: {connect: {id: parseInt(projectId)}},
        ...(newEvent.courseId && { course: {connect: {id: parseInt(newEvent.courseId)}} }),
        ...(newEvent.supportActivityId && { supportActivity: {connect: {id: parseInt(newEvent.supportActivityId)}} }),
        ...(newEvent.roomId && { room: {connect: {id: parseInt(newEvent.roomId)}} })
      };
       await prisma.events.create({
        data: event,

      });
      
  
      res.status(200).json(`${newEvent.title} Event created and saved to database`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  
  
  
  
  
  
