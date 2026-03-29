import { createId } from '@paralleldrive/cuid2';
import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';
import { logUsage, PROVIDERS } from '../../../lib/usage/usageLogger';

// Cloudflare R2 Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '923f49e1995e9f5e3f85d8b7ea48047a';
const R2_TOKEN = process.env.R2_TOKEN || 'UQEAEo20xjkvrBnDpWzfVXZ_KQGHoYpf1XgKTA7p';
const BUCKET_NAME = 'edwindblobs';
const PUBLIC_URL_BASE = `https://pub-34f9e757e51b451ea7060249e757957c.r2.dev`;

export default createHandler({
  scope: 'admin',
  POST: async (req, res) => {
    const { userId: workosUserId } = req.orgContext;

    const { imageData, contentType, organizationId } = req.body;

    if (!imageData || !contentType) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid image type. Only JPEG, PNG, WebP, and SVG are allowed.' });
    }

    const buffer = Buffer.from(imageData, 'base64');

    const maxSize = 2 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({ error: 'Image size must be less than 2MB' });
    }

    const fileExtension = contentType.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    const fileName = `organizations/${organizationId || createId()}_${Date.now()}.${fileExtension}`;

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${fileName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${R2_TOKEN}`,
          'Content-Type': contentType,
        },
        body: buffer
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('R2 upload error:', errorText);
      throw new Error(`Failed to upload to R2: ${uploadResponse.status}`);
    }

    const logoUrl = `${PUBLIC_URL_BASE}/${fileName}`;
    console.log('Logo uploaded successfully:', logoUrl);

    logUsage({
      provider: PROVIDERS.R2,
      action: 'upload_logo',
      organizationId,
      userId: workosUserId,
      inputSize: buffer.length,
      success: true
    });

    if (organizationId) {
      const existingOrg = await prisma.organizations.findUnique({
        where: { id: organizationId }
      });

      if (!existingOrg) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      if (existingOrg.logo_url && existingOrg.logo_url.includes(PUBLIC_URL_BASE)) {
        const oldKey = existingOrg.logo_url.replace(`${PUBLIC_URL_BASE}/`, '');
        try {
          await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${oldKey}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${R2_TOKEN}`
              }
            }
          );
          console.log('Old logo deleted:', oldKey);
        } catch (error) {
          console.error('Failed to delete old logo:', error);
        }
      }

      const updatedOrg = await prisma.organizations.update({
        where: { id: organizationId },
        data: {
          logo_url: logoUrl,
          lastUpdated: new Date(),
          updatedby: workosUserId
        }
      });

      return res.status(200).json({
        success: true,
        logoUrl,
        organization: updatedOrg
      });
    }

    return res.status(200).json({
      success: true,
      logoUrl
    });
  }
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};
