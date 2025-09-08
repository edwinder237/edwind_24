import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "store";
import { 
  getProjectChecklist,
  updateChecklistProgress 
} from "store/reducers/projects";

// project import
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import ProjectNotFound from "pages/maintenance/project-notFound";
import ProjectDashboard from "./Project-Dashboard/ProjectDashboard";
import ProjectTabs from "./ProjectTabs";

// material-ui
import { Grid, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// ==============================|| PROJECT PAGE ||============================== //

const ProjectPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const checklistFetched = useRef(new Set()); // Track which projects we've fetched checklist for
  const { 
    singleProject: Project, 
    project_participants, 
    checklistItems,
    checklistLoading 
  } = useSelector((state) => state.projects);
  
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

  useEffect(() => {
    if (Project?.id && !checklistLoading && !checklistFetched.current.has(Project.id)) {
      console.log('Fetching checklist for project:', Project.id);
      checklistFetched.current.add(Project.id);
      dispatch(getProjectChecklist(Project.id));
    }
  }, [Project?.id, dispatch, checklistLoading]);

  const handleChecklistItemToggle = (item) => {
    const newCompletedState = !item.completed;
    
    dispatch(updateChecklistProgress({
      projectId: Project.id,
      checklistItemId: item.id,
      completed: newCompletedState,
      completedBy: 'current-user', // TODO: Replace with actual user ID
      notes: item.notes
    }));
  };


  if (Project) {
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
                      title: `${Project.title}`,
                      type: 'item',
                      url: `/projects/${Project.id}`,
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
              participants={project_participants.length}
              checklistItems={checklistItems}
              styles={styles}
            />
          </Box>

          {/* Project Tabs */}
          <ProjectTabs 
            project={Project}
            checklistItems={checklistItems}
            checklistLoading={checklistLoading}
            onChecklistToggle={handleChecklistItemToggle}
            styles={styles}
          />
        </Box>
    );
  } else return <ProjectNotFound/>;
};

export default ProjectPage;
