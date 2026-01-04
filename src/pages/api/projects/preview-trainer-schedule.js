import { formatInTimeZone } from 'date-fns-tz';
import prisma from '../../../lib/prisma';

function getDefaultProfessionalTemplate() {
  return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">

<head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css?family=Abril+Fatface" rel="stylesheet" type="text/css">
    <link href="https://fonts.googleapis.com/css?family=Droid+Serif" rel="stylesheet" type="text/css">
    <link href="https://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet" type="text/css">
    <!--<![endif]-->
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
        }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
        }

        #MessageViewBody a {
            color: inherit;
            text-decoration: none;
        }

        p {
            line-height: inherit
        }

        .desktop_hide,
        .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
        }

        @media (max-width:920px) {

            .image_block img.big,
            .row-content {
                width: 100% !important;
            }

            .mobile_hide {
                display: none;
            }

            .stack .column {
                width: 100%;
                display: block;
            }

            .mobile_hide {
                min-height: 0;
                max-height: 0;
                max-width: 0;
                overflow: hidden;
                font-size: 0px;
            }

            .desktop_hide,
            .desktop_hide table {
                display: table !important;
                max-height: none !important;
            }
        }
    </style>
</head>
<body>
  <div>
    <br>
    <br>
  </div>
<div style="background-color: #ebebeb; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ebebeb;">
        <tbody>
            <tr>
                <td>
                    <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 15px; padding-bottom: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
                                                                <div class="alignment" align="center" style="line-height:10px"><img class="big" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/1646/top_background.png" style="display: block; height: auto; border: 0; width: 900px; max-width: 100%;" width="900" alt="Alternate text" title="Alternate text"></div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 0px; padding-bottom: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad" style="width:100%;padding-right:20px;padding-left:20px;padding-top:15px;padding-bottom:10px;">
                                                                <div class="alignment" align="left" style="line-height:10px"><img src="https://d15k2d11r6t6rl.cloudfront.net/public/users/Integrators/BeeProAgency/818300_802231/sm-page-compagnie-FR-bg-copie-e1512664242473.png" style="display: block; height: auto; border: 0; width: 225px; max-width: 100%;" width="225"></div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-left: 5px; padding-right: 5px; vertical-align: top; padding-top: 45px; padding-bottom: 25px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="text_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:30px;padding-right:30px;padding-top:5px;">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 14.399999999999999px; color: #2d2d2d; line-height: 1.2; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 16.8px;"><span style="font-size:20px;"><strong>{{PROJECT_TITLE}}</strong></span></p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Groups Section -->
                    {{#GROUPS_SECTION}}
                    {{/GROUPS_SECTION}}

                    <!-- Schedule Days -->
                    {{#SCHEDULE_DAYS}}
                    {{/SCHEDULE_DAYS}}

                    <table class="row row-7" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 0px; padding-bottom: 15px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
                                                                <div class="alignment" align="center" style="line-height:10px"><img class="big" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/1646/bottom_background.png" style="display: block; height: auto; border: 0; width: 900px; max-width: 100%;" width="900" alt="Alternate text" title="Alternate text"></div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
            </tr>
        </tbody>
    </table>
</td>
</tr>
</tbody>
</table>
</div>
</body>

</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, projectTitle, events, dailyFocusData, includeEventSummaries = true, showLogo = true, showFocusOfDay = true, timezone = 'America/Edmonton' } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Missing required field: projectId' });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'No events to preview' });
    }

    // Generate the HTML preview
    const template = getDefaultProfessionalTemplate();
    const emailHtml = await generateTrainerEmailFromTemplate({
      template,
      projectTitle,
      projectId,
      events,
      trainerEmail: 'preview@example.com',
      includeEventSummaries,
      showLogo,
      showFocusOfDay,
      timezone
    });

    res.status(200).json({
      success: true,
      html: emailHtml
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function generateTrainerEmailFromTemplate({ template, projectTitle, projectId, events, trainerEmail, includeEventSummaries = true, showLogo = true, showFocusOfDay = true, timezone = 'America/Edmonton' }) {
  let processedTemplate = template;

  // Fetch project groups, participants, and organization logo
  let projectGroups = [];
  let organizationLogoUrl = null;
  try {
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
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
        },
        // Include sub_organization -> organization to get the logo
        sub_organization: {
          select: {
            organization: {
              select: {
                logo_url: true
              }
            }
          }
        }
      }
    });
    projectGroups = project?.groups || [];
    organizationLogoUrl = project?.sub_organization?.organization?.logo_url || null;
  } catch (error) {
    console.error('Error fetching project groups:', error);
  }

  // Remove logo section if showLogo is false
  if (!showLogo) {
    // Remove the logo row (row-2) which contains the organization logo
    processedTemplate = processedTemplate.replace(
      /<table class="row row-2"[^>]*>[\s\S]*?<\/table>\s*(?=<table class="row row-3")/gi,
      ''
    );
  } else if (organizationLogoUrl) {
    // Replace the hardcoded logo with the organization's logo
    // The container is 225px wide, so the image should fit within that while maintaining aspect ratio
    processedTemplate = processedTemplate.replace(
      /<img src="https:\/\/d15k2d11r6t6rl\.cloudfront\.net\/public\/users\/Integrators\/BeeProAgency\/818300_802231\/sm-page-compagnie-FR-bg-copie-e1512664242473\.png"[^>]*>/gi,
      `<img src="${organizationLogoUrl}" style="display: block; height: auto; border: 0; max-width: 225px; max-height: 100px; width: auto; object-fit: contain;" alt="Organization Logo">`
    );
  }

  // Template variables
  const variables = {
    '{{PROJECT_TITLE}}': projectTitle,
    '{{PARTICIPANT_NAME}}': `Trainer`,
    '{{GROUP_NAME}}': 'All Groups',
    '{{EVENT_TITLE}}': events.length > 0 ? events[0].title : 'Training Events',
    '{{COURSE_TITLE}}': events.length > 0 ? events[0].course?.title || '' : '',
    '{{EVENT_DATE}}': events.length > 0 ? formatInTimeZone(new Date(events[0].start), timezone, 'EEEE, MMMM d, yyyy') : '',
    '{{EVENT_TIME}}': events.length > 0 ? formatInTimeZone(new Date(events[0].start), timezone, 'HH:mm') : '',
    '{{EVENT_LOCATION}}': events.length > 0 ? events[0].location || '' : '',
    '{{EVENT_DESCRIPTION}}': events.length > 0 ? events[0].description || '' : '',
    '{{ZOOM_LINK}}': ''
  };

  // Replace basic variables
  Object.entries(variables).forEach(([variable, value]) => {
    processedTemplate = processedTemplate.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  // Handle schedule days for summary template
  if (events.length > 0) {
    // Group events by date (using timezone-aware date)
    const eventsByDate = events.reduce((acc, evt) => {
      const date = formatInTimeZone(new Date(evt.start), timezone, 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(evt);
      return acc;
    }, {});

    // Sort dates and generate schedule days HTML
    const sortedDates = Object.keys(eventsByDate).sort();
    const scheduleDaysHtml = sortedDates.map(dateKey => {
      const dayEvents = eventsByDate[dateKey];
      const date = new Date(dateKey + 'T12:00:00');
      const month = formatInTimeZone(date, timezone, 'MMM').toUpperCase();
      const day = formatInTimeZone(date, timezone, 'dd');
      const dayName = formatInTimeZone(date, timezone, 'EEEE').toUpperCase();

      // Sort events by start time
      const sortedDayEvents = dayEvents.sort((a, b) => {
        const startA = new Date(a.start);
        const startB = new Date(b.start);
        return startA - startB;
      });

      // Calculate column widths based on whether Focus column is shown
      const dateColumnWidth = showFocusOfDay ? '25%' : '25%';
      const scheduleColumnWidth = showFocusOfDay ? '50%' : '75%';

      return `
                    <table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 20px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="divider_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:15px;padding-right:15px;padding-top:5px;">
                                                                <div class="alignment" align="center">
                                                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                                        <tr>
                                                                            <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #2D2D2D;"><span>&#8202;</span></td>
                                                                        </tr>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table class="row row-6" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr valign="top" style="vertical-align: top;">
                                                <td width="${dateColumnWidth}" style="font-weight: 400; text-align: center; background-color: #ffffff; vertical-align: top; padding: 10px 5px 10px 5px;" valign="top" align="center">
                                                    <p style="margin: 0; font-size: 14px; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif; color: #2d2d2d;">${month}</p>
                                                    <p style="margin: 0; font-size: 28px; font-weight: bold; line-height: 1.2; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif; color: #2d2d2d;">${day}</p>
                                                    <p style="margin: 0; font-size: 14px; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif; color: #2d2d2d;">${dayName}</p>
                                                </td>
                                                <td width="${scheduleColumnWidth}" style="font-weight: 400; text-align: left; background-color: #ffffff; padding: 10px 10px 10px 15px; vertical-align: top;" valign="top">
                                                    <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #cc0a0a; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">Schedule</p>
                                                    ${sortedDayEvents.map(evt => {
                                                      const timeRange = formatInTimeZone(new Date(evt.start), timezone, 'HH:mm');
                                                      const groups = evt.event_groups?.map(eg => eg.groups?.groupName).filter(Boolean).join(', ');
                                                      return `<p style="margin: 0 0 3px 0; font-size: 14px; line-height: 1.4; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif; color: #000000;"><strong>${timeRange}</strong> ${evt.title}${groups ? ` <strong>${groups}</strong>` : ''}</p>`;
                                                    }).join('')}
                                                </td>
                                                ${showFocusOfDay ? `<td width="25%" style="font-weight: 400; text-align: center; background-color: #ffffff; padding: 10px; vertical-align: top;" valign="top">
                                                    <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif; color: #000000;">Focus of the day</p>
                                                    <p style="margin: 0; font-size: 14px; line-height: 1.4; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif; color: #000000;">Available on training day</p>
                                                </td>` : ''}
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;
    }).join('');

    processedTemplate = processedTemplate.replace(/{{#SCHEDULE_DAYS}}.*?{{\/SCHEDULE_DAYS}}/gs, scheduleDaysHtml);
  }

  // Generate groups HTML with real project data
  const generateGroupColumns = () => {
    if (projectGroups.length === 0) {
      return `
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:10px;">
                                                                <div style="color:#000000;direction:ltr;font-family:'Ubuntu', Tahoma, Verdana, Segoe, sans-serif;font-size:20px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:24px;">
                                                                    <p style="margin: 0;"><strong>Training Groups</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="list_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:15px;padding-left:60px;padding-right:10px;">
                                                                <ul start="1" style="margin: 0; padding: 0; margin-left: 20px; list-style-type: revert; color: #000000; direction: ltr; font-family: 'Ubuntu', Tahoma, Verdana, Segoe, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;">
                                                                    <li style="margin-bottom: 0px;">No groups configured</li>
                                                                </ul>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>`;
    }

    const maxGroups = Math.min(projectGroups.length, 4);
    const columnWidth = Math.floor(100 / maxGroups);

    return projectGroups.slice(0, maxGroups).map((group, index) => {
      const participants = group.participants || [];
      const participantsList = participants.map(p => {
        const participantData = p.participant?.participant;
        const userName = participantData?.firstName && participantData?.lastName
          ? `${participantData.firstName} ${participantData.lastName}`
          : participantData?.email || 'Unknown Participant';
        return `
                                                                <ul start="1" style="margin: 0; padding: 0; margin-left: 20px; list-style-type: revert; color: #000000; direction: ltr; font-family: 'Ubuntu', Tahoma, Verdana, Segoe, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;">
                                                                    <li style="margin-bottom: 0px;">${userName}</li>
                                                                </ul>`;
      }).join('');

      return `
                                                <td class="column column-${index + 1}" width="${columnWidth}%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:10px;">
                                                                <div style="color:#000000;direction:ltr;font-family:'Ubuntu', Tahoma, Verdana, Segoe, sans-serif;font-size:20px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:24px;">
                                                                    <p style="margin: 0;"><strong>${group.groupName || `Group ${index + 1}`}</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="list_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:15px;padding-left:60px;padding-right:10px;">
                                                                ${participantsList || '<ul start="1" style="margin: 0; padding: 0; margin-left: 20px; list-style-type: revert; color: #000000; direction: ltr; font-family: \'Ubuntu\', Tahoma, Verdana, Segoe, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;"><li style="margin-bottom: 0px;">No participants</li></ul>'}
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>`;
    }).join('');
  };

  const groupsHtml = generateGroupColumns();

  const fullGroupsSection = `
                    <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                ${groupsHtml}
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;

  processedTemplate = processedTemplate.replace(/{{#GROUPS_SECTION}}.*?{{\/GROUPS_SECTION}}/gs, fullGroupsSection);

  return processedTemplate;
}
