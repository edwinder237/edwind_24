import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import NextLink from 'next/link';

// material-ui
import { Box, Button, Stack, Typography, useTheme, alpha } from '@mui/material';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';

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
import { APP_DEFAULT_PATH } from 'config';

import ProjectPage from "../../sections/apps/project-manager/Poject-page/ProjectPage";

// ==============================|| ACCESS DENIED COMPONENT ||============================== //

function ProjectAccessDenied({ projectId }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        px: 3
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.error.main, 0.1),
          mb: 3
        }}
      >
        <LockOutlined style={{ fontSize: 40, color: theme.palette.error.main }} />
      </Box>

      <Typography variant="h3" gutterBottom>
        Access Denied
      </Typography>

      <Typography
        variant="body1"
        color="textSecondary"
        sx={{ maxWidth: 400, mb: 1 }}
      >
        You don't have permission to view this project. This project may belong to a different organization.
      </Typography>

      <Typography
        variant="body2"
        color="textSecondary"
        sx={{ mb: 4 }}
      >
        Project ID: {projectId}
      </Typography>

      <Stack direction="row" spacing={2}>
        <NextLink href="/projects" passHref legacyBehavior>
          <Button
            variant="contained"
            startIcon={<ArrowLeftOutlined />}
          >
            Back to Projects
          </Button>
        </NextLink>
        <NextLink href={APP_DEFAULT_PATH} passHref legacyBehavior>
          <Button variant="outlined">
            Go to Dashboard
          </Button>
        </NextLink>
      </Stack>
    </Box>
  );
}

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
    // Check if it's an access denied / not found error (404)
    const status = error?.status || error?.originalStatus;
    const errorCode = error?.data?.code;

    if (status === 404 || errorCode === 'NOT_FOUND' || errorCode === 'RESOURCE_NOT_IN_ORGANIZATION') {
      return <ProjectAccessDenied projectId={projectId} />;
    }

    // Show generic error for other error types
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error loading project</h2>
        <p>{error?.data?.error || error?.message || 'Failed to load project data'}</p>
      </div>
    );
  }

  return <ProjectPage projectId={projectId} />;
}

ProjectDefault.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProjectDefault;
