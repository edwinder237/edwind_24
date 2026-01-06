import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Resend } from 'resend';
import prisma from '../../../lib/prisma';
import puppeteer from 'puppeteer';

const resend = new Resend(process.env.RESEND_API_KEY || 're_FuWEsP4t_57FGZEkUyxct65xaqCYXvQGG');

// Rate limiting: 2 requests per second = 500ms delay between requests
const RATE_LIMIT_DELAY = 600; // 600ms to be safe

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

/**
 * Unified trainer schedule API handler
 * Supports both preview and send actions
 *
 * POST /api/projects/trainer-schedule
 * Body: { action: 'preview' | 'send', ...params }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action = 'preview' } = req.body;

  if (action === 'preview') {
    return handlePreview(req, res);
  } else if (action === 'send') {
    return handleSend(req, res);
  } else {
    return res.status(400).json({ message: 'Invalid action. Use "preview" or "send".' });
  }
}

/**
 * Handle preview action - generates HTML preview
 */
async function handlePreview(req, res) {
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

/**
 * Handle send action - sends email via Resend
 */
async function handleSend(req, res) {
  try {
    const { projectId, projectTitle, events, dailyFocusData, trainerEmails, ccEmails = [], bccEmails = [], customSubject, customTemplate, templateType, includeEventSummaries = true, showLogo = true, showFocusOfDay = true, timezone = 'America/Edmonton', includePdf = false } = req.body;

    if (!projectId || !trainerEmails || !Array.isArray(trainerEmails) || trainerEmails.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: projectId and trainerEmails' });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'No events to send schedule for' });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allEmails = [...trainerEmails, ...ccEmails, ...bccEmails];
    const invalidEmails = allEmails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        message: `Invalid email addresses: ${invalidEmails.join(', ')}`
      });
    }

    // Generate the email HTML once (same content for all recipients)
    const templateToUse = getDefaultProfessionalTemplate();
    const emailHtml = await generateTrainerEmailFromTemplate({
      template: templateToUse,
      projectTitle,
      projectId,
      events,
      trainerEmail: trainerEmails[0], // Use first email for template generation
      includeEventSummaries,
      showLogo,
      showFocusOfDay,
      timezone
    });

    // Generate PDF attachment if requested
    let pdfAttachment = null;
    if (includePdf) {
      try {
        // Try to find Chrome in common locations
        const possiblePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
          '/usr/bin/google-chrome', // Linux
          '/usr/bin/chromium-browser', // Linux Chromium
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows x86
        ];

        let executablePath = null;
        const fs = require('fs');
        for (const path of possiblePaths) {
          if (fs.existsSync(path)) {
            executablePath = path;
            break;
          }
        }

        const launchOptions = {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        };

        // Use found Chrome path, or let puppeteer try to find it
        if (executablePath) {
          launchOptions.executablePath = executablePath;
        }

        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Set viewport to match the email template width
        await page.setViewport({ width: 900, height: 1200 });

        // Create a clean PDF-optimized version of the email HTML
        const pdfHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @page {
                size: A4 portrait;
                margin: 0;
              }
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 15px;
                width: 100%;
                background-color: #ffffff !important;
              }
              /* Remove email background colors for cleaner PDF */
              .nl-container, [style*="background-color: #ebebeb"] {
                background-color: #ffffff !important;
              }
              /* Override fixed widths to be responsive */
              table[width="900"],
              .row-content,
              table[style*="width: 900px"] {
                width: 100% !important;
                max-width: 100% !important;
              }
              /* Ensure images scale properly */
              img {
                max-width: 100%;
                height: auto;
              }
              /* Better table formatting for PDF */
              td, th {
                word-wrap: break-word;
              }
            </style>
          </head>
          <body>
            ${emailHtml}
          </body>
          </html>
        `;

        await page.setContent(pdfHtml, { waitUntil: 'networkidle0' });

        // Use scale option to fit content to A4 width
        const pdfUint8Array = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '10mm', bottom: '10mm', left: '5mm', right: '5mm' },
          scale: 0.7, // Scale down to fit 900px content into A4 width
          preferCSSPageSize: false
        });
        await browser.close();

        // Convert Uint8Array to Buffer then to base64 for Resend attachment
        const pdfBuffer = Buffer.from(pdfUint8Array);
        pdfAttachment = {
          filename: `${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule.pdf`,
          content: pdfBuffer
        };
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        // Continue without attachment if PDF generation fails
      }
    }

    // Send single email with all recipients
    const emailResults = [];

    try {
      const emailConfig = {
        from: 'Training Schedule <admin@edwind.ca>',
        to: trainerEmails,
        subject: customSubject || `Training Schedule - ${projectTitle}`,
        html: emailHtml
      };

      // Add PDF attachment if generated
      if (pdfAttachment) {
        emailConfig.attachments = [pdfAttachment];
      }

      // Add CC if provided
      if (ccEmails.length > 0) {
        emailConfig.cc = ccEmails;
      }

      // Add BCC if provided
      if (bccEmails.length > 0) {
        emailConfig.bcc = bccEmails;
      }

      const emailData = await resend.emails.send(emailConfig);

      if (emailData.error) {
        emailResults.push({
          email: trainerEmails.join(', '),
          status: 'failed',
          error: emailData.error.message || 'Email service error'
        });
      } else {
        emailResults.push({
          email: trainerEmails.join(', '),
          status: 'sent',
          emailId: emailData.data?.id || emailData.id
        });
      }
    } catch (error) {
      console.error('Failed to send schedule:', error);
      emailResults.push({
        email: trainerEmails.join(', '),
        status: 'failed',
        error: error.message
      });
    }

    const successCount = emailResults.filter(r => r.status === 'sent').length;
    const totalRecipients = trainerEmails.length + ccEmails.length + bccEmails.length;

    res.status(200).json({
      success: successCount > 0,
      message: successCount > 0
        ? `Schedule sent successfully to ${totalRecipients} recipient(s)`
        : 'Failed to send schedule',
      results: emailResults,
      recipientCount: totalRecipients
    });

  } catch (error) {
    console.error('Error sending trainer schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Generate trainer email HTML from template
 * Shared by both preview and send actions
 */
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

  // Generate groups HTML with real project data - supports multiple rows (4 groups per row)
  const generateGroupsSection = () => {
    if (projectGroups.length === 0) {
      return `
                    <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
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
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;
    }

    // Helper function to generate a single group column
    const generateGroupColumn = (group, index, columnWidth) => {
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
                                                <td class="column column-${(index % 4) + 1}" width="${columnWidth}%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
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
    };

    // Split groups into rows of 4
    const groupsPerRow = 4;
    const rows = [];
    for (let i = 0; i < projectGroups.length; i += groupsPerRow) {
      rows.push(projectGroups.slice(i, i + groupsPerRow));
    }

    // Generate all rows
    return rows.map((rowGroups, rowIndex) => {
      const columnWidth = Math.floor(100 / Math.min(rowGroups.length, groupsPerRow));
      const groupColumns = rowGroups.map((group, colIndex) =>
        generateGroupColumn(group, rowIndex * groupsPerRow + colIndex, columnWidth)
      ).join('');

      return `
                    <table class="row row-4-${rowIndex}" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                ${groupColumns}
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>`;
    }).join('');
  };

  const fullGroupsSection = generateGroupsSection();

  processedTemplate = processedTemplate.replace(/{{#GROUPS_SECTION}}.*?{{\/GROUPS_SECTION}}/gs, fullGroupsSection);

  return processedTemplate;
}
