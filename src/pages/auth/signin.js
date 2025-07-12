import { useEffect } from 'react';
import { useRouter } from 'next/router';

const SignInRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to projects which will trigger AuthGuard
    router.replace('/projects?from_logout=true');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui'
    }}>
      <div>
        <h2>Redirecting...</h2>
        <p>Please wait while we redirect you to sign in.</p>
      </div>
    </div>
  );
};

export default SignInRedirect;