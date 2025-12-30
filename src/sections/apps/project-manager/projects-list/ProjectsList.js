import { useMemo, useState, useEffect, Fragment } from "react";
import { useDispatch, useSelector } from "store";
import { getProjects } from "store/reducers/project";
import { motion, AnimatePresence } from "framer-motion";
import useUser from "hooks/useUser";
import axios from "utils/axios";

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
  Alert,
  CircularProgress,
  Paper,
  Chip,
  InputLabel,
  OutlinedInput,
  Autocomplete,
  TextField,
  Divider,
  IconButton,
  Collapse,
} from "@mui/material";

// project import
import Loader from "components/Loader";
import { PopupTransition } from "components/@extended/Transitions";
import { EmptyUserCard, ProjectsListSkeleton } from "components/cards/skeleton";
import ProjectCard from "./ProjectCard";
import AddProject from "./AddProject";
import DateRangeFilterButton from "components/DateRangeFilter";

import { GlobalFilter } from "utils/react-table";
import usePagination from "hooks/usePagination";
import { PROJECT_STATUS_CONFIG } from "constants/index";

// assets
import { PlusOutlined, ReloadOutlined, FilterOutlined, ClearOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";
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
  // Optimized selector - only get what the project list page needs
  const { projects, isAdding, error, loading: reduxLoading } = useSelector((state) => ({
    projects: state.projects.projects,
    isAdding: state.projects.isAdding,
    error: state.projects.error,
    loading: state.projects.loading
  }));
  const dispatch = useDispatch();
  const [localError, setLocalError] = useState(null);

  // Get current user for role-based filtering
  const { user } = useUser();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Organization users for admin filter
  const [orgUsers, setOrgUsers] = useState([]);

  const fetchProjects = async () => {
    try {
      setLocalError(null);
      console.log("calling project Store ")
      await dispatch(getProjects());
    } catch (err) {
      setLocalError('Failed to load projects. Please try again.');
      console.error('Error fetching projects:', err);
    }
  };

  // Load projects on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadProjects = async () => {
      if (isMounted) {
        await fetchProjects();
      }
    };
    
    loadProjects();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not when isAdding changes

  // Fetch organization users for admin user filter
  useEffect(() => {
    const fetchOrgUsers = async () => {
      if (!isAdmin) return;

      try {
        const response = await axios.get('/api/organization/users');
        if (response.data?.success && response.data?.users) {
          setOrgUsers(response.data.users);
        }
      } catch (err) {
        console.error('Error fetching organization users:', err);
      }
    };

    fetchOrgUsers();
  }, [isAdmin]);

  const matchDownSM = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const [sortBy, setSortBy] = useState("Default");
  const [globalFilter, setGlobalFilter] = useState("");
  const [add, setAdd] = useState(false);
  const [project, setProject] = useState(null);
  const [userCard, setUserCard] = useState([]);
  const [page, setPage] = useState(1);
  
  // Filter states - always shown by default
  const [showFilters, setShowFilters] = useState(true);
  const [statusFilter, setStatusFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [trainingRecipientFilter, setTrainingRecipientFilter] = useState([]);
  const [userFilter, setUserFilter] = useState([]);
  const [tagFilter, setTagFilter] = useState([]);
  const [organizationFilter, setOrganizationFilter] = useState([]);
  const [subOrganizationFilter, setSubOrganizationFilter] = useState([]);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const handleChange = (event) => {
    setSortBy(event.target.value);
  };
  const handleAdd = () => {
    setAdd(!add);
    if (project && !add) setProject(null);
  };

  // Filter helpers
  const clearAllFilters = () => {
    setStatusFilter([]);
    setTypeFilter([]);
    setTrainingRecipientFilter([]);
    setUserFilter([]);
    setTagFilter([]);
    setOrganizationFilter([]);
    setSubOrganizationFilter([]);
    setDateRange({ start: null, end: null });
    setGlobalFilter("");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter.length > 0) count++;
    if (typeFilter.length > 0) count++;
    if (trainingRecipientFilter.length > 0) count++;
    if (userFilter.length > 0) count++;
    if (tagFilter.length > 0) count++;
    if (organizationFilter.length > 0) count++;
    if (subOrganizationFilter.length > 0) count++;
    if (dateRange.start || dateRange.end) count++;
    if (globalFilter) count++;
    return count;
  };

  // Get unique values for filter options
  const getUniqueValues = (key) => {
    if (!isValidProjectsArray) return [];

    // For user filter: if admin, show all organization users
    if (key === 'user') {
      if (isAdmin && orgUsers.length > 0) {
        // Return all organization users' names
        return orgUsers.map(u => u.name).filter(Boolean);
      }
      // Non-admin: only show users from existing projects
      const values = projects.map(project => project.user?.name).filter(Boolean);
      return [...new Set(values)];
    }

    const values = projects.map(project => {
      if (key === 'training_recipient') {
        return project.training_recipient?.name;
      }
      if (key === 'organization') {
        return project.sub_organization?.organization?.title;
      }
      if (key === 'sub_organization') {
        return project.sub_organization?.title;
      }
      if (key === 'tags') {
        const tags = project.tags && (Array.isArray(project.tags) ? project.tags : JSON.parse(project.tags));
        return tags || [];
      }
      return project[key];
    }).filter(Boolean);

    if (key === 'tags') {
      return [...new Set(values.flat().map(tag => tag.label || tag))];
    }
    return [...new Set(values)];
  };

  // Detect if we have an error state
  const hasError = localError || 
    (typeof error === 'string' ? error : null) || 
    (projects && typeof projects === 'object' && projects.error && typeof projects.error === 'string' ? projects.error : null);
  
  // Use Redux loading state
  const loading = reduxLoading;
  
  // Validate projects data
  const isValidProjectsArray = Array.isArray(projects) && projects.every(project => 
    project && typeof project === 'object' && !project.error && typeof project.title === 'string'
  );

  // Enhanced search and filter
  useEffect(() => {
    if (hasError || !isValidProjectsArray) {
      setUserCard([]);
      return;
    }

    let filteredData = projects || [];

    // Apply filters
    filteredData = filteredData.filter((project) => {
      // Global search filter
      if (globalFilter) {
        const searchTerm = globalFilter.toLowerCase();
        const matchesTitle = project.title?.toLowerCase().includes(searchTerm);
        const matchesSummary = project.summary?.toLowerCase().includes(searchTerm);
        const matchesRecipient = project.training_recipient?.name?.toLowerCase().includes(searchTerm);
        if (!matchesTitle && !matchesSummary && !matchesRecipient) return false;
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(project.projectStatus)) {
        return false;
      }

      // Type filter
      if (typeFilter.length > 0 && !typeFilter.includes(project.projectType)) {
        return false;
      }

      // Training recipient filter
      if (trainingRecipientFilter.length > 0) {
        const recipientName = project.training_recipient?.name;
        if (!recipientName || !trainingRecipientFilter.includes(recipientName)) {
          return false;
        }
      }

      // User filter (project creator)
      if (userFilter.length > 0) {
        const userName = project.user?.name;
        if (!userName || !userFilter.includes(userName)) {
          return false;
        }
      }

      // Tag filter
      if (tagFilter.length > 0) {
        const projectTags = project.tags && (Array.isArray(project.tags) ? project.tags : JSON.parse(project.tags));
        const projectTagLabels = projectTags?.map(tag => tag.label || tag) || [];
        const hasMatchingTag = tagFilter.some(filterTag => projectTagLabels.includes(filterTag));
        if (!hasMatchingTag) return false;
      }

      // Organization filter
      if (organizationFilter.length > 0) {
        const organizationName = project.sub_organization?.organization?.title;
        if (!organizationName || !organizationFilter.includes(organizationName)) {
          return false;
        }
      }

      // Sub-Organization filter
      if (subOrganizationFilter.length > 0) {
        const subOrganizationName = project.sub_organization?.title;
        if (!subOrganizationName || !subOrganizationFilter.includes(subOrganizationName)) {
          return false;
        }
      }

      // Date range filter
      if (dateRange.start || dateRange.end) {
        // Get dates from project_settings first, fallback to project directly
        const projectStartDate = project.project_settings?.startDate || project.startDate;
        const projectEndDate = project.project_settings?.endDate || project.endDate;
        
        // If project has dates, check if they fall within the filter range
        if (projectStartDate || projectEndDate) {
          const projectStart = projectStartDate ? new Date(projectStartDate) : null;
          const projectEnd = projectEndDate ? new Date(projectEndDate) : null;
          
          // For projects with dates, check if they fall within the filter range
          // We check if ANY part of the project overlaps with the filter range
          if (dateRange.start && dateRange.end) {
            const filterStart = new Date(dateRange.start);
            const filterEnd = new Date(dateRange.end);
            
            // Check for overlap: project must start before filter ends AND end after filter starts
            if (projectStart && projectStart > filterEnd) return false;
            if (projectEnd && projectEnd < filterStart) return false;
          } else if (dateRange.start) {
            const filterStart = new Date(dateRange.start);
            // Project must end after or on the filter start date
            if (projectEnd && projectEnd < filterStart) return false;
          } else if (dateRange.end) {
            const filterEnd = new Date(dateRange.end);
            // Project must start before or on the filter end date
            if (projectStart && projectStart > filterEnd) return false;
          }
        }
        // Note: Projects without dates are included when date filter is active
        // Change to 'return false' if you want to exclude projects without dates
      }

      return true;
    });

    // Apply sorting
    const sortedData = [...filteredData].sort((a, b) => {
      switch (sortBy) {
        case 'Title':
          return (a.title || '').localeCompare(b.title || '');
        
        case 'Start Date':
          const aStartDate = a.project_settings?.startDate || a.startDate;
          const bStartDate = b.project_settings?.startDate || b.startDate;
          
          if (!aStartDate && !bStartDate) return 0;
          if (!aStartDate) return 1; // Put items without dates at the end
          if (!bStartDate) return -1;
          
          const dateA = new Date(aStartDate);
          const dateB = new Date(bStartDate);
          
          // Check for invalid dates
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          
          return dateA - dateB;
        
        case 'End Date':
          const aEndDate = a.project_settings?.endDate || a.endDate;
          const bEndDate = b.project_settings?.endDate || b.endDate;
          
          if (!aEndDate && !bEndDate) return 0;
          if (!aEndDate) return 1; // Put items without dates at the end
          if (!bEndDate) return -1;
          
          const endDateA = new Date(aEndDate);
          const endDateB = new Date(bEndDate);
          
          // Check for invalid dates
          if (isNaN(endDateA.getTime()) && isNaN(endDateB.getTime())) return 0;
          if (isNaN(endDateA.getTime())) return 1;
          if (isNaN(endDateB.getTime())) return -1;
          
          return endDateA - endDateB;
        
        case 'Default':
        default:
          // Sort by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });


    setUserCard(sortedData);
    setPage(1); // Reset to first page when filters change
  }, [
    globalFilter,
    statusFilter,
    typeFilter,
    trainingRecipientFilter,
    userFilter,
    tagFilter,
    organizationFilter,
    subOrganizationFilter,
    dateRange,
    sortBy,
    projects,
    hasError,
    isValidProjectsArray
  ]);

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

  // Error Display Component
  const ErrorDisplay = () => (
    <Grid item xs={12}>
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3, display: 'inline-flex', alignItems: 'center' }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchProjects}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ReloadOutlined />}
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Retry'}
            </Button>
          }
        >
          {localError || 
           (typeof error === 'string' ? error : null) || 
           'Failed to load projects. Please try again.'}
        </Alert>
      </Box>
    </Grid>
  );

  // Loading Display Component
  const LoadingDisplay = () => (
    <ProjectsListSkeleton itemCount={6} />
  );

  return (
    <Fragment>
      {/* Main Filter Bar */}
      <Paper elevation={0} sx={{ p: matchDownSM ? 2 : 3, mb: matchDownSM ? 2 : 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack spacing={showFilters ? 3 : 1.5}>
          {/* Header Row: Search, Filters, Sort, and Add */}
          <Stack
            direction={matchDownSM ? "column" : "row"}
            spacing={2}
            justifyContent="space-between"
            alignItems={matchDownSM ? "stretch" : "center"}
            sx={{
              flexWrap: 'nowrap' // Prevent wrapping
            }}
          >
            {/* Left Side: Search */}
            <Box sx={{
              flex: '1 1 auto',
              minWidth: 0, // Allow shrinking
              maxWidth: matchDownSM ? '100%' : '50%'
            }}>
              <GlobalFilter
                preGlobalFilteredRows={projects || []}
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            </Box>

            {/* Right Side: Filters, Sort and Add */}
            <Stack
              direction={matchDownSM ? "column" : "row"}
              spacing={1.5}
              alignItems={matchDownSM ? "stretch" : "center"}
              sx={{
                flexShrink: 0,
                flexWrap: 'nowrap'
              }}
            >
              {!showFilters && (
                <Button
                  variant="outlined"
                  startIcon={<DownOutlined />}
                  onClick={() => setShowFilters(true)}
                  size="medium"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Filters
                  {getActiveFilterCount() > 0 && (
                    <Chip
                      label={getActiveFilterCount()}
                      size="small"
                      color="primary"
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Button>
              )}

              <FormControl sx={{
                minWidth: matchDownSM ? 'auto' : 150,
                maxWidth: 180
              }}>
                <Select
                  value={sortBy}
                  onChange={handleChange}
                  displayEmpty
                  size="medium"
                  renderValue={(selected) => (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selected ? `Sort: ${selected}` : "Sort By"}
                    </Typography>
                  )}
                >
                  {allColumns.map((column) => (
                    <MenuItem key={column.id} value={column.header}>
                      {column.header}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <AddButton
                variant="contained"
                startIcon={<PlusOutlined />}
                onClick={handleAdd}
                fullWidth={matchDownSM}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: matchDownSM ? 2 : 2.5,
                  py: matchDownSM ? 1.5 : 1,
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  background: 'linear-gradient(135deg, #00BCD4 0%, #2196F3 50%, #1A237E 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00ACC1 0%, #1976D2 50%, #0D47A1 100%)',
                  }
                }}
              >
                Add Project
              </AddButton>
            </Stack>
          </Stack>

          {/* Filters Panel */}
          <Collapse in={showFilters}>
            {/* Filter Controls Section */}
            <Box sx={{
              bgcolor: 'grey.50',
              p: matchDownSM ? 1.5 : 2.5,
              borderRadius: 1,
              position: 'relative'
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Filter Options
                  {getActiveFilterCount() > 0 && (
                    <Chip
                      label={getActiveFilterCount()}
                      size="small"
                      color="primary"
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  {getActiveFilterCount() > 0 && (
                    <Button
                      onClick={clearAllFilters}
                      size="small"
                      startIcon={<ClearOutlined />}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' }
                      }}
                    >
                      Clear All
                    </Button>
                  )}

                  <IconButton
                    onClick={() => setShowFilters(false)}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    title="Hide filters"
                  >
                    <UpOutlined />
                  </IconButton>
                </Stack>
              </Stack>
                
                <Grid container spacing={matchDownSM ? 1.5 : 2.5} alignItems="flex-start">
                  {/* Status Filter */}
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <FormControl fullWidth size="medium">
                      <Select
                        multiple
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        displayEmpty
                        size="medium"
                        renderValue={(selected) => (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selected.length > 0 ? `Status (${selected.length})` : "Status"}
                          </Typography>
                        )}
                      >
                        {PROJECT_STATUS_CONFIG.map((status) => (
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
                  </Grid>

                  {/* Type Filter */}
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <FormControl fullWidth size="medium">
                      <Select
                        multiple
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        displayEmpty
                        size="medium"
                        renderValue={(selected) => (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selected.length > 0 ? `Type (${selected.length})` : "Type"}
                          </Typography>
                        )}
                      >
                        {getUniqueValues('projectType').map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Training Recipient Filter */}
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <FormControl fullWidth size="medium">
                      <Select
                        multiple
                        value={trainingRecipientFilter}
                        onChange={(e) => setTrainingRecipientFilter(e.target.value)}
                        displayEmpty
                        size="medium"
                        renderValue={(selected) => (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selected.length > 0 ? `Training Recipient (${selected.length})` : "Training Recipient"}
                          </Typography>
                        )}
                      >
                        {getUniqueValues('training_recipient').map((recipient) => (
                          <MenuItem key={recipient} value={recipient}>
                            {recipient}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* User Filter */}
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <FormControl fullWidth size="medium">
                      <Select
                        multiple
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        displayEmpty
                        size="medium"
                        renderValue={(selected) => (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selected.length > 0 ? `User (${selected.length})` : "User"}
                          </Typography>
                        )}
                      >
                        {getUniqueValues('user').map((user) => (
                          <MenuItem key={user} value={user}>
                            {user}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Topics Filter */}
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <FormControl fullWidth size="medium">
                      <Select
                        multiple
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        displayEmpty
                        size="medium"
                        renderValue={(selected) => (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selected.length > 0 ? `Topics (${selected.length})` : "Topics"}
                          </Typography>
                        )}
                      >
                        {getUniqueValues('tags').map((tag) => (
                          <MenuItem key={tag} value={tag}>
                            {tag}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Organization Filter */}
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <FormControl fullWidth size="medium">
                      <Select
                        multiple
                        value={organizationFilter}
                        onChange={(e) => setOrganizationFilter(e.target.value)}
                        displayEmpty
                        size="medium"
                        renderValue={(selected) => (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selected.length > 0 ? `Organization (${selected.length})` : "Organization"}
                          </Typography>
                        )}
                      >
                        {getUniqueValues('organization').map((org) => (
                          <MenuItem key={org} value={org}>
                            {org}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Sub-Organization Filter */}
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <FormControl fullWidth size="medium">
                      <Select
                        multiple
                        value={subOrganizationFilter}
                        onChange={(e) => setSubOrganizationFilter(e.target.value)}
                        displayEmpty
                        size="medium"
                        renderValue={(selected) => (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selected.length > 0 ? `Sub-Organization (${selected.length})` : "Sub-Organization"}
                          </Typography>
                        )}
                      >
                        {getUniqueValues('sub_organization').map((subOrg) => (
                          <MenuItem key={subOrg} value={subOrg}>
                            {subOrg}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Date Range Filter */}
                  <Grid item xs={12} sm={6} md={4} lg={2}>
                    <DateRangeFilterButton
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>

          {/* Results Summary - Always visible */}
          <Box sx={{ textAlign: matchDownSM ? 'center' : 'right' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              <strong>{userCard.length}</strong> of <strong>{projects?.length || 0}</strong> projects
              {getActiveFilterCount() > 0 && (
                <span style={{ color: 'var(--mui-palette-primary-main)' }}>
                  {' '}• {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
                </span>
              )}
            </Typography>
          </Box>
        </Stack>
      </Paper>
      {hasError ? (
        <Grid container spacing={3}>
          <ErrorDisplay />
        </Grid>
      ) : loading ? (
        <LoadingDisplay />
      ) : userCard.length > 0 ? (
        <Grid container spacing={matchDownSM ? 2 : 3}>
          <AnimatePresence mode="popLayout">
            {userCard.map((project, index) => (
              <Grid item xs={12} sm={6} md={6} lg={4} key={project.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ 
                    duration: 0.3,
                    layout: { duration: 0.4, ease: "easeInOut" }
                  }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <ProjectCard
                    Project={project}
                    projectId={project.id}
                  />
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      ) : (
        <EmptyUserCard title={"You have not created any projects yet."} />
      )}
      {!hasError && !loading && userCard.length > 0 && (
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
      )}

      {/* add project dialog */}
      <Dialog
        maxWidth="sm"
        fullWidth
        fullScreen={matchDownSM}
        TransitionComponent={matchDownSM ? Slide : PopupTransition}
        TransitionProps={matchDownSM ? { direction: "up" } : {}}
        onClose={handleAdd}
        open={add}
        sx={{ 
          "& .MuiDialog-paper": { 
            p: 0,
            ...(matchDownSM && {
              margin: 0,
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: 0
            })
          }
        }}
      >
        <AddProject project={project} onCancel={handleAdd} />
      </Dialog>
    </Fragment>
  );
};

export default ProjectsList;
