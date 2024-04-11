// material-ui
import { Grid } from "@mui/material";

// project import
import Layout from "layout";
import Page from "components/Page";
import GroupTable from "./Groups";
import ParticipantTable from "./ParticipantsTable";

// ==============================|| REACT TABLE - GROUPING ||============================== //

const EnrolmentTAB = ({ index }) => {
  return (
    <Page title={`${null} Enrollment`}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <GroupTable index={index} />
        </Grid>
        <Grid item xs={12}>
          <ParticipantTable index={index} />
        </Grid>
      </Grid>
    </Page>
  );
};

EnrolmentTAB.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default EnrolmentTAB;
