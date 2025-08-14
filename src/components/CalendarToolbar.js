import React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CalendarOutlined,
} from '@ant-design/icons';
import {
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';

const CalendarToolbar = ({
  date,
  view,
  onDateChange,
  onViewChange,
  onToday,
  onPrev,
  onNext,
  title
}) => {
  const theme = useTheme();

  const viewButtons = [
    { value: 'dayGridMonth', label: 'Month' },
    { value: 'timeGridWeek', label: 'Week' },
    { value: 'timeGridDay', label: 'Day' },
    { value: 'listWeek', label: 'List' },
  ];

  return (
    <Box sx={{ 
      mb: 3, 
      p: 2, 
      bgcolor: 'background.paper',
      borderRadius: 1,
      border: `1px solid ${theme.palette.divider}`,
    }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
      >
        {/* Left side - Navigation */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={onToday}
            startIcon={<CalendarOutlined />}
          >
            Today
          </Button>
          
          <IconButton onClick={onPrev} size="small">
            <ChevronLeft />
          </IconButton>
          
          <IconButton onClick={onNext} size="small">
            <ChevronRight />
          </IconButton>
          
          <Typography 
            variant="h6" 
            sx={{ 
              ml: 2, 
              minWidth: 200,
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            {title}
          </Typography>
        </Stack>

        {/* Right side - View buttons */}
        <ButtonGroup size="small" variant="outlined">
          {viewButtons.map((button) => (
            <Button
              key={button.value}
              onClick={() => onViewChange(button.value)}
              variant={view === button.value ? 'contained' : 'outlined'}
              sx={{
                minWidth: { xs: 'auto', sm: 70 },
                ...(view === button.value && {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }),
              }}
            >
              {button.label}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>
    </Box>
  );
};

export default CalendarToolbar;