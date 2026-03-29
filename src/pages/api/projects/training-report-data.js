/**
 * GET /api/projects/training-report-data
 *
 * Aggregates all data needed for the training report PDF:
 * project info, organization + logo, daily notes, events/attendance, parking lot items.
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { WorkOS } from '@workos-inc/node';
const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'org',

  GET: async (req, res) => {
    const userId = req.cookies.workos_user_id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const user = await workos.userManagement.getUser(userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'Project ID is required' });

    const id = parseInt(projectId, 10);

    // Fetch project with relations
    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        project_instructors: {
          include: { instructor: true }
        },
        sub_organization: {
          include: {
            organization: {
              select: { id: true, title: true, logo_url: true }
            }
          }
        },
        project_settings: true
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Fetch daily training notes (chronological)
    const dailyNotes = await prisma.daily_training_notes.findMany({
      where: { projectId: id },
      orderBy: { date: 'asc' }
    });

    // Fetch events with attendees for attendance computation
    const events = await prisma.events.findMany({
      where: { projectId: id },
      orderBy: { start: 'asc' },
      include: {
        event_attendees: {
          include: {
            enrollee: {
              include: {
                participant: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        },
        course: { select: { title: true } }
      }
    });

    // Fetch parking lot items
    const parkingLotItems = await prisma.parking_lot_items.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });

    // Count active participants
    const participantCount = await prisma.project_participants.count({
      where: { projectId: id, status: 'active' }
    });

    // Compute daily attendance from events
    const attendanceByDate = {};
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalScheduled = 0;

    events.forEach(event => {
      const dateKey = new Date(event.start).toISOString().split('T')[0];
      if (!attendanceByDate[dateKey]) {
        attendanceByDate[dateKey] = { present: 0, late: 0, absent: 0, total: 0, sessions: 0 };
      }
      attendanceByDate[dateKey].sessions++;

      (event.event_attendees || []).forEach(att => {
        const status = att.attendance_status || 'scheduled';
        attendanceByDate[dateKey].total++;
        if (status === 'present') { attendanceByDate[dateKey].present++; totalPresent++; }
        else if (status === 'late') { attendanceByDate[dateKey].late++; totalLate++; }
        else if (status === 'absent') { attendanceByDate[dateKey].absent++; totalAbsent++; }
        totalScheduled++;
      });
    });

    // Build session notes from events (grouped by date)
    const sessionNotesByDate = {};
    events.forEach(event => {
      const dateKey = new Date(event.start).toISOString().split('T')[0];
      const notes = event.extendedProps?.notes;
      if (notes) {
        if (!sessionNotesByDate[dateKey]) sessionNotesByDate[dateKey] = [];
        const timeStr = new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        sessionNotesByDate[dateKey].push(`[${timeStr}] ${event.title}: ${notes}`);
      }
    });

    // Lead instructor
    const leadInstructor = project.project_instructors?.find(
      pi => pi.instructorType === 'lead' || pi.instructorType === 'main'
    ) || project.project_instructors?.[0];

    const organization = project.sub_organization?.organization || null;

    // Fetch logo as base64 data URL so @react-pdf/renderer can embed it
    let logoDataUrl = null;
    if (organization?.logo_url) {
      try {
        const logoRes = await fetch(organization.logo_url);
        if (logoRes.ok) {
          const contentType = logoRes.headers.get('content-type') || 'image/png';
          const buffer = await logoRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          logoDataUrl = `data:${contentType};base64,${base64}`;
        }
      } catch (e) {
        console.warn('[Training Report] Failed to fetch logo:', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          summary: project.summary,
          startDate: project.startDate,
          endDate: project.endDate,
          language: project.language,
          projectStatus: project.projectStatus
        },
        organization: organization ? {
          title: organization.title,
          logoUrl: logoDataUrl || organization.logo_url
        } : null,
        leadInstructor: leadInstructor ? {
          name: `${leadInstructor.instructor.firstName} ${leadInstructor.instructor.lastName}`.trim(),
          role: leadInstructor.instructorType
        } : null,
        participantCount,
        totalSessions: events.length,
        dailyNotes: dailyNotes.map(n => ({
          date: n.date,
          keyHighlights: n.keyHighlights,
          challenges: n.challenges,
          sessionNotes: n.sessionNotes,
          author: n.author,
          authorRole: n.authorRole
        })),
        sessionNotesByDate,
        attendance: {
          byDate: Object.entries(attendanceByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({ date, ...data })),
          totals: {
            present: totalPresent,
            late: totalLate,
            absent: totalAbsent,
            scheduled: totalScheduled
          }
        },
        parkingLotItems: parkingLotItems.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          priority: item.priority,
          status: item.status,
          reportedDate: item.reportedDate,
          solvedDate: item.solvedDate
        }))
      }
    });
  }
});
