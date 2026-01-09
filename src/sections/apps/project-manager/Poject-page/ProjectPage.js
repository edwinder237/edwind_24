import React, { useState } from 'react';
import { useSelector } from "store";
import { derivedSelectors } from 'store/selectors';

// project import
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import ProjectNotFound from "pages/maintenance/project-notFound";
import ProjectDashboard from "./Project-Dashboard/ProjectDashboard";
import ProjectTabs from "./ProjectTabs";

// material-ui
import { Box, Stack, Typography, Switch, Collapse } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { Dashboard } from "@mui/icons-material";

// ==============================|| PROJECT PAGE ||============================== //

const ProjectPage = ({ projectId }) => {
  const theme = useTheme();

  // State for dashboard visibility (hidden by default)
  const [showDashboard, setShowDashboard] = useState(false);

  // Get project data from derived selectors (no API call needed)
  const dashboardData = useSelector(derivedSelectors.dashboard.selectCompleteDashboard);

  // Extract project info from computed dashboard data
  const Project = dashboardData?.projectInfo ? {
    id: dashboardData.projectInfo.id,
    title: dashboardData.projectInfo.title,
    summary: dashboardData.projectInfo.summary,
    projectStatus: dashboardData.projectInfo.projectStatus,
    training_recipient: dashboardData.projectInfo.training_recipient
  } : null;
  
  // Common style definitions
  const styles = {
    flexCenter: {
      display: 'flex',
      alignItems: 'center'
    },
    flexBetween: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    statBox: {
      textAlign: 'center'
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.palette.grey[200],
      '& .MuiLinearProgress-bar': {
        borderRadius: 4
      }
    },
    colorDot: {
      width: 8,
      height: 8,
      borderRadius: '50%'
    },
    tabLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }
  };

  // No longer need to fetch dashboard data - it's computed from Redux store
  // Dashboard metrics are derived from projectSettings and agenda data
  // Checklist data is now fetched via RTK Query in the Checklist tab component


  if (projectId && dashboardData) {
    return (
        <Box sx={{ width: '100%' }}>
          {/* Breadcrumbs */}
          <Box sx={{ mb: 2 }}>
            <Breadcrumbs 
              title={false} 
              divider={false}
              card={false}
              navigation={{ items: [
                {
                  id: 'project-manager',
                  type: 'group',
                  children: [
                    {
                      id: 'pm-projects-list',
                      title: 'Projects',
                      type: 'item',
                      url: '/projects',
                      breadcrumbs: true
                    },
                    {
                      id: 'pm-project-detail',
                      title: `${Project?.title || 'Project'}`,
                      type: 'item',
                      url: `/projects/${projectId}`,
                      breadcrumbs: true
                    }
                  ]
                }
              ]}}
            />
          </Box>
          
          {/* Dashboard Toggle & Project Dashboard */}
          <Box sx={{ mb: 2 }}>
            {/* Toggle Switch */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                mb: showDashboard ? 2 : 0,
                py: 1,
                px: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}
            >
              <Dashboard sx={{ fontSize: 20, color: theme.palette.primary.main }} />
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                Show Dashboard
              </Typography>
              <Switch
                checked={showDashboard}
                onChange={(e) => setShowDashboard(e.target.checked)}
                size="small"
                color="primary"
              />
            </Stack>

            {/* Collapsible Dashboard */}
            <Collapse in={showDashboard} timeout={300}>
              <ProjectDashboard
                project={Project}
                styles={styles}
              />
            </Collapse>
          </Box>

          {/* Project Tabs */}
          <ProjectTabs
            project={Project}
            styles={styles}
          />
        </Box>
    );
  } else return <ProjectNotFound/>;
};

export default ProjectPage;
