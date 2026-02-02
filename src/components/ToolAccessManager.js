import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'store';

// material-ui
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Stack,
  Chip,
  Paper,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
} from '@mui/material';

// assets
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  ToolOutlined,
} from '@ant-design/icons';

// utils
import axios from 'utils/axios';

// project components
import MainCard from 'components/MainCard';
import DeleteCard from 'components/cards/DeleteCard';

// RTK Query API
import { projectApi } from 'store/api/projectApi';

const ToolAccessManager = ({ open, onClose, participantId, participantName, onUpdate }) => {
  const dispatch = useDispatch();

  // Get projectId from Redux store for cache invalidation
  const projectId = useSelector(state => state.projectSettings?.projectId);

  const [toolAccesses, setToolAccesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toolAccessToDelete, setToolAccessToDelete] = useState(null);
  const [editingAccess, setEditingAccess] = useState(null);
  const [formData, setFormData] = useState({
    tool: '',
    toolType: '',
    toolUrl: '',
    toolDescription: '',
    username: '',
    accessCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const commonTools = [
    { name: 'CRM', type: 'crm' },
    { name: 'LMS', type: 'lms' },
    { name: 'Dashboard', type: 'dashboard' },
    { name: 'Project Manager', type: 'project' },
    { name: 'Email System', type: 'email' },
    { name: 'Calendar', type: 'calendar' },
    { name: 'Chat Platform', type: 'communication' },
    { name: 'File Storage', type: 'storage' },
  ];

  useEffect(() => {
    if (open && participantId) {
      fetchToolAccesses();
    }
  }, [open, participantId]);

  const fetchToolAccesses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/participants/${participantId}/tool-access`);
      setToolAccesses(response.data);
    } catch (error) {
      console.error('Error fetching tool accesses:', error);
      setError('Failed to load tool accesses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (toolAccess = null) => {
    setEditingAccess(toolAccess);
    setFormData(toolAccess ? {
      tool: toolAccess.tool,
      toolType: toolAccess.toolType || '',
      toolUrl: toolAccess.toolUrl || '',
      toolDescription: toolAccess.toolDescription || '',
      username: toolAccess.username,
      accessCode: toolAccess.accessCode
    } : {
      tool: '',
      toolType: '',
      toolUrl: '',
      toolDescription: '',
      username: '',
      accessCode: ''
    });
    setFormOpen(true);
    setError('');
    setSuccess('');
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingAccess(null);
    setFormData({
      tool: '',
      toolType: '',
      toolUrl: '',
      toolDescription: '',
      username: '',
      accessCode: ''
    });
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToolSelect = (toolName) => {
    const selectedTool = commonTools.find(tool => tool.name === toolName);
    setFormData(prev => ({
      ...prev,
      tool: toolName,
      toolType: selectedTool ? selectedTool.type : toolName.toLowerCase()
    }));
  };

  const handleSave = async () => {
    if (!formData.tool || !formData.username || !formData.accessCode) {
      setError('Tool name, username, and access code are required');
      return;
    }

    setLoading(true);
    try {
      if (editingAccess) {
        // Update existing tool access
        const response = await axios.put(
          `/api/participants/${participantId}/tool-access/${editingAccess.id}`,
          formData
        );
        setSuccess('Tool access updated successfully');
      } else {
        // Create new tool access
        const response = await axios.post(
          `/api/participants/${participantId}/tool-access`,
          formData
        );
        setSuccess('Tool access created successfully');
      }

      await fetchToolAccesses();

      // Invalidate RTK Query cache to trigger refetch of participants
      if (projectId) {
        dispatch(projectApi.util.invalidateTags([
          { type: 'ProjectParticipants', id: parseInt(projectId) },
          { type: 'Participant', id: participantId },
          'Participant'
        ]));
      }

      onUpdate && onUpdate(); // Notify parent component to refresh
      handleCloseForm();
    } catch (error) {
      console.error('Error saving tool access:', error);
      setError(error.response?.data?.error || 'Failed to save tool access');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (toolAccess) => {
    setToolAccessToDelete(toolAccess);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setToolAccessToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!toolAccessToDelete) return;

    setLoading(true);
    setDeleteDialogOpen(false);

    try {
      await axios.delete(`/api/participants/${participantId}/tool-access/${toolAccessToDelete.id}`);
      setSuccess('Tool access deleted successfully');
      await fetchToolAccesses();

      // Invalidate RTK Query cache to trigger refetch of participants
      if (projectId) {
        dispatch(projectApi.util.invalidateTags([
          { type: 'ProjectParticipants', id: parseInt(projectId) },
          { type: 'Participant', id: participantId },
          'Participant'
        ]));
      }

      onUpdate && onUpdate(); // Notify parent component to refresh
    } catch (error) {
      console.error('Error deleting tool access:', error);
      setError(error.response?.data?.error || 'Failed to delete tool access');
    } finally {
      setLoading(false);
      setToolAccessToDelete(null);
    }
  };

  const handleClose = () => {
    handleCloseForm();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <MainCard
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <ToolOutlined />
              <Typography variant="h6">
                Tool Access Management - {participantName}
              </Typography>
            </Stack>
          }
          content={false}
          sx={{ m: 0 }}
        >
          <DialogContent>
            <Stack spacing={3}>
              {/* Success/Error Messages */}
              {success && (
                <Alert severity="success" onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              )}
              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Add New Tool Access Button */}
              <Box>
                <Button
                  variant="contained"
                  startIcon={<PlusOutlined />}
                  onClick={() => handleOpenForm()}
                  disabled={loading}
                >
                  Add Tool Access
                </Button>
              </Box>

              {/* Tool Accesses List */}
              {loading && !formOpen ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <MainCard content={false} sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {toolAccesses.length === 0 ? (
                    <Box p={3} textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        No tool accesses configured for this participant.
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {toolAccesses.map((toolAccess, index) => (
                        <React.Fragment key={toolAccess.id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="subtitle1">
                                    {toolAccess.tool}
                                  </Typography>
                                  <Chip
                                    label={toolAccess.toolType || 'Tool'}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Stack>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Username:</strong> {toolAccess.username}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Access Code:</strong> {toolAccess.accessCode}
                                  </Typography>
                                  {toolAccess.toolDescription && (
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Description:</strong> {toolAccess.toolDescription}
                                    </Typography>
                                  )}
                                  {toolAccess.toolUrl && (
                                    <Typography
                                      variant="body2"
                                      color="primary"
                                      component="a"
                                      href={toolAccess.toolUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {toolAccess.toolUrl}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenForm(toolAccess)}
                                    disabled={loading}
                                  >
                                    <EditOutlined />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteClick(toolAccess)}
                                    disabled={loading}
                                  >
                                    <DeleteOutlined />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < toolAccesses.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </MainCard>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        </MainCard>
      </Dialog>

      {/* Add/Edit Form Dialog */}
      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <MainCard
          title={editingAccess ? `Edit Tool Access - ${participantName}` : `Add Tool Access - ${participantName}`}
          content={false}
          sx={{ m: 0 }}
        >
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}

              <FormControl fullWidth>
                <InputLabel>Tool</InputLabel>
                <Select
                  value={formData.tool}
                  onChange={(e) => handleToolSelect(e.target.value)}
                  label="Tool"
                  required
                >
                  {commonTools.map((tool) => (
                    <MenuItem key={tool.name} value={tool.name}>
                      {tool.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="custom">Custom Tool...</MenuItem>
                </Select>
              </FormControl>

              {formData.tool === 'custom' && (
                <TextField
                  label="Custom Tool Name"
                  fullWidth
                  value={formData.tool === 'custom' ? '' : formData.tool}
                  onChange={(e) => handleInputChange('tool', e.target.value)}
                  required
                />
              )}

              <TextField
                label="Tool Type"
                fullWidth
                value={formData.toolType}
                onChange={(e) => handleInputChange('toolType', e.target.value)}
                placeholder="e.g., crm, lms, dashboard"
              />

              <TextField
                label="Username"
                fullWidth
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
              />

              <TextField
                label="Access Code / Password"
                fullWidth
                value={formData.accessCode}
                onChange={(e) => handleInputChange('accessCode', e.target.value)}
                required
              />

              <TextField
                label="Tool URL"
                fullWidth
                value={formData.toolUrl}
                onChange={(e) => handleInputChange('toolUrl', e.target.value)}
                placeholder="https://example.com"
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={formData.toolDescription}
                onChange={(e) => handleInputChange('toolDescription', e.target.value)}
                placeholder="Brief description of this tool access"
              />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseForm} startIcon={<CloseOutlined />}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <SaveOutlined />}
            disabled={loading || !formData.tool || !formData.username || !formData.accessCode}
          >
            {loading ? 'Saving...' : (editingAccess ? 'Update' : 'Create')}
          </Button>
          </DialogActions>
        </MainCard>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteCard
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onDelete={handleDeleteConfirm}
        title="Delete Tool Access"
        itemName={toolAccessToDelete ? `${toolAccessToDelete.tool} access for ${toolAccessToDelete.username}` : ''}
        message={toolAccessToDelete ? `Are you sure you want to delete ${toolAccessToDelete.tool} access for ${toolAccessToDelete.username}? This action cannot be undone.` : ''}
        deleteLabel="Delete"
        cancelLabel="Cancel"
      />
    </>
  );
};

ToolAccessManager.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  participantId: PropTypes.string.isRequired,
  participantName: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
};

export default ToolAccessManager;