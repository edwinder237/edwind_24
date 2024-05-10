import PropTypes from "prop-types";
import { useState, useEffect } from "react";

//redux
import { useDispatch, useSelector } from "store";
import { removeProject } from "store/reducers/projects";
// next
import NextLink from "next/link";
// material-ui
import {
  AvatarGroup,
  Box,
  Button,
  Chip,
  CardContent,
  Dialog,
  Divider,
  Fade,
  Grid,
  List,
  ListItem,
  Menu,
  MenuItem,
  Stack,
  Typography,
  CardMedia,
} from "@mui/material";

// third-party
import { format } from "date-fns";
import { PopupTransition } from "components/@extended/Transitions";

// project import
import { openSnackbar } from "store/reducers/snackbar";
import ProjectPreview from "./ProjectPreview";
import AlertProjectDelete from "./AlertProjectDelete";
import AddProject from "./AddProject";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";

// assets
import { MoreOutlined } from "@ant-design/icons";
import Loader from "components/Loader";

// ==============================|| PROJECT - CARD ||============================== //

const ProjectCard = ({ Project, projectId }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [add, setAdd] = useState(false);
  const { projects, success } = useSelector((state) => state.projects);

  if (!Project) {
    return <Loader />;
  }
  
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  //console.log(Project);

  const handleAlertClose = (action) => {
    setOpenAlert(!openAlert);
    handleMenuClose();
    const projectId = Project?.id;
    if (action === true) {
      dispatch(removeProject(projectId, projects));
      if (success !== false) {
        dispatch(
          openSnackbar({
            open: true,
            message: success,
            anchorOrigin: { vertical: "top", horizontal: "right" },
            variant: "alert",
            alert: {
              color: "success",
            },
            close: false,
          })
        );
      }
    }
  };

  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAdd = () => {
    setAdd(!add);
  };

  let formatedCreationDate = "";

  if (Project && Project.createdAt) {
    formatedCreationDate = format(
      new Date(Project.createdAt),
      "dd/MM/yyyy HH:mm"
    );
  }

  let statusChip;
  const { projectStatus } = Project || {};
  switch (projectStatus) {
    case "ongoing":
      statusChip = (
        <Chip label={projectStatus} variant="outlined" color="success" />
      );
      break;
    case "completed":
      statusChip = (
        <Chip
          variant="light"
          color="primary"
          size="small"
          label={projectStatus}
        />
      );
      break;
    case "pending":
      statusChip = (
        <Chip
          variant="light"
          color="warning"
          size="small"
          label={projectStatus}
        />
      );
      break;
    case "cancelled":
      statusChip = (
        <Chip
          variant="light"
          color="error"
          size="small"
          label={projectStatus}
        />
      );
      break;
    default:
      statusChip = <Chip label="draft" variant="outlined" color="error" />;
  }
  let publishChip;
  const { published } = Project || {};
  switch (published) {
    case false:
      publishChip = <Chip label="private" variant="outlined" size="small" />;
      break;
    default:
      null;
  }

  const tags = Project?.tags && JSON.parse(Project.tags);
  const creator = Project?.user?.name;

  const instructors = ["marc", "Matthew", "Jamal"];

  if (Project)
    return (
      <>
        <MainCard
          sx={{
            height: 1,
            "&:hover": {
              transform: "scale3d(1.02, 1.02, 1)",
              transition: "all .4s ease-in-out",
            },
            "& .MuiCardContent-root": {
              height: 1,
              display: "flex",
              flexDirection: "column",
              bgcolor: "",
            },
          }}
        >
          <Grid bgcolor="" width="110%" container spacing={2.25}>
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pr: 2,
              }}
            >
              {statusChip}
              {publishChip}

              <IconButton
                aria-label="comments"
                color="secondary"
                onClick={handleMenuClick}
              >
                <MoreOutlined style={{ fontSize: "1.15rem" }} />
              </IconButton>

              <Menu
                id="fade-menu"
                MenuListProps={{
                  "aria-labelledby": "fade-button",
                }}
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                TransitionComponent={Fade}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <MenuItem onClick={handleAdd}>Edit</MenuItem>
                <MenuItem onClick={handleAlertClose}>Delete</MenuItem>
              </Menu>
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Box sx={{ width: 1, m: "auto" }}>
              <CardMedia
                sx={{
                  cursor: "pointer",
                  height: 130,
                  textDecoration: "none",
                  opacity: 1,
                }}
                image="https://f.hubspotusercontent30.net/hubfs/3277184/employee%20training%20and%20development.png"
              />
            </Box>

            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stack spacing="10px">
                    <Stack spacing="1px">
                      <Stack spacing={1} direction="row">
                        <Typography variant="body2" color="textPrimary">
                          Tags:
                        </Typography>
                        {tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag.label}
                            size="small"
                            color="primary"
                          />
                        ))}
                      </Stack>
                    </Stack>

                    <Stack alignItems="center" direction="row">
                      <Typography variant="body2" color="textPrimary">
                        Instructors:
                      </Typography>

                      <AvatarGroup max={4}>
                        {instructors.map((instructor, index) => (
                          <Avatar key={index} alt="Marc" size="xs">
                            {instructor.charAt(0).toUpperCase()}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    </Stack>
                    <Stack>
                      <NextLink href={`/projects/${projectId}`} passHref>
                        <Typography
                          color="textPrimary"
                          variant="h5"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                            cursor: "pointer",
                          }}
                        >
                          {Project.title}
                        </Typography>
                      </NextLink>
                      <Typography variant="h6" color="textSecondary">
                        description
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Grid>
          <Divider />
          <Stack
            direction="row"
            className="hideforPDf"
            alignItems="center"
            spacing={1}
            justifyContent="space-between"
            sx={{ mt: "auto", mb: 0, pt: 2.25 }}
          >
            <Typography variant="caption" color="secondary">
              Created: {formatedCreationDate}  by: {creator}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" onClick={handleClickOpen}>
                Preview
              </Button>

              <NextLink href={`/projects/${projectId}`} passHref>
                <Button variant="contained" size="small">
                  Open
                </Button>
              </NextLink>
            </Stack>
          </Stack>
        </MainCard>

        {/* edit Project dialog */}
        <Dialog
          maxWidth="sm"
          fullWidth
          TransitionComponent={PopupTransition}
          onClose={handleAdd}
          open={add}
          sx={{ "& .MuiDialog-paper": { p: 0 } }}
        >
          <AddProject project={Project} onCancel={handleAdd} />
        </Dialog>
        <ProjectPreview
          course={Project}
          customer={Project}
          open={open}
          onClose={handleClose}
        />
        <AlertProjectDelete
          title={Project.title}
          open={openAlert}
          handleClose={handleAlertClose}
        />
      </>
    );
};

ProjectCard.propTypes = {
  Project: PropTypes.object,
};

export default ProjectCard;
