import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    res.redirect(302, '/api/auth/signin-url');
  }
});
