import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";

//REDUX
import { useDispatch } from "store";
import { clearLoading } from "store/reducers/loading";

// RTK Query hooks for CQRS pattern
import {
  useGetProjectSettingsQuery,
  // useGetProjectDashboardQuery removed - using derived selectors
  useGetProjectAgendaQuery,
  useGetProjectParticipantsQuery
} from "store/api/projectApi";

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

  // Use RTK Query for all project data (CQRS pattern)
  // Participants query is PRIMARY - fetched first and normalized to entities store
  // Data is not used directly here, but normalizes to entities for child components
  const {
    isLoading: participantsLoading,
    error: participantsError
  } = useGetProjectParticipantsQuery(projectId, { skip: !projectId });

  const {
    data: settingsData,
    isLoading: settingsLoading,
    error: settingsError
  } = useGetProjectSettingsQuery(projectId, { skip: !projectId });

  // Dashboard query removed - dashboard metrics now computed via derived selectors
  // from already-loaded projectSettings, projectAgenda, and entity data

  // Agenda reads participants from normalized entities store (not from its own fetch)
  const {
    data: agendaData,
    isLoading: agendaLoading,
    error: agendaError
  } = useGetProjectAgendaQuery(projectId, { skip: !projectId });

  // Clear global loading state when all queries are done
  useEffect(() => {
    if (!participantsLoading && !settingsLoading && !agendaLoading) {
      dispatch(clearLoading());
    }
  }, [participantsLoading, settingsLoading, agendaLoading, dispatch]);

  // Show loader while any query is loading
  const isLoading = participantsLoading || settingsLoading || agendaLoading;
  if (isLoading) return <Loader />;

  // Show error if any query failed
  const error = participantsError || settingsError || agendaError;
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error loading project</h2>
        <p>{error?.message || error?.data?.error || 'Failed to load project data'}</p>
      </div>
    );
  }

  return <ProjectPage projectId={projectId} />;
}

ProjectDefault.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProjectDefault;
