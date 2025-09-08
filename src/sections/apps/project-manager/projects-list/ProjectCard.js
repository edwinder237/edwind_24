import PropTypes from "prop-types";
import { useState, useEffect, useMemo, useCallback } from "react";
import getConfig from "next/config";
import NextLink from "next/link";
import { format } from "date-fns";

// Redux
import { useDispatch, useSelector } from "store";
import { removeProject, updateProject } from "store/reducers/projects";
import { openSnackbar } from "store/reducers/snackbar";

// Material-UI
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
  Select,
  FormControl,
  Tooltip,
} from "@mui/material";
import { EditOutlined, CheckOutlined, CloseOutlined } from "@mui/icons-material";
import { MoreOutlined } from "@ant-design/icons";

// Project Components
import AlertProjectDelete from "./AlertProjectDelete";
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import Loader from "components/Loader";
import { PROJECT_STATUS, STATUS_COLORS } from "constants/index";

// ===================|| CONSTANTS ||=================== //
const { publicRuntimeConfig } = getConfig();
const basePath = publicRuntimeConfig?.basePath || '';

const PROJECT_STATUSES = [
  { value: PROJECT_STATUS.ACTIVE, label: 'Active', color: STATUS_COLORS.active || 'success' },
  { value: PROJECT_STATUS.ONGOING, label: 'Ongoing', color: STATUS_COLORS.ongoing || 'success' },
  { value: PROJECT_STATUS.PENDING, label: 'Pending', color: STATUS_COLORS.pending || 'warning' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Completed', color: STATUS_COLORS.completed || 'primary' },
  { value: PROJECT_STATUS.CANCELLED, label: 'Cancelled', color: 'error' },
  { value: PROJECT_STATUS.POSTPONED, label: 'Postponed', color: 'warning' },
  { value: PROJECT_STATUS.SUSPENDED, label: 'Suspended', color: 'error' },
  { value: PROJECT_STATUS.ON_HOLD, label: 'On Hold', color: 'warning' },
  { value: PROJECT_STATUS.DRAFT, label: 'Draft', color: STATUS_COLORS.draft || 'info' },
  { value: PROJECT_STATUS.ARCHIVED, label: 'Archived', color: STATUS_COLORS.archived || 'default' }
];

const FALLBACK_IMAGE = `${basePath}/assets/images/logos/95983458_padded_logo.png`;

// ===================|| UTILITY FUNCTIONS ||=================== //

/**
 * Parse project tags from various formats to standardized topic objects
 * @param {string|Array|Object} tags - Raw tags from project
 * @returns {Array} Standardized topic objects
 */
const parseProjectTopics = (tags) => {
  if (!tags) return [];

  try {
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    
    if (!Array.isArray(parsedTags)) return [];

    return parsedTags.map((tag, index) => {
      let title = 'Unknown';
      
      if (typeof tag === 'string') {
        title = tag;
      } else if (tag && typeof tag === 'object') {
        title = tag.title || tag.label || tag.name || tag.text;
        
        // Fallback: extract first string value from object
        if (!title || typeof title !== 'string') {
          const stringValues = Object.values(tag).filter(v => typeof v === 'string' && v.length > 0);
          title = stringValues[0] || JSON.stringify(tag);
        }
      } else {
        title = String(tag);
      }

      return {
        id: `tag-${index}`,
        title: String(title),
        color: '#1976d2',
        icon: '📝'
      };
    });
  } catch (error) {
    return [];
  }
};

/**
 * Clean and validate image URL
 * @param {string} imageUrl - Raw image URL
 * @returns {string} Clean URL or empty string if invalid
 */
const cleanImageUrl = (imageUrl) => {
  const raw = imageUrl?.trim();
  
  // Check for invalid or placeholder URLs
  const invalidPatterns = [
    'null',
    'undefined',
    'image_url',
    'placeholder',
    '/image_url.jpg',
    'image_url.jpg'
  ];
  
  if (!raw || invalidPatterns.some(pattern => raw.toLowerCase().includes(pattern))) {
    return '';
  }
  
  // Check if it's a valid URL or path
  if (!raw.startsWith('http') && !raw.startsWith('https') && !raw.startsWith('/') && !raw.startsWith('data:')) {
    return '';
  }
  
  return raw;
};

/**
 * Get status configuration by value
 * @param {string} status - Status value
 * @returns {Object} Status configuration
 */
const getStatusConfig = (status) => {
  return PROJECT_STATUSES.find(s => s.value === status) || PROJECT_STATUSES[0];
};

// ===================|| CUSTOM HOOKS ||=================== //

/**
 * Hook for managing status editing functionality
 * @param {Object} project - Project object
 * @returns {Object} Status editing state and handlers
 */
const useStatusEditor = (project, dispatch) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusValue, setStatusValue] = useState(project?.projectStatus || PROJECT_STATUS.ACTIVE);

  useEffect(() => {
    setStatusValue(project?.projectStatus || PROJECT_STATUS.ACTIVE);
  }, [project?.projectStatus]);

  const handleStartEdit = useCallback(() => {
    setIsEditingStatus(true);
    setStatusValue(project?.projectStatus || PROJECT_STATUS.ACTIVE);
  }, [project?.projectStatus]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingStatus(false);
    setStatusValue(project?.projectStatus || PROJECT_STATUS.ACTIVE);
  }, [project?.projectStatus]);

  const handleSave = useCallback(async () => {
    if (statusValue === project?.projectStatus) {
      setIsEditingStatus(false);
      return;
    }

    try {
      const result = await dispatch(updateProject({
        id: project.id,
        projectStatus: statusValue
      }));

      if (result.success) {
        setIsEditingStatus(false);
        dispatch(openSnackbar({
          open: true,
          message: 'Project status updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      }
    } catch (error) {
      setStatusValue(project?.projectStatus || PROJECT_STATUS.ACTIVE);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to update project status',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  }, [dispatch, project?.id, project?.projectStatus, statusValue]);

  return {
    isEditingStatus,
    statusValue,
    setStatusValue,
    handleStartEdit,
    handleCancelEdit,
    handleSave
  };
};

/**
 * Hook for managing image loading with fallback
 * @param {string} imageUrl - Primary image URL
 * @returns {Object} Image state and handlers
 */
const useImageWithFallback = (imageUrl) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const validUrl = cleanImageUrl(imageUrl);
  const finalImageUrl = imageError || !validUrl ? FALLBACK_IMAGE : validUrl;

  return { finalImageUrl, handleImageError };
};

// ===================|| COMPONENTS ||=================== //

/**
 * Status display component with edit functionality
 */
const StatusDisplay = ({ project, statusEditor }) => {
  const { isEditingStatus, statusValue, setStatusValue, handleStartEdit, handleCancelEdit, handleSave } = statusEditor;

  if (isEditingStatus) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            displayEmpty
            size="small"
            sx={{ 
              '& .MuiSelect-select': { py: 0.5, fontSize: '0.75rem' },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid',
                borderColor: 'primary.main'
              }
            }}
          >
            {PROJECT_STATUSES.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                <Chip 
                  label={status.label} 
                  color={status.color} 
                  size="small" 
                  variant="light"
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Save changes">
          <IconButton size="small" onClick={handleSave} color="primary" sx={{ p: 0.5 }}>
            <CheckOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancel changes">
          <IconButton size="small" onClick={handleCancelEdit} color="secondary" sx={{ p: 0.5 }}>
            <CloseOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  const statusConfig = getStatusConfig(project?.projectStatus);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Chip 
        label={statusConfig.label.toUpperCase()} 
        color={statusConfig.color} 
        variant="light" 
        size="small" 
      />
      <Tooltip title="Edit project status">
        <IconButton 
          size="small" 
          onClick={handleStartEdit}
          color="primary"
          sx={{ p: 0.5, opacity: 0.7, '&:hover': { opacity: 1 } }}
        >
          <EditOutlined sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

/**
 * Training recipient display component
 */
const TrainingRecipientDisplay = ({ trainingRecipient }) => {
  if (!trainingRecipient) return null;

  return (
    <Box sx={{ 
      bgcolor: 'primary.50', 
      borderRadius: '6px', 
      px: 1, 
      py: 0.5
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
          {trainingRecipient.name}
        </Typography>
      </Stack>
    </Box>
  );
};

/**
 * Timeline display component
 */
const TimelineDisplay = ({ formattedDates }) => {
  return (
    <Box>
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          fontWeight: 600, 
          fontSize: '0.6rem',
          letterSpacing: '0.2px',
          textTransform: 'uppercase',
          mb: 0.25,
          display: 'block',
          opacity: 0.7
        }}
      >
        Timeline
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ 
          fontSize: '0.7rem',
          color: 'text.secondary',
          fontWeight: 400,
          opacity: 0.8
        }}
      >
        {formattedDates.start || 'Start not set'} - {formattedDates.end || 'End not set'}
      </Typography>
    </Box>
  );
};

/**
 * Topics display component
 */
const TopicsDisplay = ({ topics }) => {
  if (!topics || topics.length === 0) return null;

  return (
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
        {topics.slice(0, 2).map((topic) => (
          <Chip
            key={topic.id}
            label={String(topic.title || '')}
            size="small"
            variant="outlined"
            sx={{ 
              fontSize: '0.65rem', 
              height: 20,
              borderRadius: 0,
              borderColor: topic.color || 'primary.main',
              color: topic.color || 'primary.main',
              bgcolor: `${topic.color}10` || 'primary.lighter',
              '&:hover': {
                bgcolor: `${topic.color}20` || 'primary.light'
              }
            }}
          />
        ))}
        {topics.length > 2 && (
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
            +{topics.length - 2}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

// ===================|| MAIN COMPONENT ||=================== //

const ProjectCard = ({ Project, projectId }) => {
  const dispatch = useDispatch();
  const { projects, success } = useSelector((state) => state.projects);
  // Local state
  const [openAlert, setOpenAlert] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [projectTopics, setProjectTopics] = useState([]);
  
  // Custom hooks
  const statusEditor = useStatusEditor(Project, dispatch);
  const { finalImageUrl, handleImageError } = useImageWithFallback(Project?.backgroundImg);

  // Parse project topics when tags change
  useEffect(() => {
    setProjectTopics(parseProjectTopics(Project?.tags));
  }, [Project?.tags]);

  // Memoized computed values
  const formattedDates = useMemo(() => {
    if (!Project) return {};
    
    const formatSafeDate = (dateValue, formatString) => {
      if (!dateValue) return "";
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "";
        return format(date, formatString);
      } catch (error) {
        return "";
      }
    };

    // Get dates from project_settings first, fallback to project directly
    const startDate = Project.project_settings?.startDate || Project.startDate;
    const endDate = Project.project_settings?.endDate || Project.endDate;

    return {
      creation: formatSafeDate(Project.createdAt, "dd/MM/yyyy HH:mm"),
      start: formatSafeDate(startDate, "MMM dd, yyyy"),
      end: formatSafeDate(endDate, "MMM dd, yyyy")
    };
  }, [Project?.createdAt, Project?.startDate, Project?.endDate, Project?.project_settings?.startDate, Project?.project_settings?.endDate]);

  const publishChip = useMemo(() => {
    return Project?.published === false ? 
      <Chip label="PRIVATE" variant="outlined" size="small" /> : null;
  }, [Project?.published]);

  const mainInstructor = useMemo(() => {
    return Project?.project_instructors?.find(pi => pi.role === 'main')?.instructor || 
           Project?.project_instructors?.[0]?.instructor;
  }, [Project?.project_instructors]);

  // Event handlers
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

  // Loading state
  if (!Project) {
    return <Loader />;
  }

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
            <StatusDisplay project={Project} statusEditor={statusEditor} />
            {publishChip}

            <IconButton
              aria-label="project menu"
              color="secondary"
              onClick={handleMenuClick}
            >
              <MoreOutlined style={{ fontSize: "1.15rem" }} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              TransitionComponent={Fade}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleAlertClose}>Delete</MenuItem>
            </Menu>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Box sx={{ width: 1, m: "auto" }}>
            <CardMedia
              component="img"
              image={finalImageUrl}
              onError={handleImageError}
              sx={{
                cursor: "pointer",
                height: 130,
                textDecoration: "none",
                opacity: 1,
                objectFit: 'cover'
              }}
            />
          </Box>

          <CardContent sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              {/* Project Title & Training Recipient */}
              <Stack spacing={0.75}>
                <Typography
                  variant="h6"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    lineHeight: 1.3,
                    color: 'text.primary'
                  }}
                >
                  {Project.title}
                </Typography>
                
                <TrainingRecipientDisplay trainingRecipient={Project.training_recipient} />
              </Stack>

              {/* Refined Details in Two Columns */}
              <Grid 
                container 
                justifyContent="space-between" 
                alignItems="flex-start"
                sx={{ width: '100%' }}
              >
                {/* Left Column */}
                <Grid item xs="auto">
                  <Stack spacing={1}>
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
                    
                    <TimelineDisplay formattedDates={formattedDates} />
                  </Stack>
                </Grid>

                {/* Right Column */}
                <Grid item xs="auto">
                  <TopicsDisplay topics={projectTopics} />
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
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.7rem',
              color: 'text.secondary',
              fontWeight: 400,
              opacity: 0.8
            }}
          >
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
  Project: PropTypes.object.isRequired,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default ProjectCard;