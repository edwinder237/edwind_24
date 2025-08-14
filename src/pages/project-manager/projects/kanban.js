import { Grid, Typography, Paper, Box } from '@mui/material';
import { ProjectOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import Page from 'components/Page';

// ==============================|| PROJECTS KANBAN BOARD ||============================== //

const ProjectsKanban = () => {
  return (
    <Page title="Projects Kanban Board">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <ProjectOutlined style={{ fontSize: '48px', color: '#1976d2' }} />
            </Box>
            <Typography variant="h4" gutterBottom>
              Projects Kanban Board
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Placeholder kanban board for visual project management and task tracking.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Page>
  );
};

ProjectsKanban.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProjectsKanban;