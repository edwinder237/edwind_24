import React, { useState, useMemo } from 'react';
import {
  Typography,
  Button,
  Stack,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  Autocomplete,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { selectProjectCurriculums, selectAvailableCurriculums, addCurriculumToProject, removeCurriculumFromProject } from 'store/reducers/project/settings';
import MainCard from 'components/MainCard';

const ProjectCurriculumCard = ({ projectId }) => {
  const dispatch = useDispatch();

  const projectCurriculums = useSelector(selectProjectCurriculums);
  const availableCurriculums = useSelector(selectAvailableCurriculums);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuCurriculum, setMenuCurriculum] = useState(null);

  // Filter out already-assigned curriculums
  const availableForAdd = useMemo(() => {
    const assignedIds = new Set(projectCurriculums.map(pc => pc.curriculum?.id || pc.curriculumId));
    return availableCurriculums.filter(c => !assignedIds.has(c.id));
  }, [projectCurriculums, availableCurriculums]);

  const handleAddCurriculum = async () => {
    if (!selectedCurriculum) return;

    try {
      setAdding(true);
      await dispatch(addCurriculumToProject(projectId, selectedCurriculum.id));

      dispatch(openSnackbar({
        open: true,
        message: 'Curriculum added to project successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));

      setAddDialogOpen(false);
      setSelectedCurriculum(null);
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to add curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCurriculum = async (projectCurriculum) => {
    if (!projectCurriculum) return;

    try {
      setRemoving(true);
      setMenuAnchor(null);

      await dispatch(removeCurriculumFromProject(
        projectId,
        projectCurriculum.curriculumId,
        projectCurriculum.id
      ));

      dispatch(openSnackbar({
        open: true,
        message: 'Curriculum removed successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } catch (error) {
      console.error('Error removing curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to remove curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setRemoving(false);
    }
  };

  const handleMenuClick = (event, projectCurriculum) => {
    setMenuAnchor(event.currentTarget);
    setMenuCurriculum(projectCurriculum);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuCurriculum(null);
  };

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">Curriculums</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            disabled={availableForAdd.length === 0}
          >
            Add Curriculum
          </Button>
        </Box>

        {projectCurriculums.length === 0 ? (
          <Alert severity="info">
            No curriculums assigned to this project yet. Click &quot;Add Curriculum&quot; to get started.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {projectCurriculums.map((pc) => (
              <Stack
                key={pc.curriculum.id}
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {pc.curriculum.title}
                  </Typography>
                  <Chip
                    icon={<SchoolIcon />}
                    label={`${pc.curriculum.curriculum_courses?.length || 0} courses`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, pc)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleRemoveCurriculum(menuCurriculum);
          }}
          disabled={removing}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            {removing ? (
              <CircularProgress size={16} color="error" />
            ) : (
              <DeleteIcon fontSize="small" color="error" />
            )}
          </ListItemIcon>
          <ListItemText>
            {removing ? 'Removing...' : 'Remove from Project'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Curriculum Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setSelectedCurriculum(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <MainCard
          title={
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <MenuBookIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="medium">
                  Add Curriculum to Project
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search by name or code
                </Typography>
              </Box>
            </Stack>
          }
          content={false}
          sx={{
            m: 0,
            height: '100%',
            '& .MuiCardHeader-root': {
              pb: 2
            }
          }}
        >
          <Divider />

          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              {availableForAdd.length === 0 ? (
                <Alert severity="info">
                  All available curriculums are already assigned to this project.
                </Alert>
              ) : (
                <Autocomplete
                  options={availableForAdd}
                  value={selectedCurriculum}
                  onChange={(_, value) => setSelectedCurriculum(value)}
                  getOptionLabel={(option) => option?.title || ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  filterOptions={(options, { inputValue }) => {
                    const query = inputValue.toLowerCase().trim();
                    if (!query) return options;
                    return options.filter(option =>
                      option.title?.toLowerCase().includes(query) ||
                      option.cuid?.toLowerCase().includes(query) ||
                      option.description?.toLowerCase().includes(query)
                    );
                  }}
                  ListboxProps={{
                    sx: {
                      maxHeight: 280,
                      '&::-webkit-scrollbar': { width: 6 },
                      '&::-webkit-scrollbar-track': { bgcolor: 'action.hover', borderRadius: 1 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 1 }
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key} {...otherProps}>
                        <Box sx={{ width: '100%', py: 0.5 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={500}>
                              {option.title}
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                              {option.courseCount > 0 && (
                                <Chip
                                  label={`${option.courseCount} courses`}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  sx={{ height: 22, fontSize: '0.7rem' }}
                                />
                              )}
                              {option.projectCount > 0 && (
                                <Chip
                                  label={`${option.projectCount} projects`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 22, fontSize: '0.7rem' }}
                                />
                              )}
                            </Stack>
                          </Stack>
                          {option.description && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {option.description}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search curriculums..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon color="action" fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  noOptionsText="No matching curriculums"
                />
              )}
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: 3, pt: 2, bgcolor: 'background.paper' }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                color="error"
                onClick={() => {
                  setAddDialogOpen(false);
                  setSelectedCurriculum(null);
                }}
                disabled={adding}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddCurriculum}
                disabled={!selectedCurriculum || adding || availableForAdd.length === 0}
                startIcon={adding ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              >
                {adding ? 'Adding...' : 'Add Curriculum'}
              </Button>
            </Stack>
          </Box>
        </MainCard>
      </Dialog>
    </>
  );
};

export default ProjectCurriculumCard;
