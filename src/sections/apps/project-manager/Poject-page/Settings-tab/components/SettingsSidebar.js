import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ScheduleOutlined,
  InfoCircleOutlined,
  TagOutlined,
  BookOutlined,
  BgColorsOutlined
} from '@ant-design/icons';

const settingsCategories = [
  {
    id: 'information',
    label: 'Project Information',
    icon: <InfoCircleOutlined />,
    description: 'Details, status, instructors, and card appearance'
  },
  {
    id: 'schedule',
    label: 'Project Schedule',
    icon: <ScheduleOutlined />,
    description: 'Manage project duration and working days'
  },
  {
    id: 'topics',
    label: 'Project Topics',
    icon: <TagOutlined />,
    description: 'Add and manage project topics'
  },
  {
    id: 'curriculum',
    label: 'Curriculum Management',
    icon: <BookOutlined />,
    description: 'Assign and manage curriculums'
  }
];

const SettingsSidebar = ({ activeCategory, onCategoryChange }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        height: 'fit-content',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Settings Categories
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Configure your project settings
        </Typography>
      </Box>
      
      <List sx={{ p: 1 }}>
        {settingsCategories.map((category, index) => (
          <React.Fragment key={category.id}>
            <ListItemButton
              selected={activeCategory === category.id}
              onClick={() => onCategoryChange(category.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.lighter,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.lighter,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  }
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {category.icon}
              </ListItemIcon>
              <ListItemText
                primary={category.label}
                secondary={category.description}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: activeCategory === category.id ? 600 : 400
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  sx: { 
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 180
                  }
                }}
              />
            </ListItemButton>
            {index < settingsCategories.length - 1 && index === 1 && (
              <Divider sx={{ my: 1 }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

SettingsSidebar.propTypes = {
  activeCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired
};

export default SettingsSidebar;