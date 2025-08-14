import { useState } from "react";

// material-ui
import {
  Button,
  CardContent,
  Chip,
  Checkbox,
  Drawer,
  FormControlLabel,
  Grid,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Box,
} from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import CardTable from "./cardTable";
import { useSelector } from "store";
import CollapsibleGroup from "./collapsibleGroup";
import ModuleCard from "../drawer/moduleCard";

// ===========================|| DATA WIDGET - TODO LIST ||=========================== //

const CurriculumCard = ({ curriculum }) => {
  const [drawer, setDrawer] = useState(false);
  const { project_curriculums } = useSelector((state) => state.projects);

  const Curriculum = curriculum.curriculum;
  const courses = Curriculum?.curriculum_courses || [];

  const [items, setItems] = useState(courses);

  function handleToggleDrawer() {
    setDrawer((prevState) => !prevState);
  }

  // use for add group later
  function handleAddItems(newItem) {
    const newIt = { title: "new thing" };
    setItems([...items, newIt]);
  }

  return (
    <MainCard
      title={Curriculum?.title}
      content={false}
      secondary={
        <Grid
          container
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Grid item>
            <Tooltip title="Show Courses">
              <Button variant="contained" onClick={handleToggleDrawer}>
                View Courses
              </Button>
              <Drawer
                anchor={'right'}
                open={drawer}
                onClose={handleToggleDrawer}
              >
                <ModuleCard 
                  curriculum={curriculum} 
                  onClose={handleToggleDrawer}
                />
              </Drawer>
            </Tooltip>
          </Grid>
        </Grid>
      }
      sx={{ "& .MuiCardHeader-root": { p: 1.75 } }}
    >
      <Grid
        sx={{ p: 2.5 }}
        container
        direction="row"
        justifyContent="space-around"
        alignItems="center"
      >
        <Grid item>
          <Grid
            container
            direction="column"
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item>
              <Typography variant="subtitle2" color="secondary">
                Courses
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h4">{courses.length}</Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <Grid
            container
            direction="column"
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item>
              <Typography variant="subtitle2" color="secondary">
                Completion
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h4">56%</Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <Grid
            container
            direction="column"
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item>
              <Typography variant="subtitle2" color="secondary">
                Event Count
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h4">5</Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {courses.length > 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Courses in this Curriculum
          </Typography>
          {courses.slice(0, 3).map((curriculumCourse, index) => (
            <Box 
              key={curriculumCourse.course.id} 
              sx={{ 
                p: 2, 
                mb: 1, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {curriculumCourse.course.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Course ID: {curriculumCourse.course.id}
              </Typography>
            </Box>
          ))}
          {courses.length > 3 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              +{courses.length - 3} more courses. Click "View Courses" to see all.
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No courses assigned to this curriculum yet.
          </Typography>
        </Box>
      )}
    </MainCard>
  );
};

export default CurriculumCard;
