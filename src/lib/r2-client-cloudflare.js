import { createId } from '@paralleldrive/cuid2';

// Cloudflare R2 Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '923f49e1995e9f5e3f85d8b7ea48047a';
const R2_TOKEN = process.env.R2_TOKEN || 'UQEAEo20xjkvrBnDpWzfVXZ_KQGHoYpf1XgKTA7p';
const BUCKET_NAME = 'edwindblobs';
const PUBLIC_URL_BASE = `https://pub-34f9e757e51b451ea7060249e757957c.r2.dev`;

// Optimized file extension mapping
const CONTENT_TYPE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg'
};

/**
 * Upload an image from a URL to R2 bucket using Cloudflare API
 * @param {string} imageUrl - The source image URL (e.g., Google Maps image)
 * @param {string} prefix - Optional prefix for the filename (default: 'images')
 * @returns {Promise<{url: string, key: string, etag?: string}>} - The R2 URL and metadata
 */
export async function uploadImageToR2(imageUrl, prefix = 'images') {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('Invalid image URL provided');
  }

  try {
    // Fetch image with optimized headers and timeout
    const fetchResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EDWIND/1.0; +https://edwind.app)',
        'Accept': 'image/*',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(30000)
    });
    
    if (!fetchResponse.ok) {
      const statusText = fetchResponse.status === 403 
        ? 'Image URL expired or access forbidden' 
        : fetchResponse.statusText;
      throw new Error(`HTTP ${fetchResponse.status}: ${statusText}`);
    }

    const imageBuffer = await fetchResponse.arrayBuffer();
    const contentType = fetchResponse.headers.get('content-type') || 'image/jpeg';
    const fileSize = imageBuffer.byteLength;
    
    // Validate image size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      throw new Error(`Image too large: ${Math.round(fileSize / 1024 / 1024)}MB (max 10MB)`);
    }
    
    // Generate unique filename
    const fileExtension = CONTENT_TYPE_EXTENSIONS[contentType] || 'jpg';
    const key = `${prefix}/${createId()}.${fileExtension}`;
    
    // Upload to R2 using Cloudflare API
    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${key}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${R2_TOKEN}`,
          'Content-Type': contentType,
        },
        body: imageBuffer
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`R2 upload failed (${uploadResponse.status}): ${errorText}`);
    }

    const publicUrl = `${PUBLIC_URL_BASE}/${key}`;
    console.log(`✅ Image uploaded successfully: ${key} (${Math.round(fileSize / 1024)}KB)`);
    
    return {
      url: publicUrl,
      key: key,
      etag: uploadResponse.headers.get('etag'),
      size: fileSize,
      contentType
    };

  } catch (error) {
    console.error(`❌ R2 upload failed for ${imageUrl}:`, error.message);
    throw new Error(`Failed to upload image to R2: ${error.message}`);
  }
}

/**
 * Upload multiple images to R2 bucket with concurrency control
 * @param {Array<string>} imageUrls - Array of source image URLs
 * @param {string} prefix - Optional prefix for filenames (default: 'images')
 * @param {number} concurrency - Maximum concurrent uploads (default: 3)
 * @returns {Promise<Array<{url: string, key: string} | null>>} - Array of R2 upload results
 */
export async function uploadMultipleImagesToR2(imageUrls, prefix = 'images', concurrency = 3) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return [];
  }

  // Process uploads in batches to avoid overwhelming the API
  const results = [];
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchPromises = batch.map(async (url, index) => {
      try {
        const result = await uploadImageToR2(url, prefix);
        console.log(`✅ Batch upload ${i + index + 1}/${imageUrls.length} completed`);
        return result;
      } catch (error) {
        console.error(`❌ Batch upload ${i + index + 1}/${imageUrls.length} failed:`, error.message);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Delete an image from R2 bucket
 * @param {string} key - The R2 key of the image to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteImageFromR2(key) {
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid key provided for deletion');
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${key}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${R2_TOKEN}`
        }
      }
    );

    if (response.ok) {
      console.log(`✅ Image deleted successfully: ${key}`);
      return true;
    } else {
      console.error(`❌ Failed to delete image: ${key} (${response.status})`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting image ${key}:`, error.message);
    return false;
  }
}

/**
 * Check if an image exists in R2 bucket
 * @param {string} key - The R2 key to check
 * @returns {Promise<boolean>} - Whether the image exists
 */
export async function imageExistsInR2(key) {
  if (!key || typeof key !== 'string') {
    return false;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${key}`,
      {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${R2_TOKEN}`
        }
      }
    );

    return response.ok;
  } catch (error) {
    console.error(`❌ Error checking image existence ${key}:`, error.message);
    return false;
  }
}