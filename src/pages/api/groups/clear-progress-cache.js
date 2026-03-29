const { clearProgressCacheForProject } = require('../../../utils/progressCache');
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Clear the progress cache for this project
    clearProgressCacheForProject(projectId);

    res.status(200).json({
      success: true,
      message: 'Progress cache cleared successfully'
    });
  }
});