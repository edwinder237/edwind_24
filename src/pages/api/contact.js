import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email template for contact form submissions
const createContactEmail = (formData) => ({
  from: process.env.RESEND_FROM_EMAIL || 'admin@edwind.ca',
  to: process.env.RESEND_TO_EMAIL || 'admin@edwind.ca',
  subject: `EDWIND Contact Form: ${formData.subject}`,
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #02174C, #1976d2);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 30px -30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .field {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          .field:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #02174C;
            margin-bottom: 5px;
            display: block;
          }
          .value {
            color: #666;
            word-wrap: break-word;
          }
          .message-content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #1976d2;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
          .priority-badge {
            display: inline-block;
            background: #1976d2;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 New Contact Form Submission</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">
              Received on ${new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </p>
          </div>

          <div class="field">
            <span class="label">Subject:</span>
            <div class="value">
              ${formData.subject} 
              ${['Product Demo', 'Enterprise Solutions', 'Partnership'].includes(formData.subject) 
                ? '<span class="priority-badge">High Priority</span>' 
                : ''
              }
            </div>
          </div>

          <div class="field">
            <span class="label">Full Name:</span>
            <div class="value">${formData.name}</div>
          </div>

          <div class="field">
            <span class="label">Email Address:</span>
            <div class="value">
              <a href="mailto:${formData.email}" style="color: #1976d2; text-decoration: none;">
                ${formData.email}
              </a>
            </div>
          </div>

          ${formData.company ? `
          <div class="field">
            <span class="label">Company/Organization:</span>
            <div class="value">${formData.company}</div>
          </div>
          ` : ''}

          <div class="field">
            <span class="label">Message:</span>
            <div class="message-content">${formData.message}</div>
          </div>

          <div class="footer">
            <p>This email was sent from the EDWIND contact form.</p>
            <p>
              <strong>Reply directly to this email</strong> to respond to ${formData.name} at 
              <a href="mailto:${formData.email}" style="color: #1976d2;">${formData.email}</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
});

// Auto-reply email template
const createAutoReplyEmail = (formData) => ({
  from: process.env.RESEND_FROM_EMAIL || 'admin@edwind.ca',
  to: formData.email,
  subject: 'Thank you for contacting EDWIND - We\'ll be in touch soon!',
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Thank you for contacting EDWIND</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #02174C, #1976d2);
            color: white;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin: 0 auto 20px;
          }
          .content {
            text-align: left;
          }
          .highlight {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
            margin: 20px 0;
          }
          .contact-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .contact-info h3 {
            margin-top: 0;
            color: #02174C;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
          }
          .button {
            display: inline-block;
            background: #1976d2;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">E</div>
            <h1 style="color: #02174C; margin: 0;">Thank You!</h1>
            <p style="color: #666; margin: 10px 0 0 0;">
              We've received your message and will respond soon.
            </p>
          </div>

          <div class="content">
            <p>Hi ${formData.name.split(' ')[0]},</p>
            
            <p>
              Thank you for reaching out to EDWIND! We've successfully received your message 
              regarding "<strong>${formData.subject}</strong>" and truly appreciate your interest 
              in our training management platform.
            </p>

            <div class="highlight">
              <strong>What happens next?</strong>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Our team will review your message within the next few hours</li>
                <li>You'll receive a personalized response within 24 hours during business days</li>
                <li>For urgent inquiries, we'll prioritize your request accordingly</li>
              </ul>
            </div>

            <p>
              In the meantime, feel free to explore our platform features or check out our 
              resources to learn more about how EDWIND can transform your training programs.
            </p>

            <div class="contact-info">
              <h3>Need immediate assistance?</h3>
              <p><strong>Email:</strong> admin@edwind.ca</p>
            </div>

            <p>
              We're excited about the opportunity to help your organization achieve better 
              learning outcomes with EDWIND.
            </p>

            <p>
              Best regards,<br>
              <strong>The EDWIND Team</strong>
            </p>
          </div>

          <div class="footer">
            <p>
              This is an automated confirmation email. Please do not reply to this message.<br>
              If you need to reach us, please email admin@edwind.ca
            </p>
            <p>
              © ${new Date().getFullYear()} EDWIND by Lumeve. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
});

// Validation function with detailed logging
const validateFormData = (data) => {
  const errors = [];

  console.log('🔍 [VALIDATION DEBUG] Starting form validation...');
  console.log('📝 [VALIDATION DEBUG] Raw form data:', {
    name: data.name ? `"${data.name}" (length: ${data.name.length})` : 'undefined/null',
    email: data.email ? `"${data.email}" (length: ${data.email.length})` : 'undefined/null',
    company: data.company ? `"${data.company}" (length: ${data.company.length})` : 'undefined/null',
    subject: data.subject ? `"${data.subject}" (length: ${data.subject.length})` : 'undefined/null',
    message: data.message ? `"${data.message}" (length: ${data.message.length})` : 'undefined/null'
  });

  // Name validation
  if (!data.name) {
    console.log('❌ [VALIDATION] Name is missing or undefined');
    errors.push('Name is required');
  } else if (typeof data.name !== 'string') {
    console.log('❌ [VALIDATION] Name is not a string:', typeof data.name);
    errors.push('Name must be a valid text');
  } else if (data.name.trim().length < 2) {
    console.log('❌ [VALIDATION] Name too short:', `"${data.name.trim()}" (${data.name.trim().length} chars)`);
    errors.push('Name must be at least 2 characters long');
  } else {
    console.log('✅ [VALIDATION] Name passed:', `"${data.name.trim()}"`);
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email) {
    console.log('❌ [VALIDATION] Email is missing or undefined');
    errors.push('Email is required');
  } else if (typeof data.email !== 'string') {
    console.log('❌ [VALIDATION] Email is not a string:', typeof data.email);
    errors.push('Email must be a valid text');
  } else if (!emailRegex.test(data.email.trim())) {
    console.log('❌ [VALIDATION] Email format invalid:', `"${data.email.trim()}"`);
    errors.push('Please provide a valid email address');
  } else {
    console.log('✅ [VALIDATION] Email passed:', `"${data.email.trim()}"`);
  }

  // Subject validation
  if (!data.subject) {
    console.log('❌ [VALIDATION] Subject is missing or undefined');
    errors.push('Subject is required');
  } else if (typeof data.subject !== 'string') {
    console.log('❌ [VALIDATION] Subject is not a string:', typeof data.subject);
    errors.push('Subject must be a valid selection');
  } else if (data.subject.trim().length === 0) {
    console.log('❌ [VALIDATION] Subject is empty after trimming');
    errors.push('Please select a subject');
  } else {
    console.log('✅ [VALIDATION] Subject passed:', `"${data.subject.trim()}"`);
  }

  // Message validation
  if (!data.message) {
    console.log('❌ [VALIDATION] Message is missing or undefined');
    errors.push('Message is required');
  } else if (typeof data.message !== 'string') {
    console.log('❌ [VALIDATION] Message is not a string:', typeof data.message);
    errors.push('Message must be valid text');
  } else if (data.message.trim().length < 10) {
    console.log('❌ [VALIDATION] Message too short:', `"${data.message.trim()}" (${data.message.trim().length} chars)`);
    errors.push('Message must be at least 10 characters long');
  } else if (data.message.length > 2000) {
    console.log('❌ [VALIDATION] Message too long:', `${data.message.length} chars`);
    errors.push('Message must be less than 2000 characters');
  } else {
    console.log('✅ [VALIDATION] Message passed:', `${data.message.trim().length} characters`);
  }

  // Company validation (optional field)
  if (data.company !== undefined && data.company !== null && data.company !== '') {
    if (typeof data.company !== 'string') {
      console.log('❌ [VALIDATION] Company is not a string:', typeof data.company);
      errors.push('Company must be valid text');
    } else {
      console.log('✅ [VALIDATION] Company passed:', `"${data.company.trim()}"`);
    }
  } else {
    console.log('ℹ️ [VALIDATION] Company field is empty (optional)');
  }

  console.log(`🏁 [VALIDATION DEBUG] Validation complete. Errors found: ${errors.length}`);
  if (errors.length > 0) {
    console.log('📋 [VALIDATION DEBUG] Validation errors:', errors);
  }

  return errors;
};

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }
  
  const requests = rateLimit.get(ip).filter(timestamp => timestamp > windowStart);
  rateLimit.set(ip, [...requests, now]);
  
  return requests.length >= MAX_REQUESTS_PER_WINDOW;
};

