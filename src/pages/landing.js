import { useEffect } from 'react';
import { useRouter } from 'next/router';

// ==============================|| LANDING PAGE - REDIRECT TO ROOT ||============================== //

const LandingPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect /landing to root for backwards compatibility
    router.replace('/');
  }, [router]);

  return null;
};

export default LandingPage;
