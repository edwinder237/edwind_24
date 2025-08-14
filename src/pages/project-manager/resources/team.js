import { Grid, Typography, Paper, Box } from '@mui/material';
import { TeamOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import Page from 'components/Page';

// ==============================|| TEAM MEMBERS ||============================== //

const TeamMembers = () => {
  return (
    <Page title="Team Members">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <TeamOutlined style={{ fontSize: '48px', color: '#1976d2' }} />
            </Box>
            <Typography variant="h4" gutterBottom>
              Team Members
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Placeholder table for managing team members and their roles.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Page>
  );
};

TeamMembers.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default TeamMembers;