import { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Button, Alert } from '@mui/material';

const DebugAuth = () => {
  const [envInfo, setEnvInfo] = useState(null);
  const [apiTest, setApiTest] = useState(null);

  useEffect(() => {
    // Show environment info (client-side accessible only)
    setEnvInfo({
      redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
      currentUrl: window.location.origin,
    });
  }, []);

  const testSignInUrl = async () => {
    try {
      const response = await fetch('/api/auth/signin-url');
      const data = await response.json();
      setApiTest({ success: true, data });
    } catch (error) {
      setApiTest({ success: false, error: error.message });
    }
  };

  const testUserApi = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      setApiTest({ success: response.ok, data, status: response.status });
    } catch (error) {
      setApiTest({ success: false, error: error.message });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          WorkOS Auth Debug Page
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          This page helps debug the WorkOS authentication setup.
        </Alert>

        {/* Environment Info */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Environment Configuration
          </Typography>
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Redirect URI:</strong> {envInfo?.redirectUri || 'Loading...'}
            </Typography>
            <Typography variant="body2">
              <strong>Current Origin:</strong> {envInfo?.currentUrl || 'Loading...'}
            </Typography>
            <Typography variant="body2" color={envInfo?.redirectUri?.includes('8081') ? 'success.main' : 'error.main'}>
              <strong>Port Match:</strong> {envInfo?.redirectUri?.includes('8081') ? '✅ Correct (8081)' : '❌ Mismatch'}
            </Typography>
          </Box>
        </Box>

        {/* API Tests */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            API Endpoint Tests
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="outlined" onClick={testSignInUrl}>
              Test Sign-In URL API
            </Button>
            <Button variant="outlined" onClick={testUserApi}>
              Test User API
            </Button>
          </Box>
          
          {apiTest && (
            <Box sx={{ bgcolor: apiTest.success ? 'success.50' : 'error.50', p: 2, borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Status:</strong> {apiTest.success ? '✅ Success' : '❌ Failed'}
              </Typography>
              {apiTest.status && (
                <Typography variant="body2">
                  <strong>HTTP Status:</strong> {apiTest.status}
                </Typography>
              )}
              {apiTest.data && (
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', mt: 1 }}>
                  {JSON.stringify(apiTest.data, null, 2)}
                </Typography>
              )}
              {apiTest.error && (
                <Typography variant="body2" color="error">
                  <strong>Error:</strong> {apiTest.error}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* WorkOS Dashboard Setup */}
        <Box>
          <Typography variant="h6" gutterBottom>
            WorkOS Dashboard Setup
          </Typography>
          <Alert severity="warning">
            <Typography variant="body2" component="div">
              <strong>Required WorkOS Dashboard Configuration:</strong>
              <br />
              1. Set Redirect URI to: <code>http://localhost:8081/callback</code>
              <br />
              2. Configure Authentication Methods in AuthKit
              <br />
              3. Ensure your API Key and Client ID are correct
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Container>
  );
};

export default DebugAuth;