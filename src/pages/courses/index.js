import React from "react";
import { useEffect, useState } from 'react';

// project imports
import Layout from "layout";
import Page from "components/Page";
import Loader from 'components/Loader';
import CoursesTable from "./course-tabble";

import { useDispatch } from "store";
import { openDrawer } from 'store/reducers/menu';
import { getUserStory, getUserStoryOrder, getProfiles, getComments, getCourses, getColumnsOrder } from 'store/reducers/courses';

// ==============================|| APPLICATION - COURSES ||============================== //

function CourseDetailsPage() {
const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // hide left drawer when email app opens
    dispatch(openDrawer(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const courses = dispatch(getCourses());
    const columnOrder = dispatch(getColumnsOrder());
    const profile = dispatch(getProfiles());
    const comments = dispatch(getComments());
    const story = dispatch(getUserStory());
    const storyOrder = dispatch(getUserStoryOrder());

    Promise.all([ courses, columnOrder, profile, comments, story, storyOrder]).then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (loading) return <Loader />;


  return (
    <Page title="Course Listing">
      <CoursesTable/>
    </Page>
  );
}

CourseDetailsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CourseDetailsPage;
