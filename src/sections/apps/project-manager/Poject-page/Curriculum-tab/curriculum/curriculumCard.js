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

  const [items, setItems] = useState(Curriculum?.curriculum_courses);

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
              <Button  variant="contained" onClick={handleToggleDrawer}>Expend</Button>
              <Drawer
                anchor={'right'}
                open={drawer}
                onClose={handleToggleDrawer}
              >
                <ModuleCard />
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
                Group Count
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h4">3</Typography>
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

      <CollapsibleGroup data={items} />
    </MainCard>
  );
};

export default CurriculumCard;
