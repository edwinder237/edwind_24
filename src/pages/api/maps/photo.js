/**
 * Google Maps Place Photo Proxy
 *
 * Proxies requests to Google Maps Place Photos API.
 * GET /api/maps/photo?photoReference=...&maxWidth=...
 */

import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { photoReference, maxWidth = 800 } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!photoReference) {
      return res.status(400).json({ error: 'photoReference parameter is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Maps API key not configured' });
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;

    const response = await fetch(photoUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch photo' });
    }

    // Get the content type and image data
    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();

    // Set appropriate headers
    res.setHeader('Content-Type', contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    return res.send(Buffer.from(buffer));
  }
});
