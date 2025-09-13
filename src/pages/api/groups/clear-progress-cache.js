const { clearProgressCacheForProject } = require('../../../utils/progressCache');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { projectId } = req.body;

  try {
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Clear the progress cache for this project
    clearProgressCacheForProject(projectId);

    res.status(200).json({ 
      success: true, 
      message: 'Progress cache cleared successfully' 
    });
  } catch (error) {
    console.error('[clear-progress-cache] Error:', error);
    res.status(500).json({ 
      error: "Internal Server Error",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
}