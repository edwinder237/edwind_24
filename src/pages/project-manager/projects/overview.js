import { Grid, Typography, Paper, Box } from '@mui/material';
import { ProjectOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import Page from 'components/Page';

// ==============================|| PROJECTS OVERVIEW ||============================== //

const ProjectsOverview = () => {
  return (
    <Page title="Projects Overview">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <ProjectOutlined style={{ fontSize: '48px', color: '#1976d2' }} />
            </Box>
            <Typography variant="h4" gutterBottom>
              Projects Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Placeholder overview dashboard for all projects with summary metrics.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Page>
  );
};

ProjectsOverview.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProjectsOverview;