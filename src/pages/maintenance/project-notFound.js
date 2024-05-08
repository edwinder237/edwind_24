// next
import Image from 'next/image';
import NextLink from 'next/link';

// material-ui
import { Box, Button, Grid, Stack, Typography } from '@mui/material';

// project import
import { APP_DEFAULT_PATH } from 'config';
import Layout from 'layout';

// assets
const error404 = '/assets/images/maintenance/Error404.png';
const TwoCone = '/assets/images/maintenance/TwoCone.png';

// ==============================|| ERROR 404 - MAIN ||============================== //

function ProjectNotFound() {
  return (
      <Grid
        container
        spacing={10}
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: '10vh', pt: 1.5, pb: 1, overflow: 'hidden' }}
      >
        <Grid item xs={12}>
          <Stack direction="row">
            <Grid
              item
              sx={{
                position: 'relative',
                width: { xs: 250, sm: 250 },
                height: { xs: 130, sm: 130 }
              }}
            >
              <Image src={error404} alt="mantis" layout="fill" />
            </Grid>
  
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <Stack spacing={2} justifyContent="center" alignItems="center">
            <Typography variant="h1">Project Not Found</Typography>
            <Typography color="textSecondary" align="center" sx={{ width: { xs: '73%', sm: '61%' } }}>
              The page you are looking was moved, removed, renamed, or might never exist!
            </Typography>
            <NextLink href={'/projects'} passHref>
              <Button variant="contained">Back To Projects</Button>
            </NextLink>
          </Stack>
        </Grid>
      </Grid>
  );
}

ProjectNotFound.getLayout = function getLayout(page) {
  return <Layout variant="blank">{page}</Layout>;
};

export default ProjectNotFound;
