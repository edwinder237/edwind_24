import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

//REDUX
import { useDispatch, useSelector } from "store";
import { getSingleProject } from "store/reducers/projects";

// project imports
import Layout from "layout";
import Page from "components/Page";
import Loader from "components/Loader";

import ProjectPage from "../../sections/apps/project-manager/Poject-page/ProjectPage";

// ==============================|| ROUTER ||============================== //

function ProjectDefault() {
  const router = useRouter();
  const { id } = router.query;
  const projectId = parseInt(id);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      const singleProject = dispatch(getSingleProject(21));
      Promise.all([singleProject]).then(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  console.log(loading?"loading":"router")
  if (loading) return <Loader />;

  return <ProjectPage />;
}

ProjectDefault.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProjectDefault;
