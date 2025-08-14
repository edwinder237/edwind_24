import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

//REDUX
import { useDispatch, useSelector } from "store";
import { getSingleProject } from "store/reducers/projects";
import { clearLoading } from "store/reducers/loading";

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
      const singleProject = dispatch(getSingleProject(parseInt(id)));
      Promise.all([singleProject]).then(() => {
        setLoading(false);
        // Clear any global loading state when page is ready
        dispatch(clearLoading());
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
  console.log(loading?"loading":"router")
  if (loading) return <Loader />;

  return <ProjectPage />;
}

ProjectDefault.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProjectDefault;
