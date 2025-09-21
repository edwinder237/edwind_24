import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Resend } from 'resend';
import prisma from '../../../lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY || 're_FuWEsP4t_57FGZEkUyxct65xaqCYXvQGG');

// Rate limiting: 2 requests per second = 500ms delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
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
                                                            <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
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
                    <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                {{#GROUPS}}
                                                <td class="column column-{{GROUP_INDEX}}" width="25%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:10px;">
                                                                <div style="color:#000000;direction:ltr;font-family:'Ubuntu', Tahoma, Verdana, Segoe, sans-serif;font-size:20px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:24px;">
                                                                    <p style="margin: 0;"><strong>{{GROUP_NAME}}</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="list_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:15px;padding-left:60px;padding-right:10px;">
                                                                {{#PARTICIPANTS}}
                                                                <ul start="1" style="margin: 0; padding: 0; margin-left: 20px; list-style-type: revert; color: #000000; direction: ltr; font-family: 'Ubuntu', Tahoma, Verdana, Segoe, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;">
                                                                    <li style="margin-bottom: 0px;">{{PARTICIPANT_NAME}}</li>
                                                                </ul>
                                                                {{/PARTICIPANTS}}
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                {{/GROUPS}}
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {{/GROUPS_SECTION}}

                    <!-- Schedule Days -->
                    {{#SCHEDULE_DAYS}}
                    <table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
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
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="25%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-top:10px;">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 18px; color: #2d2d2d; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 21px;">{{MONTH}}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 18px; color: #2d2d2d; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 42px;"><span style="font-size:28px;"><strong>{{DAY}}</strong></span></p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="text_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:10px;padding-left:5px;padding-right:5px;padding-top:5px;">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 18px; color: #2d2d2d; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 21px;">{{DAY_NAME}}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td class="column column-2" width="50%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-left: 15px; padding-right: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:10px;">
                                                                <div style="color:#cc0a0a;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;"><strong>Agenda</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    
                                                    {{#EVENTS}}
                                                    <table class="paragraph_block block-3" width="100%" border="0" cellpadding="5" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div style="color:#000000;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;"><strong>{{EVENT_TIME}}</strong> {{EVENT_TITLE}} <strong>{{EVENT_GROUPS}}</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    {{/EVENTS}}
                                                </td>
                                                <td class="column column-3" width="25%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:10px;padding-left:10px;padding-right:10px;padding-top:15px;">
                                                                <div style="color:#000000;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;"><strong>Focus of the day</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="paragraph_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:15px;padding-left:10px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#000000;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;">Sample focus content</p>
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
    const { projectId, projectTitle, events, dailyFocusData, trainerEmails, customTemplate, templateType, includeEventSummaries = true } = req.body;

    if (!projectId || !trainerEmails || !Array.isArray(trainerEmails) || trainerEmails.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: projectId and trainerEmails' });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'No events to send schedule for' });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = trainerEmails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ 
        message: `Invalid email addresses: ${invalidEmails.join(', ')}` 
      });
    }

    // Send emails to each trainer
    const emailResults = [];
    
    for (const trainerEmail of trainerEmails) {
      try {
        // Always use the professional CM360 template for trainer emails
        const templateToUse = getDefaultProfessionalTemplate();
        
        const emailHtml = await generateTrainerEmailFromTemplate({
          template: templateToUse,
          projectTitle,
          projectId,
          events,
          trainerEmail,
          includeEventSummaries
        });

        const emailData = await resend.emails.send({
          from: 'EDWIND Training Schedule <admin@edwind.ca>',
          to: [trainerEmail],
          subject: `Training Schedule - ${projectTitle}`,
          html: emailHtml
        });

        // Rate limiting delay
        await delay(RATE_LIMIT_DELAY);

        if (emailData.error) {
          emailResults.push({
            email: trainerEmail,
            status: 'failed',
            error: emailData.error.message || 'Email service error'
          });
        } else {
          emailResults.push({
            email: trainerEmail,
            status: 'sent',
            emailId: emailData.data?.id || emailData.id
          });
        }
        
      } catch (error) {
        console.error(`Failed to send schedule to ${trainerEmail}:`, error);
        emailResults.push({
          email: trainerEmail,
          status: 'failed',
          error: error.message
        });
      }
    }

    const successCount = emailResults.filter(r => r.status === 'sent').length;
    const failureCount = emailResults.filter(r => r.status === 'failed').length;

    res.status(200).json({
      success: successCount > 0,
      message: `Schedule emails processed: ${successCount} sent, ${failureCount} failed`,
      results: emailResults,
      recipientCount: successCount
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

async function generateTrainerEmailFromTemplate({ template, projectTitle, projectId, events, trainerEmail, includeEventSummaries = true }) {
  let processedTemplate = template;
  
  // Fetch project groups and participants
  let projectGroups = [];
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
        }
      }
    });
    projectGroups = project?.groups || [];
  } catch (error) {
    console.error('Error fetching project groups:', error);
  }
  
  // Template variables - using same format as participant emails
  const variables = {
    '{{PROJECT_TITLE}}': projectTitle,
    '{{PARTICIPANT_NAME}}': `Trainer`, // Generic trainer greeting
    '{{GROUP_NAME}}': 'All Groups', // Trainers see all groups
    '{{EVENT_TITLE}}': events.length > 0 ? events[0].title : 'Training Events',
    '{{COURSE_TITLE}}': events.length > 0 ? events[0].course?.title || '' : '',
    '{{EVENT_DATE}}': events.length > 0 ? format(new Date(events[0].start), 'EEEE, MMMM d, yyyy', { locale: fr }) : '',
    '{{EVENT_TIME}}': events.length > 0 ? format(new Date(events[0].start), 'HH:mm') : '',
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
    // Group events by date
    const eventsByDate = events.reduce((acc, evt) => {
      const date = format(new Date(evt.start), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(evt);
      return acc;
    }, {});

    // Sort dates and generate schedule days HTML
    const sortedDates = Object.keys(eventsByDate).sort();
    const scheduleDaysHtml = sortedDates.map(dateKey => {
      const dayEvents = eventsByDate[dateKey];
      const date = new Date(dateKey + 'T12:00:00');
      const month = format(date, 'MMM', { locale: fr }).toUpperCase();
      const day = format(date, 'dd');
      const dayName = format(date, 'EEEE', { locale: fr }).toUpperCase();
      
      // Sort events by start time
      const sortedDayEvents = dayEvents.sort((a, b) => {
        const startA = new Date(a.start);
        const startB = new Date(b.start);
        return startA - startB;
      });
      
      const eventsHtml = sortedDayEvents.map(evt => {
        const timeRange = format(new Date(evt.start), 'HH:mm');
        const groups = evt.event_groups?.map(eg => eg.groups?.groupName).filter(Boolean).join(', ');
        
        return `
                                                    <table class="paragraph_block block-3" width="100%" border="0" cellpadding="5" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div style="color:#000000;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;"><strong>${timeRange}</strong> ${evt.title} ${groups ? `<strong>${groups}</strong>` : ''}</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>`;
      }).join('');
      
      return `
                    <table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
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
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 900px;" width="900">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="25%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-top:10px;">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 18px; color: #2d2d2d; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 21px;">${month}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 18px; color: #2d2d2d; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 42px;"><span style="font-size:28px;"><strong>${day}</strong></span></p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="text_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:10px;padding-left:5px;padding-right:5px;padding-top:5px;">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; mso-line-height-alt: 18px; color: #2d2d2d; line-height: 1.5; font-family: Ubuntu, Tahoma, Verdana, Segoe, sans-serif;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 21px;">${dayName}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td class="column column-2" width="50%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-left: 15px; padding-right: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:10px;">
                                                                <div style="color:#cc0a0a;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;"><strong>Schedule</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    ${eventsHtml}
                                                </td>
                                                <td class="column column-3" width="25%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                    <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:10px;padding-left:10px;padding-right:10px;padding-top:15px;">
                                                                <div style="color:#000000;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;"><strong>Focus of the day</strong></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="paragraph_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:15px;padding-left:10px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#000000;direction:ltr;font-family:Ubuntu, Tahoma, Verdana, Segoe, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0;">Available on training day</p>
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

    // Generate group columns dynamically - show all groups without contact info
    const maxGroups = Math.min(projectGroups.length, 4);
    const columnWidth = Math.floor(100 / maxGroups); // Equal width for all groups
    
    return projectGroups.slice(0, maxGroups).map((group, index) => {
      const participants = group.participants || [];
      const participantsList = participants.map(p => {
        // Navigate through the nested relationship: group_participants -> project_participants -> participants
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
  
  // Handle the full groups section wrapper
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

function generateDefaultTrainerTemplate({ projectTitle, events, dailyFocusData, trainerEmail, includeEventSummaries = true }) {
  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = format(new Date(event.start), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  const scheduleHtml = Object.entries(eventsByDate).map(([dateKey, dayEvents]) => {
    const eventDate = new Date(dateKey + 'T12:00:00');
    const dayEvents_sorted = dayEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    const eventsHtml = dayEvents_sorted.map(event => {
      const startTime = format(new Date(event.start), 'HH:mm');
      const endTime = event.end ? format(new Date(event.end), 'HH:mm') : '';
      const groups = event.event_groups?.map(eg => eg.groups?.groupName).filter(Boolean).join(', ');
      const hasDescription = includeEventSummaries && event.description;
      
      return `
        <tr style="border-bottom: 1px solid #e1e5e9;">
          <td style="padding: 8px 12px; background-color: #f8f9fa; vertical-align: top;">
            <strong>${startTime}${endTime ? ` - ${endTime}` : ''}</strong>
          </td>
          <td style="padding: 8px 12px;">
            <strong>${event.title}</strong>
            ${event.course?.title ? `<br><span style="color: #6c757d;">${event.course.title}</span>` : ''}
            ${groups ? `<br><span style="color: #0d6efd;">${groups}</span>` : ''}
            ${hasDescription ? `<br><div style="margin-top: 8px; padding: 8px; background-color: #f8f9fa; border-radius: 4px; font-size: 13px; color: #495057; border-left: 3px solid #007bff;"><strong>Description:</strong> ${event.description}</div>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    const dailyFocus = dailyFocusData[dateKey];

    return `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 8px;">
          ${format(eventDate, 'EEEE, MMMM d, yyyy', { locale: fr })}
        </h3>
        ${dailyFocus ? `
          <div style="background-color: #e3f2fd; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
            <strong>🎯 Focus of the day:</strong> ${dailyFocus}
          </div>
        ` : ''}
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #dee2e6;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; width: 150px;">Time</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Event</th>
            </tr>
          </thead>
          <tbody>
            ${eventsHtml}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Training Schedule - ${projectTitle}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📅 Training Schedule</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">${projectTitle}</p>
      </div>

      <div style="background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e1e5e9; margin-bottom: 20px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Dear Trainer,
        </p>
        
        <p style="color: #6c757d; margin-bottom: 25px;">
          Please find the complete training schedule for <strong>${projectTitle}</strong> below. This schedule includes all events, timings, and group assignments for your reference.
        </p>

        ${scheduleHtml}

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 16px; margin: 25px 0;">
          <h3 style="margin: 0 0 8px 0; color: #0c5460; font-size: 16px;">📋 Important Notes</h3>
          <ul style="margin: 8px 0; padding-left: 20px; color: #0c5460;">
            <li>Total events: ${events.length}</li>
            <li>Please review the schedule and prepare accordingly</li>
            <li>Contact project management if you have any questions</li>
            <li>Venue details will be provided separately if not specified</li>
          </ul>
        </div>

        <p style="color: #6c757d; margin-top: 25px;">
          Thank you for your participation in this training program.
        </p>
      </div>

      <div style="text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e1e5e9; padding-top: 20px;">
        <p style="margin: 0;">
          Generated by EDWIND Training Management System<br>
          Please do not reply to this email.
        </p>
      </div>

    </body>
    </html>
  `;
}