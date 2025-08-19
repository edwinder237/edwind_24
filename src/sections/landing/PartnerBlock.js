// material-ui
import { Container, Grid, Typography } from '@mui/material';

// ==============================|| LANDING - PARTNER BLOCK ||============================== //

const PartnerBlock = () => (
  <Container>
    <Grid container alignItems="center" justifyContent="center" spacing={2} sx={{ mt: { md: 10, xs: 2.5 }, mb: { md: 10, xs: 2.5 } }}>
      <Grid item xs={12}>
        <Grid container spacing={1} justifyContent="center" sx={{ mb: 4, textAlign: 'center' }}>
          <Grid item sm={10} md={6}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              Trusted by Organizations
            </Typography>
            <Typography variant="body1">
              Used by leading organizations for their training and development needs.
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  </Container>
);

export default PartnerBlock;