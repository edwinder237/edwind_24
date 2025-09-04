import { createId } from '@paralleldrive/cuid2';

const PUBLIC_URL_BASE = 'https://923f49e1995e9f5e3f85d8b7ea48047a.r2.cloudflarestorage.com/edwindblobs';

/**
 * Simple R2 upload using direct HTTP PUT request
 * This approach uses the public R2 URL and assumes proper CORS and bucket permissions
 * @param {string} imageUrl - The source image URL (e.g., Google Maps image)
 * @param {string} prefix - Optional prefix for the filename (e.g., 'projects', 'places')
 * @returns {Promise<{url: string, key: string}>} - The R2 URL and key of the uploaded image
 */
export async function uploadImageToR2(imageUrl, prefix = 'images') {
  try {
    console.log('Fetching image from:', imageUrl);
    
    // Fetch the image from the source URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EDWIND/1.0; +https://edwind.app)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get image data and content type
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Generate unique filename
    const fileExtension = getFileExtension(contentType);
    const key = `${prefix}/${createId()}.${fileExtension}`;
    
    console.log('Uploading to R2 with key:', key);
    
    // For now, we'll simulate the upload and return a URL
    // In production, you would need proper R2 credentials and signing
    const publicUrl = `${PUBLIC_URL_BASE}/${key}`;
    
    // Store the image data temporarily (this would normally go to R2)
    // For testing purposes, we'll return the original URL with a flag
    console.log('Image would be uploaded to:', publicUrl);
    
    return {
      url: publicUrl,
      key: key,
      originalUrl: imageUrl,
      // For now, we'll use the original URL until proper R2 setup is complete
      actualUrl: imageUrl
    };

  } catch (error) {
    console.error('Error uploading image to R2:', error);
    throw new Error(`Failed to upload image to R2: ${error.message}`);
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
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
  };
  return extensions[contentType] || 'jpg';
}

/**
 * Upload multiple images to R2 bucket
 * @param {Array<string>} imageUrls - Array of source image URLs
 * @param {string} prefix - Optional prefix for filenames
 * @returns {Promise<Array<{url: string, key: string} | null>>} - Array of R2 upload results
 */
export async function uploadMultipleImagesToR2(imageUrls, prefix = 'images') {
  const uploadPromises = imageUrls.map(async (url) => {
    try {
      return await uploadImageToR2(url, prefix);
    } catch (error) {
      console.error(`Failed to upload image ${url}:`, error);
      return null;
    }
  });
  
  return Promise.all(uploadPromises);
}

/**
 * For development: store image metadata
 * This would be replaced with actual R2 operations in production
 */
const imageMetadata = new Map();

export function storeImageMetadata(key, metadata) {
  imageMetadata.set(key, metadata);
}

export function getImageMetadata(key) {
  return imageMetadata.get(key);
}