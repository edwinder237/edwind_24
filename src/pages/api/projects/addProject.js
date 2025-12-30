/**
 * ============================================
 * POST /api/projects/addProject
 * ============================================
 *
 * Mock endpoint - returns client-provided project without persistence.
 * NOTE: This appears to be a legacy client-side optimistic update endpoint.
 * The actual project creation happens in createProject.js with database persistence.
 * FIXED: Added org scope middleware for consistency.
 */

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  const { newProject, Projects } = req.body;

  const result = {
    Projects: [newProject, ...Projects]
  };

  return res.status(200).json({ ...result });
}

export default withOrgScope(asyncHandler(handler));