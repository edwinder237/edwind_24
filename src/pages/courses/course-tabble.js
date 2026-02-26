import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "store";
import { getCourses, deleteCourse, deactivateCourse, activateCourse } from "store/reducers/courses";
import { openSnackbar } from "store/reducers/snackbar";

// next
import NextLink from "next/link";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import {
  Chip,
  Dialog,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  CircularProgress,
  Box,
  Paper,
  FormControlLabel,
  Switch,
} from "@mui/material";

// project import
import Layout from "layout";
import Page from "components/Page";
import MainCard from "components/MainCard";
import ScrollX from "components/ScrollX";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";
import AppTable, { SelectionCell, SelectionHeader } from "components/AppTable";

import { AddCourseForm } from "sections/apps/courses";
import { CourseDeleteAlert } from "sections/apps/courses";

// assets
import {
  CloseOutlined,
  EyeTwoTone,
  EditTwoTone,
  DeleteTwoTone,
  CopyOutlined,
} from "@ant-design/icons";

// ==============================|| COURSE LEVEL UTILITIES ||============================== //

const courseLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

const getLevelColor = (level, theme) => {
  switch (level?.toLowerCase()) {
    case 'beginner':
      return {
        color: theme.palette.success.main,
        bgcolor: alpha(theme.palette.success.main, 0.1)
      };
    case 'intermediate':
      return {
        color: theme.palette.info.main,
        bgcolor: alpha(theme.palette.info.main, 0.1)
      };
    case 'advanced':
      return {
        color: theme.palette.warning.main,
        bgcolor: alpha(theme.palette.warning.main, 0.1)
      };
    case 'expert':
      return {
        color: theme.palette.error.main,
        bgcolor: alpha(theme.palette.error.main, 0.1)
      };
    default:
      return {
        color: theme.palette.text.secondary,
        bgcolor: alpha(theme.palette.text.secondary, 0.1)
      };
  }
};

const CourseLevelChip = ({ level, theme }) => {
  const colors = getLevelColor(level, theme);
  return (
    <Chip
      label={level ? level.charAt(0).toUpperCase() + level.slice(1) : 'N/A'}
      size="small"
      sx={{
        color: colors.color,
        bgcolor: colors.bgcolor,
        fontWeight: 500,
        minWidth: 80
      }}
    />
  );
};

