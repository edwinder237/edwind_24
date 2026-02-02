/**
 * Google Maps Place Details Proxy
 *
 * Proxies requests to Google Maps Places API for usage tracking.
 * GET /api/maps/place-details?placeId=...&sessionToken=...
 */

import { logUsage, PROVIDERS, getOrgIdFromUser } from '../../../lib/usage/usageLogger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { placeId, sessionToken, fields } = req.query;
  const userId = req.cookies?.workos_user_id;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Get user's organization for usage tracking
  const organizationId = await getOrgIdFromUser(userId);

  if (!placeId) {
    return res.status(400).json({ error: 'placeId parameter is required' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Maps API key not configured' });
  }

  const startTime = Date.now();

  try {
    // Build query parameters
    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey
    });

    if (sessionToken) params.append('sessiontoken', sessionToken);
    if (fields) {
      params.append('fields', fields);
    } else {
      // Default fields
      params.append('fields', 'place_id,formatted_address,name,geometry,address_components');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );

    const data = await response.json();
    const durationMs = Date.now() - startTime;

    // Log usage (fire-and-forget)
    logUsage({
      provider: PROVIDERS.MAPS,
      action: 'place_details',
      organizationId,
      userId,
      inputSize: 1,
      durationMs,
      success: data.status === 'OK',
      errorCode: data.status !== 'OK' ? data.status : null
    });

    return res.status(200).json(data);
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log failed usage
    logUsage({
      provider: PROVIDERS.MAPS,
      action: 'place_details',
      organizationId,
      userId,
      inputSize: 1,
      durationMs,
      success: false,
      errorCode: error.message?.slice(0, 100)
    });

    console.error('[Maps Proxy] Place details error:', error);
    return res.status(500).json({ error: 'Maps API error', status: 'REQUEST_DENIED' });
  }
}
