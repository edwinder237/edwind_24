import { createId } from '@paralleldrive/cuid2';
import prisma from '../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Cloudflare R2 Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '923f49e1995e9f5e3f85d8b7ea48047a';
const R2_TOKEN = process.env.R2_TOKEN || 'UQEAEo20xjkvrBnDpWzfVXZ_KQGHoYpf1XgKTA7p';
const BUCKET_NAME = 'edwindblobs';
const PUBLIC_URL_BASE = `https://pub-34f9e757e51b451ea7060249e757957c.r2.dev`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const userId = req.cookies.workos_user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from WorkOS
    const user = await workos.userManagement.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Parse the form data
    const { imageData, contentType, organizationId } = req.body;
    
    if (!imageData || !contentType) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid image type. Only JPEG, PNG, WebP, and SVG are allowed.' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    
    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (buffer.length > maxSize) {
      return res.status(400).json({ error: 'Image size must be less than 2MB' });
    }

    // Generate unique filename
    const fileExtension = contentType.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    const fileName = `organizations/${organizationId || createId()}_${Date.now()}.${fileExtension}`;

    // Upload to R2 using Cloudflare API
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

    // Update organization logo in database if organizationId is provided
    if (organizationId) {
      // First check if the organization exists
      const existingOrg = await prisma.organizations.findUnique({
        where: { id: organizationId }
      });

      if (!existingOrg) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Delete old logo from R2 if it exists
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
          // Continue even if deletion fails
        }
      }

      // Update with new logo
      const updatedOrg = await prisma.organizations.update({
        where: { id: organizationId },
        data: { 
          logo_url: logoUrl,
          lastUpdated: new Date(),
          updatedby: user.id || user.email
        }
      });

      return res.status(200).json({ 
        success: true, 
        logoUrl,
        organization: updatedOrg 
      });
    }

    // If no organizationId, just return the uploaded URL
    return res.status(200).json({ 
      success: true, 
      logoUrl 
    });

  } catch (error) {
    console.error('Error uploading organization logo:', error);
    return res.status(500).json({ 
      error: 'Failed to upload logo',
      details: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};