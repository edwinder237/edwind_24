import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirect to dashboard page by default
const InternalIndex = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/internal/dashboard');
  }, [router]);

  return null;
};

export default InternalIndex;
