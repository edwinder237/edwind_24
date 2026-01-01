/**
 * ============================================
 * PASSWORD RESET API
 * ============================================
 *
 * POST: Initiates a password reset flow via WorkOS
 * Sends a password reset email to the authenticated user
 */

import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID from cookie
    const userId = req.cookies.workos_user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user email from WorkOS
    const user = await workos.userManagement.getUser(userId);

    if (!user || !user.email) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send password reset email via WorkOS
    await workos.userManagement.sendPasswordResetEmail({
      email: user.email,
      passwordResetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8081'}/password-reset`
    });

    return res.status(200).json({
      success: true,
      message: `Password reset email sent to ${user.email}. Please check your inbox.`
    });

  } catch (error) {
    console.error('Error sending password reset email:', error);

    // Handle specific WorkOS errors
    if (error.code === 'user_not_found') {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(500).json({
      error: 'Failed to send password reset email',
      message: error.message
    });
  }
}
