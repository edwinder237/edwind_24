import { uploadImageToR2, uploadMultipleImagesToR2 } from '../../../lib/r2-client-cloudflare';

// Helper to convert relative URLs to absolute URLs
function resolveUrl(url, req) {
  if (!url) return url;

  // If it's already an absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For relative URLs (starting with /), construct absolute URL
  if (url.startsWith('/')) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:8081';
    return `${protocol}://${host}${url}`;
  }

  return url;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    let { imageUrl, imageUrls, prefix = 'places' } = req.body;

    // Resolve relative URLs to absolute URLs
    imageUrl = resolveUrl(imageUrl, req);
    if (imageUrls && Array.isArray(imageUrls)) {
      imageUrls = imageUrls.map(url => resolveUrl(url, req));
    }

    // Validate input
    if (!imageUrl && (!imageUrls || !Array.isArray(imageUrls))) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Either imageUrl (string) or imageUrls (array) is required'
      });
    }

    // Handle single image upload
    if (imageUrl) {
      try {
        const result = await uploadImageToR2(imageUrl, prefix);
        
        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully',
          data: {
            originalUrl: imageUrl,
            r2Url: result.url,
            r2Key: result.key,
            etag: result.etag,
            size: result.size,
            contentType: result.contentType
          }
        });
      } catch (error) {
        console.error('❌ Image upload failed:', error.message);
        return res.status(500).json({
          success: false,
          error: 'Upload failed',
          message: error.message
        });
      }
    }

    // Handle multiple images upload
    if (imageUrls && imageUrls.length > 0) {
      try {
        // Limit to 10 images at a time to prevent overload
        const limitedUrls = imageUrls.slice(0, 10);
        const results = await uploadMultipleImagesToR2(limitedUrls, prefix);
        
        // Format results with better error handling
        const uploadResults = limitedUrls.map((originalUrl, index) => {
          const result = results[index];
          return {
            originalUrl,
            success: result !== null,
            r2Url: result?.url || null,
            r2Key: result?.key || null,
            etag: result?.etag || null,
            size: result?.size || null,
            error: result === null ? 'Upload failed' : null
          };
        });

        const successCount = uploadResults.filter(r => r.success).length;
        const failureCount = uploadResults.length - successCount;

        return res.status(200).json({
          success: true,
          message: `Batch upload completed: ${successCount}/${uploadResults.length} successful`,
          data: {
            results: uploadResults,
            summary: {
              total: uploadResults.length,
              successful: successCount,
              failed: failureCount,
              successRate: Math.round((successCount / uploadResults.length) * 100)
            }
          }
        });
      } catch (error) {
        console.error('❌ Batch image upload failed:', error.message);
        return res.status(500).json({
          success: false,
          error: 'Batch upload failed',
          message: error.message
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid request',
      message: 'No valid image URLs provided'
    });

  } catch (error) {
    console.error('❌ API error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}