// material-ui
import { Grid } from '@mui/material';

// project import
import ProjectCardSkeleton from './ProjectCard';

// ===========================|| SKELETON - PROJECTS LIST ||=========================== //

const ProjectsListSkeleton = ({ itemCount = 6 }) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: itemCount }, (_, index) => (
        <Grid key={index} item xs={12} sm={6} lg={4}>
          <ProjectCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProjectsListSkeleton;