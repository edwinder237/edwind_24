import { Grid, Typography, Paper, Box } from '@mui/material';
import { BarChartOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import Page from 'components/Page';

// ==============================|| METRICS ||============================== //

const Metrics = () => {
  return (
    <Page title="Metrics">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <BarChartOutlined style={{ fontSize: '48px', color: '#1976d2' }} />
            </Box>
            <Typography variant="h4" gutterBottom>
              Metrics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Placeholder dashboard for detailed project metrics and analytics.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Page>
  );
};

Metrics.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Metrics;