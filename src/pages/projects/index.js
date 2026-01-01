import React from "react";

// project imports
import Layout from "layout";
import Page from "components/Page";
import ProjectsList from "sections/apps/project-manager/projects-list/ProjectsList";

// ==============================|| PROJECTS PAGE ||============================== //

function Projects() {
  // ProjectsList component handles its own data loading
  return (
    <Page title="Projects">
      <ProjectsList />
    </Page>
  );
}

Projects.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Projects;