const CourseLevelLegend = ({ theme, showInactive, onToggleInactive }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Course Level Legend
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {courseLevels.map((level) => {
              const colors = getLevelColor(level, theme);
              return (
                <Box key={level} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: colors.color
                    }}
                  />
                  <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                    {level}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={showInactive}
              onChange={(event) => onToggleInactive(event.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="textSecondary">
              Show inactive courses
            </Typography>
          }
          labelPlacement="start"
          sx={{ m: 0 }}
        />
      </Stack>
    </Paper>
  );
};

// ==============================|| COURSE TABLE COMPONENTS ||============================== //

const ActionsCell = (
  row,
  setCustomer,
  setCourseToDelete,
  setDeleteDialogOpen,
  handleClose,
  handleAdd,
  theme,
  handleDuplicateCourse,
  duplicatingId
) => {
  const collapseIcon = row.isExpanded ? (
    <CloseOutlined style={{ color: theme.palette.error.main }} />
  ) : (
    <EyeTwoTone twoToneColor={theme.palette.secondary.main} />
  );
  const courseId = row.original.id;
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={0}
    >
      <Tooltip title="View">
        <IconButton
          color="secondary"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleRowExpanded();
          }}
        >
          {collapseIcon}
        </IconButton>
      </Tooltip>
      <NextLink href={`/courses/${courseId}`} passHref>
        <Tooltip title="Edit">
          <IconButton color="primary">
            <EditTwoTone twoToneColor={theme.palette.primary.main} />
          </IconButton>
        </Tooltip>
      </NextLink>
      <Tooltip title="Duplicate Course">
        <IconButton
          color="secondary"
          onClick={(e) => {
            e.stopPropagation();
            handleDuplicateCourse(row.original);
          }}
          disabled={duplicatingId === courseId}
        >
          {duplicatingId === courseId ? (
            <CircularProgress size={16} />
          ) : (
            <CopyOutlined />
          )}
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          color="error"
          onClick={async (e) => {
            e.stopPropagation();
            handleClose();
            
            // Fetch course details with associations
            try {
              const response = await fetch(`/api/courses/getCourseDetails?id=${row.original.id}`);
              const result = await response.json();
              
              if (result.success) {
                setCourseToDelete(result.course);
              } else {
                setCourseToDelete(row.original);
              }
            } catch (error) {
              console.error('Error fetching course details:', error);
              setCourseToDelete(row.original);
            }
            
            setDeleteDialogOpen(true);
          }}
        >
          <DeleteTwoTone twoToneColor={theme.palette.error.main} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

ActionsCell.propTypes = {
  row: PropTypes.object,
  setCustomer: PropTypes.func,
  setCourseToDelete: PropTypes.func,
  setDeleteDialogOpen: PropTypes.func,
  handleClose: PropTypes.func,
  handleAdd: PropTypes.func,
  theme: PropTypes.array,
  handleDuplicateCourse: PropTypes.func,
  duplicatingId: PropTypes.number,
};

const CoursesTable = () => {
  const dispatch = useDispatch();

  const { courses, modules, response } = useSelector((store) => store.courses);
  console.log("from coures-table",courses.filter((course)=>course.id === 1)[0]);
  console.log("All courses with maxParticipants:", courses.map(course => ({ 
    id: course.id, 
    title: course.title, 
    maxParticipants: course.maxParticipants 
  })));



  const [data, setData] = useState([{ name: "name" }]);
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [add, setAdd] = useState(false);
  const [course, setCourse] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

  useEffect(() => {
    // Filter courses based on showInactive toggle
    const filteredCourses = showInactive 
      ? courses 
      : courses.filter(course => course.isActive !== false);
    setData(filteredCourses);
  }, [courses, showInactive]);

  useEffect(() => {
    if (response && response.success) {
        dispatch(getCourses()); // Refresh courses list after any successful operation
    }
  }, [response, dispatch]);

  const theme = useTheme();


  const handleAdd = () => {
    setAdd(!add);
    if (course && !add) setCourse(null);
  };

  const handleClose = () => {
    setOpen(!open);
  };

  // Handle duplicate course
  const handleDuplicateCourse = async (course) => {
    try {
      setDuplicatingId(course.id);
      const response = await fetch('/api/courses/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: course.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Course duplicated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        // Refresh courses list
        dispatch(getCourses());
      } else {
        throw new Error(result.message || 'Failed to duplicate course');
      }
    } catch (error) {
      console.error('Error duplicating course:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to duplicate course',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setDuplicatingId(null);
    }
  };

  // Handle bulk delete courses
  const handleBulkDelete = async (selectedData, selectedIds) => {
    try {
      const courseNames = selectedData.map(course => course.title).join(', ');
      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${selectedData.length} course(s)?\n\nCourses: ${courseNames}\n\nThis action cannot be undone.`
      );
      
      if (!confirmDelete) return;

      // Delete each course using the same Redux action as single delete
      const deletePromises = selectedData.map(async (course) => {
        try {
          await dispatch(deleteCourse(course.id));
          return { success: true, course: course.title };
        } catch (error) {
          console.error(`Failed to delete ${course.title}:`, error);
          return { success: false, course: course.title, error: error.message };
        }
      });

      // Wait for all deletions to complete
      const results = await Promise.all(deletePromises);
      
      // Count successful and failed deletions
      const failedDeletes = results.filter(r => !r.success).map(r => r.course);
      const successCount = results.filter(r => r.success).length;

      // Show appropriate success/error message
      if (failedDeletes.length === 0) {
        dispatch(openSnackbar({
          open: true,
          message: `${successCount} course(s) deleted successfully`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else if (successCount > 0) {
        dispatch(openSnackbar({
          open: true,
          message: `${successCount} course(s) deleted, ${failedDeletes.length} failed: ${failedDeletes.join(', ')}`,
          variant: 'alert',
          alert: { color: 'warning' }
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: `Failed to delete courses: ${failedDeletes.join(', ')}`,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }

      // Refresh courses list
      dispatch(getCourses());
    } catch (error) {
      console.error('Error deleting courses:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to delete courses',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  // Handle bulk activate courses
  const handleBulkActivate = async (selectedData, selectedIds) => {
    try {
      const courseNames = selectedData.map(course => course.title).join(', ');
      const confirmActivate = window.confirm(
        `Are you sure you want to activate ${selectedData.length} course(s)?\n\nCourses: ${courseNames}\n\nActivated courses will be available for new curriculums and scheduling.`
      );
      
      if (!confirmActivate) return;

      // Activate each course using Redux action
      const activatePromises = selectedData.map(async (course) => {
        try {
          await dispatch(activateCourse(course.id));
          return { success: true, course: course.title };
        } catch (error) {
          console.error(`Failed to activate ${course.title}:`, error);
          return { success: false, course: course.title, error: error.message };
        }
      });

      // Wait for all activations to complete
      const results = await Promise.all(activatePromises);
      
      // Count successful and failed activations
      const failedActivates = results.filter(r => !r.success).map(r => r.course);
      const successCount = results.filter(r => r.success).length;

      // Show appropriate success/error message
      if (failedActivates.length === 0) {
        dispatch(openSnackbar({
          open: true,
          message: `${successCount} course(s) activated successfully`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else if (successCount > 0) {
        dispatch(openSnackbar({
          open: true,
          message: `${successCount} course(s) activated, ${failedActivates.length} failed: ${failedActivates.join(', ')}`,
          variant: 'alert',
          alert: { color: 'warning' }
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: `Failed to activate courses: ${failedActivates.join(', ')}`,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }

      // Refresh courses list
      dispatch(getCourses());
    } catch (error) {
      console.error('Error activating courses:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to activate courses',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  // Handle bulk deactivate courses
  const handleBulkDeactivate = async (selectedData, selectedIds) => {
    try {
      const courseNames = selectedData.map(course => course.title).join(', ');
      const confirmDeactivate = window.confirm(
        `Are you sure you want to deactivate ${selectedData.length} course(s)?\n\nCourses: ${courseNames}\n\nDeactivated courses will be hidden from new curriculums but existing associations will remain intact.`
      );
      
      if (!confirmDeactivate) return;

      // Deactivate each course using Redux action
      const deactivatePromises = selectedData.map(async (course) => {
        try {
          await dispatch(deactivateCourse(course.id));
          return { success: true, course: course.title };
        } catch (error) {
          console.error(`Failed to deactivate ${course.title}:`, error);
          return { success: false, course: course.title, error: error.message };
        }
      });

      // Wait for all deactivations to complete
      const results = await Promise.all(deactivatePromises);
      
      // Count successful and failed deactivations
      const failedDeactivates = results.filter(r => !r.success).map(r => r.course);
      const successCount = results.filter(r => r.success).length;

      // Show appropriate success/error message
      if (failedDeactivates.length === 0) {
        dispatch(openSnackbar({
          open: true,
          message: `${successCount} course(s) deactivated successfully`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else if (successCount > 0) {
        dispatch(openSnackbar({
          open: true,
          message: `${successCount} course(s) deactivated, ${failedDeactivates.length} failed: ${failedDeactivates.join(', ')}`,
          variant: 'alert',
          alert: { color: 'warning' }
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: `Failed to deactivate courses: ${failedDeactivates.join(', ')}`,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }

      // Refresh courses list
      dispatch(getCourses());
    } catch (error) {
      console.error('Error deactivating courses:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to deactivate courses',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  // Handle bulk duplicate courses
  const handleBulkDuplicate = async (selectedData, selectedIds) => {
    try {
      const courseNames = selectedData.map(course => course.title).join(', ');
      const confirmDuplicate = window.confirm(
        `Are you sure you want to duplicate ${selectedData.length} course(s)?\n\nCourses: ${courseNames}`
      );
      
      if (!confirmDuplicate) return;

      // Duplicate each course using individual API calls
      const duplicatePromises = selectedData.map(async (course) => {
        try {
          const response = await fetch('/api/courses/duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: course.id })
          });
          const result = await response.json();
          
          if (!response.ok || !result.success) {
            throw new Error(result.message || `Failed to duplicate ${course.title}`);
          }
          
          return { success: true, course: course.title };
        } catch (error) {
          return { success: false, course: course.title, error: error.message };
        }
      });

      // Wait for all duplications to complete
      const results = await Promise.all(duplicatePromises);
      
      // Count successful and failed duplications
      const failedDuplicates = results.filter(r => !r.success).map(r => r.course);
      const successCount = results.filter(r => r.success).length;

      // Show appropriate success/error message
      if (failedDuplicates.length === 0) {
        dispatch(openSnackbar({
          open: true,
          message: `${successCount} course(s) duplicated successfully`,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else if (successCount > 0) {
        dispatch(openSnackbar({
          open: true,
          message: `${successCount} course(s) duplicated, ${failedDuplicates.length} failed: ${failedDuplicates.join(', ')}`,
          variant: 'alert',
          alert: { color: 'warning' }
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: `Failed to duplicate courses: ${failedDuplicates.join(', ')}`,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }

      // Refresh courses list
      dispatch(getCourses());
    } catch (error) {
      console.error('Error duplicating courses:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to duplicate courses',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };


  const columns = useMemo(
    () => [
      {
        title: "Row Selection",
        Header: SelectionHeader,
        accessor: "selection",
        Cell: SelectionCell,
        disableSortBy: true,
      },
      {
        Header: "ID",
        accessor: "id",
        className: "cell-center",
      },
      {
        Header: "Course Name",
        accessor: "title",
        Cell: ({ row, value }) => {
          const isInactive = !row.original.isActive;
          const levelColors = getLevelColor(row.original.level, theme);
          return (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: levelColors.color,
                  flexShrink: 0
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: isInactive ? 'text.disabled' : 'inherit',
                  textDecoration: isInactive ? 'line-through' : 'none'
                }}
              >
                {value}
              </Typography>
              {isInactive && (
                <Chip 
                  label="Inactive" 
                  size="small" 
                  color="error" 
                  variant="outlined"
                />
              )}
            </Stack>
          );
        },
      },
      {
        Header: "Code",
        accessor: "code",
        className: "cell-center",
        minWidth: 100,
        Cell: ({ value }) => (
          <Typography 
            variant="body2" 
            sx={{ 
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textOverflow: 'clip'
            }}
          >
            {value}
          </Typography>
        ),
      },
      {
        Header: "Version",
        accessor: "version",
        className: "cell-center",
      },
      {
        Header: "Status",
        accessor: "courseStatus",
        className: "cell-center",
        Cell: ({ value }) => {
          const getStatusColor = (status) => {
            switch (status?.toLowerCase()) {
              case 'published':
                return { color: theme.palette.success.main, bgcolor: alpha(theme.palette.success.main, 0.1) };
              case 'draft':
                return { color: theme.palette.warning.main, bgcolor: alpha(theme.palette.warning.main, 0.1) };
              case 'archived':
                return { color: theme.palette.grey[500], bgcolor: alpha(theme.palette.grey[500], 0.1) };
              default:
                return { color: theme.palette.text.secondary, bgcolor: alpha(theme.palette.text.secondary, 0.1) };
            }
          };
          const colors = getStatusColor(value);
          return (
            <Chip
              label={value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'}
              size="small"
              sx={{
                color: colors.color,
                bgcolor: colors.bgcolor,
                fontWeight: 500,
                minWidth: 70
              }}
            />
          );
        },
      },
      {
        Header: "Duration",
        accessor: "duration",
        className: "cell-center",
        disableSortBy: true,
        Cell: ({ row }) => {
          const course = row.original;
          let totalDuration = 0;
          
          if (course.modules) {
            course.modules.forEach((module) => {
              let moduleDuration = 0;
              
              if (module.duration) {
                // Use explicit module duration if set
                moduleDuration = module.duration;
              } else if (module.activities && module.activities.length > 0) {
                // Calculate from activities if no explicit module duration
                moduleDuration = module.activities.reduce((actTotal, activity) => {
                  return actTotal + (activity.duration || 0);
                }, 0);
              }
              
              totalDuration += moduleDuration;
            });
          }
          
          return (
            <Typography variant="body2">
              {totalDuration > 0 ? `${totalDuration} min` : 'N/A'}
            </Typography>
          );
        },
      },
      {
        Header: "Max Participants",
        accessor: "maxParticipants",
        className: "cell-center",
        Cell: ({ value }) => (
          <Typography variant="body2">
            {value || 'Unlimited'}
          </Typography>
        ),
      },
      {
        Header: "Actions",
        className: "cell-center",
        disableSortBy: true,
        Cell: ({ row }) =>
          ActionsCell(
            row,
            setCustomer,
            setCourseToDelete,
            setDeleteDialogOpen,
            handleClose,
            handleAdd,
            theme,
            handleDuplicateCourse,
            duplicatingId
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, handleDuplicateCourse, duplicatingId]
  );

  const renderRowSubComponent = useCallback(
    ({ row }) => {
      const courseData = row.original;
      return (
        <TableRow>
          <TableCell colSpan={7} sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
            <Stack spacing={2}>
              <Typography variant="h6">Course Details</Typography>
              <Stack direction="row" spacing={4}>
                <Stack>
                  <Typography variant="body2" color="textSecondary">Summary:</Typography>
                  <Typography variant="body1">{courseData.summary || 'No summary available'}</Typography>
                </Stack>
                <Stack>
                  <Typography variant="body2" color="textSecondary">Level:</Typography>
                  <Typography variant="body1">{courseData.level || 'N/A'}</Typography>
                </Stack>
                <Stack>
                  <Typography variant="body2" color="textSecondary">Status:</Typography>
                  <Typography variant="body1">{courseData.courseStatus || 'N/A'}</Typography>
                </Stack>
                <Stack>
                  <Typography variant="body2" color="textSecondary">Max Participants:</Typography>
                  <Typography variant="body1">{courseData.maxParticipants || 'Unlimited'}</Typography>
                </Stack>
              </Stack>
              {courseData.modules && courseData.modules.length > 0 && (
                <Stack>
                  <Typography variant="body2" color="textSecondary">Modules ({courseData.modules.length}):</Typography>
                  {courseData.modules.slice(0, 3).map((module, index) => (
                    <Typography key={index} variant="body2">• {module.title}</Typography>
                  ))}
                  {courseData.modules.length > 3 && (
                    <Typography variant="body2" color="textSecondary">
                      ...and {courseData.modules.length - 3} more modules
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>
          </TableCell>
        </TableRow>
      );
    },
    [theme, data]
  );

  return (
    <Page title="Courses List">
      <CourseLevelLegend 
        theme={theme} 
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
      />
      <MainCard content={false}>
        <ScrollX>
          <AppTable
            columns={columns}
            data={data.length > 0 ? data : []}
            handleAdd={handleAdd}
            addButtonText="Add Course"
            renderRowSubComponent={renderRowSubComponent}
            initialSortBy={{ id: "title", desc: false }}
            initialHiddenColumns={["avatar", "id"]}
            responsiveHiddenColumns={["age", "contact", "visits", "status"]}
            csvFilename="courses-list.csv"
            emptyMessage="No courses available"
            onBulkDelete={handleBulkDelete}
            customMenuItems={[
              {
                label: "Activate Selected",
                icon: <EditTwoTone twoToneColor="#4caf50" />,
                onClick: handleBulkActivate
              },
              {
                label: "Deactivate Selected",
                icon: <EditTwoTone twoToneColor="#ff9800" />,
                onClick: handleBulkDeactivate
              },
              {
                label: "Duplicate Selected",
                icon: <CopyOutlined />,
                onClick: handleBulkDuplicate
              }
            ]}
          />
        </ScrollX>
        <CourseDeleteAlert
          course={courseToDelete}
          open={deleteDialogOpen}
          handleClose={() => {
            setDeleteDialogOpen(false);
            setCourseToDelete(null);
          }}
        />
        {/* add course dialog */}
        <Dialog
          maxWidth="sm"
          fullWidth
          onClose={handleAdd}
          open={add}
          sx={{ 
            "& .MuiDialog-paper": { 
              p: 0,
              maxHeight: '90vh',
              overflow: 'auto',
              maxWidth: '600px'
            },
            zIndex: 1300
          }}
          disablePortal={false}
          BackdropProps={{
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
          }}
        >
          <AddCourseForm course={course} onCancel={handleAdd} />
        </Dialog>

      </MainCard>
    </Page>
  );
};

CoursesTable.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CoursesTable;
