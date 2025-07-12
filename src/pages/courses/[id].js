import React from "react";
import { useEffect, useState } from 'react';
import { useRouter } from "next/router";
import CourseEditPage from "sections/apps/courses/courseEditPage";

// project imports
import Layout from "layout";
import Page from "components/Page";
import Loader from 'components/Loader';

import { useDispatch } from "store";
import { openDrawer } from 'store/reducers/menu';
import { getCourses } from 'store/reducers/courses';

// ==============================|| APPLICATION - COURSES ||============================== //

function CourseDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // hide left drawer when email app opens
    dispatch(openDrawer(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const courses = dispatch(getCourses());
    Promise.all([ courses ]).then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loader />;


  return (
    <Page title="Course Details">
      <CourseEditPage courseId={id} />
    </Page>
  );
}

CourseDetailsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CourseDetailsPage;
