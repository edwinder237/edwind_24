import { uploadBase64ImageToR2 } from '../../../lib/r2-client-cloudflare';
import { createHandler } from '../../../lib/api/createHandler';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { image, fileName, prefix = 'training-recipients' } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }

    // Upload base64 image to R2
    const result = await uploadBase64ImageToR2(image, prefix, fileName);

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
  }
});