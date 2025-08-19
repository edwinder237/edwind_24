// material-ui
import { Container, Grid, Typography, Card, CardContent } from '@mui/material';

// ==============================|| LANDING - TESTIMONIAL BLOCK ||============================== //

const TestimonialBlock = () => (
  <Container>
    <Grid container alignItems="center" justifyContent="center" spacing={2} sx={{ mt: { md: 10, xs: 2.5 }, mb: { md: 10, xs: 2.5 } }}>
      <Grid item xs={12}>
        <Grid container spacing={1} justifyContent="center" sx={{ mb: 4, textAlign: 'center' }}>
          <Grid item sm={10} md={6}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              What Our Users Say
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              "EDWIND has transformed how we manage our training programs. The intuitive interface and comprehensive features make it easy to track participant progress and manage multiple training projects simultaneously."
            </Typography>
            <Typography variant="subtitle2" color="primary">
              - Training Manager
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Container>
);

export default TestimonialBlock;