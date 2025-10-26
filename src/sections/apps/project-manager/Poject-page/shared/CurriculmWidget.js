import { useState } from 'react';
import { styled } from '@mui/material/styles';

// material-ui
import { Avatar, Box, CardContent, Checkbox, FormControlLabel, Grid, List, ListItem, ListItemAvatar, ListItemText, Tooltip, Typography } from '@mui/material';

// project imports
import MainCard from 'components/MainCard';

// assets
import { PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { School, ThreeDRotation } from '@mui/icons-material';

import IconButton from 'components/@extended/IconButton';

// ===========================|| DATA WIDGET - TODO LIST ||=========================== //

const CurriculmWidget = ({ courses }) => {



  return (

    <Box sx={{ flexGrow: 1, maxWidth: 752 }}>
      <Grid container spacing={0} sx={{ '& .Mui-checked + span': { textDecoration: 'line-through' } }}>
        <Grid item xs={12}>
          <List dense={true}>
            {courses.map((course) => (
              <ListItem
                secondaryAction={
                  <IconButton edge="end" aria-label="delete">
                    <DeleteOutlined />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    <School />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={course.title}
                  secondary={course.version}
                />
              </ListItem>

            ))}
          </List>
        </Grid>
      </Grid>
    </Box>

  );
};

export default CurriculmWidget;
