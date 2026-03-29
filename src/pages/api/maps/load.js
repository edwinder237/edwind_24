/**
 * Google Maps Load Tracking
 *
 * POST /api/maps/load
 * Tracks when a Google Map is loaded/displayed
 */

import { createHandler } from '../../../lib/api/createHandler';
import { logUsage, PROVIDERS, getOrgIdFromUser } from '../../../lib/usage/usageLogger';

// Google Maps Dynamic Maps pricing
const MAPS_LOAD_COST = 0.007; // $7 per 1000 loads = $0.007 per load

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const userId = req.cookies?.workos_user_id;
    const { page } = req.body; // Optional: which page the map was loaded on

    // Get user's organization for usage tracking
    const organizationId = await getOrgIdFromUser(userId);

    // Log the map load
    logUsage({
      provider: PROVIDERS.MAPS,
      action: 'map_load',
      organizationId,
      userId,
      inputSize: 1, // 1 map load
      success: true
    });

    return res.status(200).json({ tracked: true });
  }
});
