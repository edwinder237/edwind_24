import { createId } from '@paralleldrive/cuid2';

// R2 Bucket configuration
const R2_BUCKET_URL = 'https://923f49e1995e9f5e3f85d8b7ea48047a.r2.cloudflarestorage.com/edwindblobs';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_REGION = process.env.R2_REGION || 'auto';

/**
 * Upload an image from a URL to R2 bucket
 * @param {string} imageUrl - The source image URL (e.g., Google Maps image)
 * @param {string} prefix - Optional prefix for the filename (e.g., 'projects', 'places')
 * @returns {Promise<string>} - The R2 URL of the uploaded image
 */
export async function uploadImageToR2(imageUrl, prefix = 'images') {
  try {
    // Fetch the image from the source URL
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get image data and content type
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Generate unique filename
    const fileExtension = getFileExtension(contentType);
    const filename = `${prefix}/${createId()}.${fileExtension}`;
    
    // Upload to R2 using PUT request
    const uploadResponse = await fetch(`${R2_BUCKET_URL}/${filename}`, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Authorization': createAuthHeader('PUT', filename),
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to R2: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Return the public URL
    const publicUrl = `${R2_BUCKET_URL}/${filename}`;
    return publicUrl;

  } catch (error) {
    console.error('Error uploading image to R2:', error);
    throw error;
  }
}

/**
 * Get file extension from content type
 */
function getFileExtension(contentType) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  return extensions[contentType] || 'jpg';
}

/**
 * Create AWS Signature Version 4 authorization header
 * This is a simplified version - for production, consider using AWS SDK
 */
function createAuthHeader(method, path) {
  // For simplicity, we'll use a basic approach
  // In production, you should use proper AWS SigV4 signing
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials not configured. Please set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY environment variables.');
  }
  
  // This is a placeholder - you should implement proper AWS SigV4 signing
  // For now, we'll use the credentials directly (not recommended for production)
  const credentials = Buffer.from(`${R2_ACCESS_KEY_ID}:${R2_SECRET_ACCESS_KEY}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Upload multiple images to R2 bucket
 * @param {Array<string>} imageUrls - Array of source image URLs
 * @param {string} prefix - Optional prefix for filenames
 * @returns {Promise<Array<string>>} - Array of R2 URLs
 */
export async function uploadMultipleImagesToR2(imageUrls, prefix = 'images') {
  const uploadPromises = imageUrls.map(url => uploadImageToR2(url, prefix));
  return Promise.allSettled(uploadPromises).then(results => 
    results.map(result => result.status === 'fulfilled' ? result.value : null)
  );
}

/**
 * Delete an image from R2 bucket
 * @param {string} r2Url - The R2 URL of the image to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteImageFromR2(r2Url) {
  try {
    const filename = r2Url.replace(`${R2_BUCKET_URL}/`, '');
    
    const response = await fetch(`${R2_BUCKET_URL}/${filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': createAuthHeader('DELETE', filename),
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting image from R2:', error);
    return false;
  }
}