import { useRef } from 'react';

// material-ui
import { Grid } from '@mui/material';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import OrganizationProfile from 'sections/organization/OrganizationProfile';
import OrganizationFormTab from 'sections/organization/OrganizationFormTab';

// ==============================|| ORGANIZATION SETTINGS ||============================== //

const OrganizationSettings = () => {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <Page title="Organization Settings">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <OrganizationProfile focusInput={focusInput} />
        </Grid>
        <Grid item xs={12}>
          <OrganizationFormTab inputRef={inputRef} />
        </Grid>
      </Grid>
    </Page>
  );
};

OrganizationSettings.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default OrganizationSettings;