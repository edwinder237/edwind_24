import { createId } from '@paralleldrive/cuid2';

// R2 Configuration with your credentials
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'bdd838062a3ffeafbc786b5bfbef14b8';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '8f5c92b0b898401456006e72942bb8123e2a05c487709a7e3cf59be46a48426b';
const R2_TOKEN = process.env.R2_TOKEN || 'UQEAEo20xjkvrBnDpWzfVXZ_KQGHoYpf1XgKTA7p';
const BUCKET_NAME = 'edwindblobs';
const PUBLIC_URL_BASE = 'https://923f49e1995e9f5e3f85d8b7ea48047a.r2.cloudflarestorage.com/edwindblobs';

/**
 * Upload an image from a URL to R2 bucket using AWS SDK
 * @param {string} imageUrl - The source image URL (e.g., Google Maps image)
 * @param {string} prefix - Optional prefix for the filename (e.g., 'projects', 'places')
 * @returns {Promise<{url: string, key: string}>} - The R2 URL and key of the uploaded image
 */
export async function uploadImageToR2(imageUrl, prefix = 'images') {
  try {
    console.log('Fetching image from:', imageUrl);
    
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
    const key = `${prefix}/${createId()}.${fileExtension}`;
    
    console.log('Uploading to R2 with key:', key);
    
    // Upload to R2
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(imageBuffer),
      ContentType: contentType,
      ACL: 'public-read', // Make the image publicly accessible
      CacheControl: 'max-age=31536000', // 1 year cache
    };

    const uploadResult = await r2Client.upload(uploadParams).promise();
    
    // Return the public URL (using our custom domain structure)
    const publicUrl = `${PUBLIC_URL_BASE}/${key}`;
    
    console.log('Image uploaded successfully to:', publicUrl);
    
    return {
      url: publicUrl,
      key: key,
      etag: uploadResult.ETag
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
 * Delete an image from R2 bucket
 * @param {string} key - The R2 key of the image to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteImageFromR2(key) {
  try {
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await r2Client.deleteObject(deleteParams).promise();
    console.log('Image deleted successfully from R2:', key);
    return true;
  } catch (error) {
    console.error('Error deleting image from R2:', error);
    return false;
  }
}

/**
 * Check if an image exists in R2 bucket
 * @param {string} key - The R2 key to check
 * @returns {Promise<boolean>} - Whether the image exists
 */
export async function imageExistsInR2(key) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await r2Client.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    console.error('Error checking image existence in R2:', error);
    return false;
  }
}

/**
 * Generate a pre-signed URL for uploading directly to R2
 * @param {string} key - The key for the object
 * @param {string} contentType - The content type of the object
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - Pre-signed upload URL
 */
export async function generatePresignedUploadUrl(key, contentType, expiresIn = 3600) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn,
      ACL: 'public-read'
    };

    const uploadUrl = await r2Client.getSignedUrlPromise('putObject', params);
    return uploadUrl;
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw error;
  }
}