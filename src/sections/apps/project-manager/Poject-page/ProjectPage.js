import { useSelector } from "store";
import { derivedSelectors } from 'store/selectors';

// project import
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import ProjectNotFound from "pages/maintenance/project-notFound";
import ProjectDashboard from "./Project-Dashboard/ProjectDashboard";
import ProjectTabs from "./ProjectTabs";

// material-ui
import { Grid, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// ==============================|| PROJECT PAGE ||============================== //

const ProjectPage = ({ projectId }) => {
  const theme = useTheme();

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
          
          {/* Project Dashboard */}
          <Box sx={{ mb: 2 }}>
            <ProjectDashboard 
              project={Project}
              styles={styles}
            />
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
