import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  TextField, 
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import AppTable, { SelectionCell, SelectionHeader } from 'components/AppTable';
import MainCard from 'components/MainCard';
import AlertTopicDelete from 'sections/apps/project-manager/resources/AlertTopicDelete';
import { openSnackbar } from 'store/reducers/snackbar';

// assets
import { PlusOutlined } from '@ant-design/icons';

// ==============================|| TOPICS MANAGEMENT ||============================== //

function TopicsPage() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    color: '', 
    icon: '' 
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Delete alert state
  const [deleteAlert, setDeleteAlert] = useState({
    open: false,
    title: '',
    usageCount: 0,
    topicId: null
  });

  // Load topics on component mount
  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/topics');
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      } else {
        setErrorMessage('Failed to load topics');
        dispatch(
          openSnackbar({
            open: true,
            message: 'Failed to load topics',
            variant: 'alert',
            alert: {
              color: 'error'
            }
          })
        );
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      setErrorMessage('Failed to load topics');
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load topics',
          variant: 'alert',
          alert: {
            color: 'error'
          }
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTopic(null);
    setFormData({ title: '', description: '', color: '', icon: '' });
    setErrorMessage('');
    setOpen(true);
  };

  const handleEdit = (topic) => {
    setEditingTopic(topic);
    setFormData({ 
      title: topic.title || '', 
      description: topic.description || '', 
      color: topic.color || '', 
      icon: topic.icon || '' 
    });
    setErrorMessage('');
    setOpen(true);
  };

  const handleDelete = (topic) => {
    setDeleteAlert({
      open: true,
      title: topic.title,
      usageCount: topic.usageCount || 0,
      topicId: topic.id
    });
  };

  const handleDeleteConfirm = async (confirmed) => {
    if (confirmed && deleteAlert.topicId) {
      try {
        const response = await fetch(`/api/topics/${deleteAlert.topicId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          fetchTopics(); // Refresh the list
          setErrorMessage('');
          dispatch(
            openSnackbar({
              open: true,
              message: `Topic "${deleteAlert.title}" deleted successfully`,
              variant: 'alert',
              alert: {
                color: 'success'
              }
            })
          );
        } else {
          const errorData = await response.json();
          setErrorMessage(errorData.error || 'Failed to delete topic');
          dispatch(
            openSnackbar({
              open: true,
              message: errorData.error || 'Failed to delete topic',
              variant: 'alert',
              alert: {
                color: 'error'
              }
            })
          );
        }
      } catch (error) {
        console.error('Failed to delete topic:', error);
        setErrorMessage('Failed to delete topic');
        dispatch(
          openSnackbar({
            open: true,
            message: 'Failed to delete topic',
            variant: 'alert',
            alert: {
              color: 'error'
            }
          })
        );
      }
    }
    
    // Close the alert
    setDeleteAlert({
      open: false,
      title: '',
      usageCount: 0,
      topicId: null
    });
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      setErrorMessage('Topic title is required');
      return;
    }

    try {
      setErrorMessage('');
      const url = editingTopic ? `/api/topics/${editingTopic.id}` : '/api/topics';
      const method = editingTopic ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpen(false);
        setFormData({ title: '', description: '', color: '', icon: '' });
        setEditingTopic(null);
        fetchTopics(); // Refresh the list
        
        dispatch(
          openSnackbar({
            open: true,
            message: editingTopic 
              ? `Topic "${formData.title}" updated successfully`
              : `Topic "${formData.title}" created successfully`,
            variant: 'alert',
            alert: {
              color: 'success'
            }
          })
        );
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to save topic');
        dispatch(
          openSnackbar({
            open: true,
            message: errorData.error || 'Failed to save topic',
            variant: 'alert',
            alert: {
              color: 'error'
            }
          })
        );
      }
    } catch (error) {
      console.error('Failed to save topic:', error);
      setErrorMessage('Failed to save topic');
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to save topic',
          variant: 'alert',
          alert: {
            color: 'error'
          }
        })
      );
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({ title: '', description: '', color: '', icon: '' });
    setEditingTopic(null);
    setErrorMessage('');
  };

  // Table columns configuration
  const columns = useMemo(
    () => [
      {
        Header: SelectionHeader,
        accessor: 'selection',
        Cell: SelectionCell,
        disableSortBy: true,
        disableFilters: true,
      },
      {
        Header: 'ID',
        accessor: 'id',
        className: 'cell-center',
        Cell: ({ value }) => (
          <Typography variant="body2" color="text.secondary">
            #{value}
          </Typography>
        ),
      },
      {
        Header: 'Topic Title',
        accessor: 'title',
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {row.original.icon && (
              <span style={{ fontSize: '16px' }}>{row.original.icon}</span>
            )}
            <Chip
              label={row.original.title}
              variant="outlined"
              size="small"
              sx={{
                borderColor: row.original.color || 'primary.main',
                color: row.original.color || 'primary.main',
              }}
            />
          </Box>
        ),
      },
      {
        Header: 'Description',
        accessor: 'description',
        Cell: ({ value }) => (
          <Typography variant="body2" color="text.secondary">
            {value || 'No description'}
          </Typography>
        ),
      },
      {
        Header: 'Usage Count',
        accessor: 'usageCount',
        className: 'cell-center',
        Cell: ({ value }) => (
          <Typography variant="body2">
            {value || 0} courses/modules
          </Typography>
        ),
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        disableSortBy: true,
        disableFilters: true,
        className: 'cell-center',
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit topic">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row.original);
                }}
              >
                <EditOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete topic">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row.original);
                }}
              >
                <DeleteOutlined />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  );

  return (
    <Page title="Topics Management">
      <MainCard
        title="Topics Management"
        content={false}
        secondary={
          <Button
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Topic
          </Button>
        }
      >
        {errorMessage && !open && (
          <Alert severity="error" sx={{ m: 2 }}>
            {errorMessage}
          </Alert>
        )}
        
        <AppTable
          columns={columns}
          data={topics || []}
          handleAdd={handleAdd}
          addButtonText="Add Topic"
          showAddButton={false}
          csvFilename="topics-export.csv"
          emptyMessage={loading ? "Loading topics..." : "No topics available. Click 'Add Topic' to create your first topic."}
          initialPageSize={25}
          initialSortBy={{ id: 'title', desc: false }}
        />
      </MainCard>

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        scroll="body"
        sx={{ 
          '& .MuiDialog-paper': { 
            overflow: 'visible',
            maxHeight: '90vh',
            width: '100%',
            maxWidth: '500px',
            margin: 'auto'
          },
          '& .MuiDialog-container': {
            alignItems: 'center'
          }
        }}
      >
        <MainCard
          title={editingTopic ? 'Edit Topic' : 'Add New Topic'}
          content={false}
          secondary={
            <Button onClick={handleClose} color="secondary">
              ✕
            </Button>
          }
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '& .MuiCardContent-root': {
              flex: 1,
              overflow: 'auto',
              maxHeight: 'calc(90vh - 64px)' // Subtract header height
            }
          }}
        >
          <Box sx={{ p: 3, overflow: 'auto', maxHeight: 'inherit' }}>
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}
            
            <TextField
              autoFocus
              label="Topic Title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value.toUpperCase() }))}
              placeholder="Enter topic name (e.g., DATA SCIENCE, WEB DEVELOPMENT, etc.)"
              sx={{ mb: 3 }}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            
            <TextField
              label="Description"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the topic (optional)"
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Icon/Emoji"
                variant="outlined"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🌐"
                sx={{ width: '120px' }}
                inputProps={{ maxLength: 2, style: { textAlign: 'center', fontSize: '18px' } }}
                helperText="Emoji or icon"
              />
              <TextField
                label="Color (Hex)"
                variant="outlined"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#1976d2"
                sx={{ flex: 1 }}
                helperText="Hex color code for visual identification"
              />
            </Box>

            {/* Preview */}
            {(formData.title || formData.icon || formData.color) && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {formData.icon && (
                    <span style={{ fontSize: '16px' }}>{formData.icon}</span>
                  )}
                  <Chip
                    label={formData.title || 'Topic Title'}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: formData.color || 'primary.main',
                      color: formData.color || 'primary.main',
                    }}
                  />
                </Box>
                {formData.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {formData.description}
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={handleClose} color="secondary" variant="outlined">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                variant="contained"
                disabled={!formData.title?.trim() || loading}
                startIcon={loading ? null : <PlusOutlined />}
              >
                {loading ? 'Saving...' : (editingTopic ? 'Update Topic' : 'Create Topic')}
              </Button>
            </Box>
          </Box>
        </MainCard>
      </Dialog>

      {/* Delete Alert */}
      <AlertTopicDelete
        title={deleteAlert.title}
        usageCount={deleteAlert.usageCount}
        open={deleteAlert.open}
        handleClose={handleDeleteConfirm}
      />
    </Page>
  );
}

TopicsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default TopicsPage;