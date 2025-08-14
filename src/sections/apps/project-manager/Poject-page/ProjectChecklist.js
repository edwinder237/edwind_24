import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Card,
  CardContent,
  CardHeader,
  Avatar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CheckSquareOutlined,
  BookOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";

// ==============================|| PROJECT CHECKLIST ||============================== //

const ProjectChecklist = ({ 
  checklistItems, 
  checklistLoading, 
  onToggleItem,
  styles 
}) => {
  const theme = useTheme();

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'content': return <BookOutlined />;
      case 'technical': return <SettingOutlined />;
      case 'review': return <FileTextOutlined />;
      case 'instructor': return <UserOutlined />;
      default: return <CheckSquareOutlined />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (checklistLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Group items by course and curriculum
  const groupedItems = checklistItems.reduce((acc, item) => {
    const groupKey = `${item.curriculumName} - ${item.courseName}`;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});

  return (
    <Box>
      {/* Header */}
      <Box sx={{ ...styles.flexBetween, mb: 3 }}>
        <Typography variant="h5">
          Project Checklist ({checklistItems.length} items)
        </Typography>
        <Box sx={{ ...styles.flexCenter, gap: 1 }}>
          <Chip 
            label={`${checklistItems.filter(item => item.completed).length} completed`}
            color="success"
            variant="filled"
          />
          <Chip 
            label={`${checklistItems.filter(item => !item.completed).length} pending`}
            color="default"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Empty State */}
      {checklistItems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckSquareOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ccc' }} />
          <Typography variant="h6" gutterBottom>No Checklist Items</Typography>
          <Typography variant="body2" color="text.secondary">
            This project has no associated checklist items. Add courses to the project curriculum to see relevant checklist items.
          </Typography>
        </Paper>
      ) : (
        /* Grouped Checklist Items */
        Object.entries(groupedItems).map(([groupKey, items]) => (
          <Card key={groupKey} sx={{ mb: 2 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <BookOutlined />
                </Avatar>
              }
              title={
                <Typography variant="h6">
                  {groupKey} ({items.length})
                </Typography>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  {items.filter(item => item.completed).length} of {items.length} completed
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <List>
                {items.map((item) => (
                  <ListItem 
                    key={item.id} 
                    sx={{ 
                      pl: 0,
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox 
                        checked={item.completed}
                        onChange={() => onToggleItem(item)}
                        color="primary"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ ...styles.flexCenter, gap: 1, flexWrap: 'wrap' }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 500,
                              textDecoration: item.completed ? 'line-through' : 'none',
                              opacity: item.completed ? 0.7 : 1 
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Chip 
                            label={item.priority} 
                            size="small" 
                            color={getPriorityColor(item.priority)}
                            variant="outlined"
                          />
                          <Chip 
                            label={item.category} 
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                          {item.module && (
                            <Chip 
                              label={`Module: ${item.module.title}`} 
                              size="small" 
                              variant="outlined"
                              color="info"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          {item.description && (
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Created: {new Date(item.createdAt).toLocaleDateString()}
                            {item.completedAt && (
                              <> • Completed: {new Date(item.completedAt).toLocaleDateString()}</>
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

ProjectChecklist.propTypes = {
  checklistItems: PropTypes.array.isRequired,
  checklistLoading: PropTypes.bool.isRequired,
  onToggleItem: PropTypes.func.isRequired,
  styles: PropTypes.object.isRequired
};

export default ProjectChecklist;