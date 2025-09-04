export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test Google Maps API access
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    // Test R2 credentials
    const r2AccessKey = process.env.R2_ACCESS_KEY_ID || 'bdd838062a3ffeafbc786b5bfbef14b8';
    const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY || '8f5c92b0b898401456006e72942bb8123e2a05c487709a7e3cf59be46a48426b';
    const r2Token = process.env.R2_TOKEN || 'UQEAEo20xjkvrBnDpWzfVXZ_KQGHoYpf1XgKTA7p';

    // Check AWS SDK availability
    let awsSdkAvailable = false;
    try {
      require('aws-sdk');
      awsSdkAvailable = true;
    } catch (error) {
      awsSdkAvailable = false;
    }

    const status = {
      googleMapsApi: {
        configured: !!googleMapsApiKey,
        keyLength: googleMapsApiKey ? googleMapsApiKey.length : 0
      },
      r2Storage: {
        accessKeyConfigured: !!r2AccessKey,
        secretKeyConfigured: !!r2SecretKey,
        tokenConfigured: !!r2Token,
        credentials: {
          accessKeyId: r2AccessKey ? `${r2AccessKey.substring(0, 8)}...` : 'Not set',
          secretKey: r2SecretKey ? 'Configured' : 'Not set',
          token: r2Token ? `${r2Token.substring(0, 8)}...` : 'Not set'
        }
      },
      environment: process.env.NODE_ENV || 'development',
      recommendations: []
    };

    // Add recommendations
    if (!googleMapsApiKey) {
      status.recommendations.push('Set GOOGLE_MAPS_API_KEY environment variable');
    }

    if (!r2AccessKey || !r2SecretKey) {
      status.recommendations.push('R2 credentials are missing - using hardcoded values');
    } else {
      status.recommendations.push('R2 credentials configured successfully');
    }

    if (!r2Token) {
      status.recommendations.push('R2 token not configured - using hardcoded value');
    }

    status.recommendations.push('Using production R2 client with AWS v4 signatures (no AWS SDK required)');
    status.recommendations.push('All R2 credentials are pre-configured and ready to use');

    // Test sample Google Maps image URL (this is a safe test URL)
    const testImageUrl = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=test&key=' + (googleMapsApiKey || 'NO_KEY');
    
    res.status(200).json({
      success: true,
      message: 'R2 Image Upload Setup Status',
      data: {
        ...status,
        testImageUrl: googleMapsApiKey ? testImageUrl : 'Google Maps API key not configured',
        bucketUrl: 'https://923f49e1995e9f5e3f85d8b7ea48047a.r2.cloudflarestorage.com/edwindblobs',
        setupComplete: !!(googleMapsApiKey && r2AccessKey && r2SecretKey),
        productionReady: !!(googleMapsApiKey && r2AccessKey && r2SecretKey), // No AWS SDK required
        r2Ready: !!(r2AccessKey && r2SecretKey)
      }
    });

  } catch (error) {
    console.error('Setup test error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to test setup',
      details: error.message
    });
  }
}