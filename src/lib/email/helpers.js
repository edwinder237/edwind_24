/**
 * Email Helpers
 *
 * Shared utility functions for email operations
 */

import prisma from '../prisma';

/**
 * Generate a unique message ID to prevent Gmail from collapsing similar emails
 * @param {string} prefix - Prefix for the message ID (e.g., 'credentials', 'invite')
 * @param {string|number} id - Unique identifier (e.g., participant ID)
 * @returns {string} Unique message ID
 */
export function generateUniqueMessageId(prefix = 'email', id = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}-${id}-${timestamp}-${random}@edwind.ca`;
}

/**
 * Create email headers that prevent Gmail from collapsing similar emails
 * @param {string} prefix - Prefix for the message ID
 * @param {string|number} id - Unique identifier
 * @returns {Object} Headers object
 */
export function createAntiCollapseHeaders(prefix = 'email', id = '') {
  const messageId = generateUniqueMessageId(prefix, id);
  return {
    'Message-ID': messageId,
    'X-Entity-Ref-ID': messageId
  };
}

/**
 * Fetch organization logo URL from database
 * @param {number} organizationId - The organization ID
 * @returns {Promise<string|null>} Logo URL or null
 */
export async function fetchOrganizationLogo(organizationId) {
  if (!organizationId) return null;

  try {
    const org = await prisma.organizations.findUnique({
      where: { id: organizationId },
      select: { logo_url: true }
    });
    return org?.logo_url || null;
  } catch (error) {
    console.error('Error fetching organization logo:', error);
    return null;
  }
}

/**
 * Fetch organization details including logo
 * @param {number} organizationId - The organization ID
 * @returns {Promise<Object|null>} Organization details or null
 */
export async function fetchOrganizationDetails(organizationId) {
  if (!organizationId) return null;

  try {
    const org = await prisma.organizations.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        title: true,
        logo_url: true
      }
    });
    return org;
  } catch (error) {
    console.error('Error fetching organization details:', error);
    return null;
  }
}

/**
 * Format a recipient name from first and last name
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} fallback - Fallback if both names are empty
 * @returns {string} Formatted name
 */
export function formatRecipientName(firstName, lastName, fallback = 'Participant') {
  const name = `${firstName || ''} ${lastName || ''}`.trim();
  return name || fallback;
}

/**
 * Create hidden content to prevent Gmail from collapsing emails
 * This generates unique invisible content that makes each email unique
 * @param {string} context - Context string (e.g., participant name)
 * @returns {string} HTML for hidden unique content
 */
export function createHiddenUniqueContent(context = '') {
  const timestamp = new Date().toISOString();
  const uniqueId = Math.random().toString(36).substring(2, 15);

  return `
    <!-- Unique content to prevent Gmail threading/collapsing -->
    <div style="display: none; opacity: 0; color: transparent; height: 0; width: 0; font-size: 0; line-height: 0; max-height: 0; max-width: 0; mso-hide: all;">
      ${context.replace(/\s+/g, '-')}-${uniqueId}-${timestamp}-${Math.random().toString(36).substring(2, 15)}
    </div>
    <!-- Additional unique preheader text -->
    <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      ${context} - Generated on ${new Date().toLocaleString()} - ID: ${uniqueId}
    </div>
  `;
}

/**
 * Escape special characters for safe HTML output
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert newlines to HTML breaks
 * @param {string} text - Text with newlines
 * @returns {string} Text with <br> tags
 */
export function nl2br(text) {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
}
