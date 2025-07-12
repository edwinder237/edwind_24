export default async function handler(req, res) {
  // Redirect to sign-in URL endpoint
  res.redirect(302, '/api/auth/signin-url');
}