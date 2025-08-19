// project import
import Layout from 'layout';
import Landing from 'sections/landing';

// ==============================|| LANDING PAGE ||============================== //

const LandingPage = () => <Landing />;

LandingPage.getLayout = function getLayout(page) {
  console.log('Landing page layout rendering with variant: landing');
  return <Layout variant="landing">{page}</Layout>;
};

export default LandingPage;