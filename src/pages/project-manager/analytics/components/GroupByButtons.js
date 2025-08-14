import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Button
} from '@mui/material';
import { GroupWorkOutlined } from '@mui/icons-material';

const GroupByButtons = ({ groupBy, setGroupBy }) => {
  const groupingOptions = [
    { key: 'none', label: 'No Grouping' },
    { key: 'instructors', label: 'By Instructors' },
    { key: 'companies', label: 'By Companies' },
    { key: 'trainingRecipients', label: 'By Training Recipients' },
    { key: 'projects', label: 'By Projects' },
    { key: 'courses', label: 'By Courses' },
    { key: 'roles', label: 'By Roles' },
    { key: 'status', label: 'By Status' }
  ];

  return (
    <Box sx={{ 
      mt: 4, 
      p: 3, 
      backgroundColor: 'grey.50'
    }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <GroupWorkOutlined color="primary" />
        <Typography variant="h6" fontWeight="bold">
          Group Results By
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {groupingOptions.map((option) => (
          <Button
            key={option.key}
            variant={groupBy === option.key ? 'contained' : 'outlined'}
            size="medium"
            onClick={() => setGroupBy(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default GroupByButtons;