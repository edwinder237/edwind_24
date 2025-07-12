import { useMemo, useState, useEffect, Fragment } from "react";
import { useDispatch, useSelector } from "store";
import { getProjects } from "store/reducers/projects";

// material-ui
import {
  Grid,
  Stack,
  useMediaQuery,
  Button,
  FormControl,
  Select,
  MenuItem,
  Box,
  Dialog,
  Slide,
  Pagination,
  Typography,
} from "@mui/material";

// project import
import Loader from "components/Loader";
import { PopupTransition } from "components/@extended/Transitions";
import EmptyUserCard from "components/cards/skeleton/EmptyUserCard";
import ProjectCard from "./ProjectCard";
import AddProject from "./AddProject";

import { GlobalFilter } from "utils/react-table";
import usePagination from "hooks/usePagination";

// assets
import { PlusOutlined } from "@ant-design/icons";
import AddButton from "../../../../components/StyledButtons";

// ==============================|| PROJECTS - CARDS ||============================== //

const allColumns = [
  {
    id: 1,
    header: "Default",
  },
  {
    id: 2,
    header: "Title",
  },
  {
    id: 3,
    header: "Start Date",
  },
  {
    id: 4,
    header: "End Date",
  },
];

const ProjectsList = () => {
  const { projects, isAdding } = useSelector((state) => state.projects);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getProjects());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdding]);

  const matchDownSM = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const [sortBy, setSortBy] = useState("Default");
  const [globalFilter, setGlobalFilter] = useState("");
  const [add, setAdd] = useState(false);
  const [project, setProject] = useState(null);
  const [userCard, setUserCard] = useState([]);
  const [page, setPage] = useState(1);
  const handleChange = (event) => {
    setSortBy(event.target.value);
  };
  const handleAdd = () => {
    setAdd(!add);
    if (project && !add) setProject(null);
  };

  // search
  useEffect(() => {
    const newData =
      projects?.length > 0 &&
      projects.filter((value) => {
        if (globalFilter) {
          return value.title.toLowerCase().includes(globalFilter.toLowerCase());
        } else {
          return value;
        }
      });
    setUserCard(newData);
  }, [globalFilter, projects]);

  const PER_PAGE = 6;

  const count = Math.ceil(userCard.length / PER_PAGE);
  const _DATA = usePagination(userCard, PER_PAGE);

  const handleChangePage = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };
  // Replace with your authentication logic
  const mockAuthData = {
    user: { name: 'John Doe' },
    sub_organization_Id: 'default-org'
  };

  return (
    <Fragment>
      <>
        created by {mockAuthData.user?.name} and org {mockAuthData.sub_organization_Id}{" "}
      </>
      <Box sx={{ position: "relative", marginBottom: 3 }}>
        <Stack direction="row" alignItems="center">
          <Stack
            direction={matchDownSM ? "column" : "row"}
            sx={{ width: "100%" }}
            spacing={1}
            justifyContent="space-between"
            alignItems="center"
          >
            <GlobalFilter
              preGlobalFilteredRows={projects}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
            <Stack
              direction={matchDownSM ? "column" : "row"}
              alignItems="center"
              spacing={1}
            >
              <FormControl sx={{ m: 1, minWidth: 120 }}>
                <Select
                  id="global-filter"
                  value={sortBy}
                  onChange={handleChange}
                  displayEmpty
                  inputProps={{ "aria-label": "Without label" }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <Typography variant="subtitle1">Sort By</Typography>
                      );
                    }

                    return (
                      <Typography variant="subtitle2">
                        Sort by ({sortBy})
                      </Typography>
                    );
                  }}
                >
                  {allColumns.map((column) => {
                    return (
                      <MenuItem key={column.id} value={column.header}>
                        {column.header}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <AddButton
                variant="contained"
                startIcon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add Project
              </AddButton>
            </Stack>
          </Stack>
        </Stack>
      </Box>
      <Grid container spacing={3}>
        {userCard.length > 0 ? (
          userCard.map((project, index) => (
            <Slide key={index} direction="up" in={true} timeout={50}>
              <Grid item xs={12} sm={6} lg={4}>
                <ProjectCard
                  key={project.id}
                  Project={projects[index]}
                  projectId={project.id}
                />
              </Grid>
            </Slide>
          ))
        ) : (
          <EmptyUserCard title={"You have not created any projects yet."} />
        )}
      </Grid>
      <Stack spacing={2} sx={{ p: 2.5 }} alignItems="flex-end">
        <Pagination
          count={count}
          size="medium"
          page={page}
          showFirstButton
          showLastButton
          variant="combined"
          color="primary"
          onChange={handleChangePage}
        />
      </Stack>

      {/* add project dialog */}
      <Dialog
        maxWidth="sm"
        fullWidth
        TransitionComponent={PopupTransition}
        onClose={handleAdd}
        open={add}
        sx={{ "& .MuiDialog-paper": { p: 0 } }}
      >
        <AddProject project={project} onCancel={handleAdd} />
      </Dialog>
    </Fragment>
  );
  return <Loader />;
};

export default ProjectsList;
