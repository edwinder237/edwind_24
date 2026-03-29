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

import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { newProject, Projects } = req.body;

    const result = {
      Projects: [newProject, ...Projects]
    };

    return res.status(200).json({ ...result });
  }
});