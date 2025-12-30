import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import useUser from 'hooks/useUser';

const AuthButton = ({ variant = 'contained', size = 'medium', ...props }) => {
  const { user, isLoading, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        // User is logged in, log them out
        window.location.href = '/api/auth/logout';
      } else {
        // User is not logged in, log them in
        const response = await fetch('/api/auth/signin-url');
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setLoading(false);
    }
  };

  if (isLoading) {
    // Still loading user data
    return (
      <Button variant={variant} size={size} disabled {...props}>
        <CircularProgress size={20} />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAuth}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <CircularProgress size={20} />
      ) : isAuthenticated ? (
        'Sign Out'
      ) : (
        'Sign In'
      )}
    </Button>
  );
};

export default AuthButton;