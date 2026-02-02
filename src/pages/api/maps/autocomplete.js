/**
 * Google Maps Places Autocomplete Proxy
 *
 * Proxies requests to Google Maps Places API for usage tracking.
 * GET /api/maps/autocomplete?input=...&sessionToken=...
 */

import { logUsage, PROVIDERS, getOrgIdFromUser } from '../../../lib/usage/usageLogger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, sessionToken, types, components } = req.query;
  const userId = req.cookies?.workos_user_id;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Get user's organization for usage tracking
  const organizationId = await getOrgIdFromUser(userId);

  if (!input) {
    return res.status(400).json({ error: 'Input parameter is required' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Maps API key not configured' });
  }

  const startTime = Date.now();

  try {
    // Build query parameters
    const params = new URLSearchParams({
      input,
      key: apiKey
    });

    if (sessionToken) params.append('sessiontoken', sessionToken);
    if (types) params.append('types', types);
    if (components) params.append('components', components);

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    );

    const data = await response.json();
    const durationMs = Date.now() - startTime;

    // Log usage (fire-and-forget)
    logUsage({
      provider: PROVIDERS.MAPS,
      action: 'autocomplete',
      organizationId,
      userId,
      inputSize: input.length,
      outputSize: data.predictions?.length || 0,
      durationMs,
      success: data.status === 'OK' || data.status === 'ZERO_RESULTS',
      errorCode: data.status !== 'OK' && data.status !== 'ZERO_RESULTS' ? data.status : null
    });

    return res.status(200).json(data);
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log failed usage
    logUsage({
      provider: PROVIDERS.MAPS,
      action: 'autocomplete',
      organizationId,
      userId,
      inputSize: input?.length || 0,
      durationMs,
      success: false,
      errorCode: error.message?.slice(0, 100)
    });

    console.error('[Maps Proxy] Autocomplete error:', error);
    return res.status(500).json({ error: 'Maps API error', status: 'REQUEST_DENIED' });
  }
}