export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  console.log(`\n🚀 [${timestamp}] Contact API called`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ [API] OPTIONS preflight request handled');
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`❌ [API] Invalid method: ${req.method}`);
    return res.status(405).json({ 
      error: 'Method not allowed. Please use POST.' 
    });
  }

  console.log('✅ [API] POST method confirmed');

  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ [CONFIG] RESEND_API_KEY environment variable is not set');
    return res.status(500).json({ 
      error: 'Email service is not configured. Please try again later.' 
    });
  }

  console.log('✅ [CONFIG] Resend API key is configured');
  console.log('ℹ️ [CONFIG] Environment check:', {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '***' + process.env.RESEND_API_KEY.slice(-4) : 'NOT_SET',
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NOT_SET',
    RESEND_TO_EMAIL: process.env.RESEND_TO_EMAIL || 'NOT_SET'
  });

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    console.log('ℹ️ [API] Client IP:', clientIP);

    // Check rate limiting
    if (isRateLimited(clientIP)) {
      console.log(`❌ [RATE_LIMIT] Client ${clientIP} exceeded rate limit`);
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before sending another message.'
      });
    }

    console.log('✅ [RATE_LIMIT] Rate limit check passed');

    // Log request headers
    console.log('📋 [API] Request headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin']
    });

    // Validate request body
    console.log('🔍 [API] Validating request body...');
    const formData = req.body;
    
    console.log('📊 [API] Request body type:', typeof formData);
    console.log('📊 [API] Request body keys:', formData ? Object.keys(formData) : 'null/undefined');
    
    if (!formData || typeof formData !== 'object') {
      console.log('❌ [API] Invalid request body - not an object or null');
      return res.status(400).json({ 
        error: 'Invalid request body' 
      });
    }

    console.log('✅ [API] Request body is valid object');

    // Log raw form data
    console.log('📝 [API] Raw form data received:', {
      name: formData.name,
      email: formData.email,
      company: formData.company,
      subject: formData.subject,
      message: formData.message ? `${formData.message.substring(0, 50)}...` : undefined
    });

    // Sanitize input data
    console.log('🧹 [API] Sanitizing input data...');
    const sanitizedData = {
      name: formData.name?.trim() || '',
      email: formData.email?.trim().toLowerCase() || '',
      company: formData.company?.trim() || '',
      subject: formData.subject?.trim() || '',
      message: formData.message?.trim() || ''
    };

    console.log('🧹 [API] Sanitized data:', {
      name: sanitizedData.name,
      email: sanitizedData.email,
      company: sanitizedData.company,
      subject: sanitizedData.subject,
      message: sanitizedData.message ? `${sanitizedData.message.substring(0, 50)}...` : ''
    });

    // Validate form data
    console.log('🔍 [API] Starting form validation...');
    const validationErrors = validateFormData(sanitizedData);
    
    if (validationErrors.length > 0) {
      console.log(`❌ [API] Validation failed with ${validationErrors.length} errors`);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    console.log('✅ [API] Form validation passed');

    // Send notification email to admin
    console.log('📧 [EMAIL] Creating admin notification email...');
    const adminEmail = createContactEmail(sanitizedData);
    
    console.log('📧 [EMAIL] Admin email config:', {
      from: adminEmail.from,
      to: adminEmail.to,
      subject: adminEmail.subject
    });
    
    console.log('📧 [EMAIL] Sending admin notification via Resend...');
    const adminEmailResult = await resend.emails.send(adminEmail);

    console.log('📧 [EMAIL] Admin email result:', {
      success: !adminEmailResult.error,
      id: adminEmailResult.data?.id,
      error: adminEmailResult.error
    });

    if (adminEmailResult.error) {
      console.error('❌ [EMAIL] Failed to send admin notification:', adminEmailResult.error);
      console.error('❌ [EMAIL] Resend error details:', {
        name: adminEmailResult.error.name,
        message: adminEmailResult.error.message,
        code: adminEmailResult.error.code
      });
      return res.status(500).json({
        error: 'Failed to send message. Please try again later.',
        debug: process.env.NODE_ENV === 'development' ? adminEmailResult.error : undefined
      });
    }

    console.log('✅ [EMAIL] Admin notification sent successfully');

    // Send auto-reply to user
    console.log('📧 [EMAIL] Creating auto-reply email...');
    const autoReplyEmail = createAutoReplyEmail(sanitizedData);
    
    console.log('📧 [EMAIL] Auto-reply email config:', {
      from: autoReplyEmail.from,
      to: autoReplyEmail.to,
      subject: autoReplyEmail.subject
    });
    
    console.log('📧 [EMAIL] Sending auto-reply via Resend...');
    const autoReplyResult = await resend.emails.send(autoReplyEmail);

    console.log('📧 [EMAIL] Auto-reply result:', {
      success: !autoReplyResult.error,
      id: autoReplyResult.data?.id,
      error: autoReplyResult.error
    });

    if (autoReplyResult.error) {
      console.error('⚠️ [EMAIL] Failed to send auto-reply (non-critical):', autoReplyResult.error);
      console.error('⚠️ [EMAIL] Auto-reply error details:', {
        name: autoReplyResult.error.name,
        message: autoReplyResult.error.message,
        code: autoReplyResult.error.code
      });
      // Continue - admin notification was sent successfully
    } else {
      console.log('✅ [EMAIL] Auto-reply sent successfully');
    }

    // Log successful submission
    console.log(`✅ [SUCCESS] Contact form submission completed from ${sanitizedData.email} - Subject: ${sanitizedData.subject}`);

    // Return success response
    console.log('📤 [API] Returning success response');
    return res.status(200).json({
      success: true,
      message: 'Message sent successfully. We\'ll get back to you soon!',
      id: adminEmailResult.data?.id,
      debug: process.env.NODE_ENV === 'development' ? {
        adminEmailId: adminEmailResult.data?.id,
        autoReplyEmailId: autoReplyResult.data?.id
      } : undefined
    });

  } catch (error) {
    console.error('\n💥 [ERROR] Unhandled error in contact API:', error);
    console.error('📊 [ERROR] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      cause: error.cause
    });
    
    // Log the exact point of failure
    console.error('🔍 [ERROR] Error occurred at timestamp:', new Date().toISOString());
    
    // Try to provide more context
    if (error.message?.includes('fetch')) {
      console.error('🌐 [ERROR] Seems to be a network/fetch related error');
    }
    
    if (error.message?.includes('Resend') || error.message?.includes('email')) {
      console.error('📧 [ERROR] Seems to be an email service related error');
    }
    
    return res.status(500).json({
      error: 'Internal server error. Please try again later.',
      debug: process.env.NODE_ENV === 'development' ? {
        errorName: error.name,
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      } : undefined
    });
  }
}