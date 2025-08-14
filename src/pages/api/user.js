import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  try {
    const userId = req.cookies.workos_user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from WorkOS
    const user = await workos.userManagement.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Transform WorkOS user data to match existing app structure
    const transformedUser = {
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      email: user.email,
      avatar: user.profilePictureUrl || '/assets/images/users/default.png',
      thumb: user.profilePictureUrl || '/assets/images/users/default.png',
      role: 'User',
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      // Mock organization data for demonstration
      // In a real implementation, you would fetch this from your database based on user
      organizationName: 'EDWIND Learning Solutions',
      subOrganizationName: 'Training Division'
    };

    res.status(200).json(transformedUser);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(401).json({ error: 'Not authenticated' });
  }
}