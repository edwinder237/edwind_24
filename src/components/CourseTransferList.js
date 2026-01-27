import React, { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Card,
  CardHeader,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  TextField,
  InputAdornment,
  Grid,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Search, ChevronRight, ChevronLeft } from '@mui/icons-material';

/**
 * CourseTransferList - A transfer list component for managing courses in a curriculum
 *
 * @param {Array} allCourses - Array of ALL course objects available in the organization
 * @param {Array} assignedCourseIds - Array of course IDs currently assigned to the curriculum
 * @param {Function} onAssignmentChange - Callback when assignment changes: (newAssignedIds) => void
 */
const CourseTransferList = ({ allCourses, assignedCourseIds, onAssignmentChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Internal state
  const [leftChecked, setLeftChecked] = useState([]);
  const [rightChecked, setRightChecked] = useState([]);
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');

  // Derive left (unassigned) and right (assigned) lists from props
  const unassignedCourses = useMemo(() => {
    return allCourses.filter(course => !assignedCourseIds.includes(course.id));
  }, [allCourses, assignedCourseIds]);

  const assignedCourses = useMemo(() => {
    return allCourses.filter(course => assignedCourseIds.includes(course.id));
  }, [allCourses, assignedCourseIds]);

  // Reset checked items when dialog opens/courses change
  useEffect(() => {
    setLeftChecked([]);
    setRightChecked([]);
  }, [allCourses]);

  // Filter function for search
  const filterCourses = (courses, searchTerm) => {
    if (!searchTerm) return courses;
    const search = searchTerm.toLowerCase();
    return courses.filter(course =>
      course.title?.toLowerCase().includes(search) ||
      course.code?.toLowerCase().includes(search) ||
      course.version?.toLowerCase().includes(search)
    );
  };

  // Filtered lists
  const filteredLeft = useMemo(() => filterCourses(unassignedCourses, leftSearch), [unassignedCourses, leftSearch]);
  const filteredRight = useMemo(() => filterCourses(assignedCourses, rightSearch), [assignedCourses, rightSearch]);

  // Toggle handlers
  const handleToggleLeft = (courseId) => {
    setLeftChecked(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleToggleRight = (courseId) => {
    setRightChecked(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  // Select all handlers
  const handleSelectAllLeft = () => {
    if (leftChecked.length === filteredLeft.length) {
      setLeftChecked([]);
    } else {
      setLeftChecked(filteredLeft.map(c => c.id));
    }
  };

  const handleSelectAllRight = () => {
    if (rightChecked.length === filteredRight.length) {
      setRightChecked([]);
    } else {
      setRightChecked(filteredRight.map(c => c.id));
    }
  };

  // Move handlers - add courses to curriculum
  const handleMoveRight = () => {
    const newAssigned = [...assignedCourseIds, ...leftChecked];
    onAssignmentChange(newAssigned, leftChecked, []); // (allAssigned, toAdd, toRemove)
    setLeftChecked([]);
  };

  // Move handlers - remove courses from curriculum
  const handleMoveLeft = () => {
    const newAssigned = assignedCourseIds.filter(id => !rightChecked.includes(id));
    onAssignmentChange(newAssigned, [], rightChecked); // (allAssigned, toAdd, toRemove)
    setRightChecked([]);
  };

  // Render course list item
  const renderCourseItem = (course, checked, onToggle) => (
    <ListItem key={course.id} dense disablePadding>
      <ListItemButton onClick={() => onToggle(course.id)} dense>
        <ListItemIcon sx={{ minWidth: 36 }}>
          <Checkbox
            edge="start"
            checked={checked.includes(course.id)}
            tabIndex={-1}
            disableRipple
            size="small"
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="body2" fontWeight={600} noWrap>
              {course.title}
            </Typography>
          }
          secondary={
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              {course.code && (
                <Chip
                  label={course.code}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
              {course.version && (
                <Chip
                  label={`v${course.version}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Stack>
          }
        />
      </ListItemButton>
    </ListItem>
  );

  // Render a transfer list panel
  const renderList = (title, courses, filteredCourses, checked, onToggle, onSelectAll, search, onSearchChange, emptyMessage) => {
    const allChecked = filteredCourses.length > 0 && checked.length === filteredCourses.length;
    const someChecked = checked.length > 0 && checked.length < filteredCourses.length;

    return (
      <Card
        variant="outlined"
        sx={{
          height: { xs: 320, md: 400 },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardHeader
          avatar={
            <Checkbox
              onClick={onSelectAll}
              checked={allChecked}
              indeterminate={someChecked}
              disabled={filteredCourses.length === 0}
              size="small"
            />
          }
          title={
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
          }
          subheader={`${checked.length}/${courses.length} selected`}
          sx={{ py: 1.5, px: 2 }}
        />
        <Divider />
        <Box sx={{ px: 2, py: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, code, or version..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider />
        <List
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            py: 0,
          }}
        >
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => renderCourseItem(course, checked, onToggle))
          ) : (
            <ListItem>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ width: '100%', textAlign: 'center', py: 4 }}
              >
                {search ? 'No courses match your search' : emptyMessage}
              </Typography>
            </ListItem>
          )}
        </List>
      </Card>
    );
  };

  // Transfer buttons
  const renderTransferButtons = () => (
    <Stack
      direction={isMobile ? 'row' : 'column'}
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{ py: isMobile ? 2 : 0 }}
    >
      <Button
        variant="contained"
        size="small"
        onClick={handleMoveRight}
        disabled={leftChecked.length === 0}
        sx={{ minWidth: isMobile ? 100 : 80 }}
        endIcon={<ChevronRight />}
      >
        Add
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={handleMoveLeft}
        disabled={rightChecked.length === 0}
        sx={{ minWidth: isMobile ? 100 : 80 }}
        startIcon={<ChevronLeft />}
      >
        Remove
      </Button>
    </Stack>
  );

  return (
    <Grid
      container
      spacing={2}
      alignItems="center"
      justifyContent="center"
      direction={isMobile ? 'column' : 'row'}
    >
      {/* Left Panel: Unassigned Courses */}
      <Grid item xs={12} md={5}>
        {renderList(
          'Available Courses',
          unassignedCourses,
          filteredLeft,
          leftChecked,
          handleToggleLeft,
          handleSelectAllLeft,
          leftSearch,
          setLeftSearch,
          'No courses available'
        )}
      </Grid>

      {/* Middle: Transfer Buttons */}
      <Grid item xs={12} md={2}>
        {renderTransferButtons()}
      </Grid>

      {/* Right Panel: Assigned Courses */}
      <Grid item xs={12} md={5}>
        {renderList(
          'Assigned Courses',
          assignedCourses,
          filteredRight,
          rightChecked,
          handleToggleRight,
          handleSelectAllRight,
          rightSearch,
          setRightSearch,
          'No courses assigned'
        )}
      </Grid>
    </Grid>
  );
};

export default CourseTransferList;
