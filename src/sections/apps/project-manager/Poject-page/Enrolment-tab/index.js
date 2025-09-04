// react
import { useState, lazy, Suspense } from "react";
import { useSelector } from 'store';

// material-ui
import { 
  Grid, 
  Tabs, 
  Tab, 
  Box, 
  Card,
  CircularProgress,
  Typography
} from "@mui/material";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";

// project import
import Layout from "layout";
import Page from "components/Page";
import GroupTable from "./Groups";

// Lazy load the Participants table for better performance
const ParticipantTable = lazy(() => import("./ParticipantsTable"));

// ==============================|| TAB PANEL COMPONENT ||============================== //

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`enrollment-tabpanel-${index}`}
      aria-labelledby={`enrollment-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
    <CircularProgress />
    <Typography sx={{ ml: 2 }}>Loading...</Typography>
  </Box>
);

// ==============================|| ENROLLMENT TAB WITH SUB-TABS ||============================== //

const EnrolmentTAB = ({ index }) => {
  const [tabValue, setTabValue] = useState(0); // Default to Groups tab
  const { singleProject } = useSelector((state) => state.projects);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Page title={`${singleProject?.title || 'Project'} - Enrollment`}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="enrollment sub-tabs"
                sx={{ px: 2 }}
              >
                <Tab 
                  label="Groups" 
                  icon={<TeamOutlined />} 
                  iconPosition="start"
                  id="enrollment-tab-0"
                  aria-controls="enrollment-tabpanel-0"
                />
                <Tab 
                  label="Participants" 
                  icon={<UserOutlined />} 
                  iconPosition="start"
                  id="enrollment-tab-1"
                  aria-controls="enrollment-tabpanel-1"
                />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <GroupTable index={index} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Suspense fallback={<LoadingFallback />}>
                <ParticipantTable index={index} />
              </Suspense>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>
    </Page>
  );
};

EnrolmentTAB.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default EnrolmentTAB;
