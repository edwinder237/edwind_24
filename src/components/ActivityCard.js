import React from 'react';
import { Box, Typography, Card, CardContent, CardHeader, Avatar, IconButton } from '@mui/material';
import { EditOutlined, DeleteOutlined } from '@mui/icons-material';

const ActivityCard = ({ activity, index, getActivityColor, getActivityIcon }) => {
  return (
    <Card sx={{
      width: '100%',
      mb: 2,
      boxShadow: 3,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: 6,
        transform: 'scale(1.01)',
        borderColor: 'primary.main', // Highlight on hover
        border: '1px solid'
      }
    }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
            {index + 1}
          </Avatar>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton aria-label="edit" size="small">
              <EditOutlined fontSize="small" />
            </IconButton>
            <IconButton aria-label="delete" size="small" sx={{ ml: 1 }}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Box>
        }
        title={<Typography variant="subtitle1">{activity.title || activity.name}</Typography>}
        subheader={<Typography variant="body2" color={getActivityColor(activity.type)}>{activity.type.replace('_', ' ').toUpperCase()}</Typography>}
      />
      <CardContent sx={{ pt: 0, pb: '16px !important' }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '2', // Limit to 2 lines
            WebkitBoxOrient: 'vertical',
          }}
        >
          {activity.description || activity.instructions || 'No description provided.'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
