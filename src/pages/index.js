import { useEffect } from 'react';
import { useRouter } from 'next/router';

// project import  
import Layout from 'layout';

// ==============================|| HOME PAGE - REDIRECT TO PROJECTS ||============================== //

const HomePage = () => {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/projects');
  }, [router]);
  
  return null; // Return null while redirecting
};

HomePage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default HomePage;