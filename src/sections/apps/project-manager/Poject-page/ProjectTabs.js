import React from 'react';
import PropTypes from 'prop-types';
import dynamic from "next/dynamic";
import {
  Box,
  Grid,
  Tabs,
  Tab,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import Loader from "components/Loader";
import TabSettings from "./Settings-tab/TabSettings";
import SearchContainer from "./Curriculum-tab/SearchContainer";
import ProjectChecklist from "./ProjectChecklist";
import AgendaTab from "./Agenda-tab";
import getTabIcons from "utils/getTabIcons";

// Dynamic imports
const EnrolmentTAB = dynamic(() =>
  import("sections/apps/project-manager/Poject-page/Enrolment-tab").catch(
    (err) => console.error(err)
  )
);

const OverviewTab = dynamic(() =>
  import("./Overview-tab").catch(
    (err) => console.error(err)
  ),
  {
    ssr: false,
    loading: () => <Loader />
  }
);

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

// ==============================|| PROJECT TABS ||============================== //

const ProjectTabs = ({ 
  project,
  projectCurriculums,
  checklistItems,
  checklistLoading,
  onChecklistToggle,
  styles
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Grid
      item
      xs={12}
      sx={{
        bgcolor: theme.palette.grey[100],
        boxShadow: theme.shadows[4]
      }}
    >
      <Grid item xs={12}>
        <Tabs
          value={tabValue}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          aria-label="navigation tabs"
        >
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <CalendarOutlined />
                <span>Agenda</span>
              </Box>
            }
            {...a11yProps(0)} 
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <DashboardOutlined />
                <span>Overview</span>
              </Box>
            }
            {...a11yProps(1)} 
          />
          <Tab
            label={
              <Box sx={styles.tabLabel}>
                <BookOutlined />
                <span>Curriculum</span>
                {getTabIcons(projectCurriculums.length > 0)}
              </Box>
            }
            {...a11yProps(2)}
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <TeamOutlined />
                <span>Enrollment</span>
              </Box>
            }
            {...a11yProps(3)} 
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <CheckSquareOutlined />
                <span>Checklist</span>
                {checklistItems.length > 0 && getTabIcons(
                  checklistItems.length > 0 && 
                  checklistItems.every(item => item.completed)
                )}
              </Box>
            }
            {...a11yProps(4)} 
          />
          <Tab 
            label={
              <Box sx={styles.tabLabel}>
                <SettingOutlined />
                <span>Settings</span>
              </Box>
            }
            {...a11yProps(5)} 
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <AgendaTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <OverviewTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <SearchContainer projectId={project.id} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <EnrolmentTAB index={0} />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <ProjectChecklist 
            checklistItems={checklistItems}
            checklistLoading={checklistLoading}
            onToggleItem={onChecklistToggle}
            styles={styles}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <TabSettings />
        </TabPanel>
      </Grid>
    </Grid>
  );
};

ProjectTabs.propTypes = {
  project: PropTypes.object.isRequired,
  projectCurriculums: PropTypes.array.isRequired,
  checklistItems: PropTypes.array.isRequired,
  checklistLoading: PropTypes.bool.isRequired,
  onChecklistToggle: PropTypes.func.isRequired,
  styles: PropTypes.object.isRequired
};

export default ProjectTabs;