/**
 * Email Templates Index
 *
 * Export all email templates from a single entry point
 */

// Event/Calendar invite templates
export {
  generateEventInviteTemplate,
  generateScheduleSummaryTemplate
} from './eventInvite';

// Credentials template
export { generateCredentialsTemplate } from './credentials';

// Module link template
export { generateModuleLinkTemplate } from './moduleLink';

// Feedback template
export { generateFeedbackTemplate } from './feedback';

// Contact form templates
export {
  generateContactAdminTemplate,
  generateContactAutoReplyTemplate
} from './contact';
