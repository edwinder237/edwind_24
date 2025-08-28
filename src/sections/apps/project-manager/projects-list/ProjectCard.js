import PropTypes from "prop-types";
import { useState, useEffect, useMemo, useCallback } from "react";

// redux
import { useDispatch, useSelector } from "store";
import { removeProject } from "store/reducers/projects";
// next
import NextLink from "next/link";
// material-ui
import {
  Box,
  Button,
  Chip,
  CardContent,
  Divider,
  Fade,
  Grid,
  Menu,
  MenuItem,
  Stack,
  Typography,
  CardMedia,
} from "@mui/material";

// third-party
import { format } from "date-fns";

// project import
import { openSnackbar } from "store/reducers/snackbar";
import AlertProjectDelete from "./AlertProjectDelete";
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";

// assets
import { MoreOutlined } from "@ant-design/icons";
import Loader from "components/Loader";

// ==============================|| PROJECT - CARD ||============================== //

const ProjectCard = ({ Project, projectId }) => {
  const dispatch = useDispatch();
  const [openAlert, setOpenAlert] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [projectTopics, setProjectTopics] = useState([]);
  const { projects, success } = useSelector((state) => state.projects);

  // Fetch project topics
  useEffect(() => {
    const fetchProjectTopics = async () => {
      if (!projectId) return;
      
      try {
        const response = await fetch(`/api/projects/${projectId}/topics`);
        if (response.ok) {
          const topics = await response.json();
          setProjectTopics(topics);
        }
      } catch (error) {
        console.error('Error fetching project topics:', error);
      }
    };

    fetchProjectTopics();
  }, [projectId]);

  // Memoized computed values for performance
  const formattedDates = useMemo(() => {
    if (!Project) return {};
    
    return {
      creation: Project.createdAt ? format(new Date(Project.createdAt), "dd/MM/yyyy HH:mm") : "",
      start: Project.startDate ? format(new Date(Project.startDate), "MMM dd, yyyy") : "",
      end: Project.endDate ? format(new Date(Project.endDate), "MMM dd, yyyy") : ""
    };
  }, [Project?.createdAt, Project?.startDate, Project?.endDate]);

  const statusChip = useMemo(() => {
    const status = Project?.projectStatus;
    const chipProps = {
      ongoing: { variant: "light", color: "success", size: "small" },
      completed: { variant: "light", color: "primary", size: "small" },
      pending: { variant: "light", color: "warning", size: "small" },
      cancelled: { variant: "light", color: "error", size: "small" }
    };
    
    const props = chipProps[status] || { variant: "light", color: "primary", size: "small" };
    const label = status ? status.toUpperCase() : "N/A";
    return <Chip label={label} {...props} />;
  }, [Project?.projectStatus]);

  const publishChip = useMemo(() => {
    return Project?.published === false ? 
      <Chip label="PRIVATE" variant="outlined" size="small" /> : null;
  }, [Project?.published]);

  const { tags, mainInstructor } = useMemo(() => {
    const parsedTags = Project?.tags && (Array.isArray(Project.tags) ? Project.tags : JSON.parse(Project.tags));
    const instructor = Project?.project_instructors?.find(pi => pi.role === 'main')?.instructor || 
                      Project?.project_instructors?.[0]?.instructor;
    
    return { tags: parsedTags, mainInstructor: instructor };
  }, [Project?.tags, Project?.project_instructors]);

  // Optimized event handlers
  const handleMenuClick = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleAlertClose = useCallback((action) => {
    setOpenAlert(!openAlert);
    handleMenuClose();
    if (action === true && Project?.id) {
      dispatch(removeProject(Project.id, projects));
      if (success !== false) {
        dispatch(openSnackbar({
          open: true,
          message: success,
          anchorOrigin: { vertical: "top", horizontal: "right" },
          variant: "alert",
          alert: { color: "success" },
          close: false,
        }));
      }
    }
  }, [openAlert, handleMenuClose, Project?.id, dispatch, projects, success]);

  if (!Project) {
    return <Loader />;
  }

  const openMenu = Boolean(anchorEl);

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
                  backgroundImage: Project?.backgroundImg && Project.backgroundImg.trim() !== "" 
                    ? `url(${Project.backgroundImg})` 
                    : 'url(https://images.unsplash.com/photo-1632668701519-46a3e6c0a299?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
            </Box>

            <CardContent sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                {/* Project Title & Training Recipient */}
                <Stack spacing={0.75}>
                  <NextLink href={`/projects/${projectId}`} passHref>
                    <Typography
                      color="textPrimary"
                      variant="h6"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        lineHeight: 1.3,
                        '&:hover': {
                          color: 'primary.main',
                          transform: 'translateY(-1px)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}
                    >
                      {Project.title}
                    </Typography>
                  </NextLink>
                  
                  {/* Training Recipient - Elegant display */}
                  {Project.training_recipient && (
                    <Box sx={{ 
                      bgcolor: 'primary.50', 
                      borderRadius: '6px', 
                      px: 1, 
                      py: 0.5,
                      border: '1px solid',
                      borderColor: 'primary.200'
                    }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography 
                          variant="caption" 
                          color="primary.600" 
                          sx={{ 
                            fontWeight: 700, 
                            fontSize: '0.65rem',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                          }}
                        >
                          For
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="primary.800" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}
                        >
                          {Project.training_recipient.name}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Stack>

                {/* Refined Details in Two Columns */}
                <Grid container spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                  {/* Left Column */}
                  <Grid item xs={5}>
                    <Stack spacing={1}>
                      {/* Duration */}
                      {(formattedDates.start || formattedDates.end) && (
                        <Box>
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '0.65rem',
                              letterSpacing: '0.3px',
                              textTransform: 'uppercase',
                              mb: 0.5,
                              display: 'block'
                            }}
                          >
                            Timeline
                          </Typography>
                          <Stack spacing={0.25}>
                            {formattedDates.start && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontSize: '0.75rem',
                                  color: 'success.main',
                                  fontWeight: 500
                                }}
                              >
                                ▶ {formattedDates.start}
                              </Typography>
                            )}
                            {formattedDates.end && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontSize: '0.75rem',
                                  color: 'warning.main',
                                  fontWeight: 500
                                }}
                              >
                                ⏹ {formattedDates.end}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      )}
                      
                      {/* Lead by */}
                      <Box>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            fontWeight: 700, 
                            fontSize: '0.65rem',
                            letterSpacing: '0.3px',
                            textTransform: 'uppercase',
                            mb: 0.5,
                            display: 'block'
                          }}
                        >
                          Lead by
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.primary"
                          sx={{ 
                            fontSize: '0.8rem',
                            fontWeight: 500
                          }}
                        >
                          {mainInstructor ? `${mainInstructor.firstName} ${mainInstructor.lastName}` : 'Unassigned'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Right Column */}
                  <Grid item xs={7}>
                    {/* Topics */}
                    {projectTopics && projectTopics.length > 0 && (
                      <Box>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            fontWeight: 700, 
                            fontSize: '0.65rem',
                            letterSpacing: '0.3px',
                            textTransform: 'uppercase',
                            mb: 0.5,
                            display: 'block'
                          }}
                        >
                          Topics
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                          {projectTopics.slice(0, 2).map((topic) => (
                            <Chip
                              key={topic.id}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  {topic.icon && <span style={{ fontSize: '10px' }}>{topic.icon}</span>}
                                  {topic.title}
                                </Box>
                              }
                              size="small"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.65rem', 
                                height: 20,
                                borderRadius: '10px',
                                borderColor: topic.color || 'primary.main',
                                color: topic.color || 'primary.main',
                                bgcolor: `${topic.color}10` || 'primary.lighter',
                                '&:hover': {
                                  bgcolor: `${topic.color}20` || 'primary.light'
                                }
                              }}
                            />
                          ))}
                          {projectTopics.length > 2 && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                fontSize: '0.65rem',
                                fontWeight: 500,
                                bgcolor: 'grey.100',
                                px: 0.5,
                                py: 0.25,
                                borderRadius: '4px'
                              }}
                            >
                              +{projectTopics.length - 2}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Stack>
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
              Created: {formattedDates.creation}  by: {Project?.user?.name}
            </Typography>
            <Stack direction="row" spacing={1}>
              <NextLink href={`/projects/${projectId}`} passHref>
                <Button variant="contained" size="small">
                  Open
                </Button>
              </NextLink>
            </Stack>
          </Stack>
        </MainCard>

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
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ProjectCard;
