// project import
import Landing from 'sections/landing';
import Layout from 'layout';

// ==============================|| HOME PAGE ||============================== //

const HomePage = () => {
  return <Landing />;
};

HomePage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default HomePage;