import { uploadBase64ImageToR2 } from '../../../lib/r2-client-cloudflare';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, fileName, prefix = 'training-recipients' } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }

    // Upload base64 image to R2
    const result = await uploadBase64ImageToR2(image, prefix, fileName);
    
    console.log(`✅ Image uploaded to R2: ${result.key}`);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        r2Key: result.key,
        r2Url: result.url,
        etag: result.etag,
        size: result.size,
        contentType: result.contentType
      }
    });
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
}