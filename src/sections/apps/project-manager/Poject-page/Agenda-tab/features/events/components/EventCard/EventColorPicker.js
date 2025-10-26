import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { COLOR_OPTIONS } from '../../../../utils/constants';

const EventColorPicker = React.memo(({ 
  open, 
  onClose, 
  onColorSelect, 
  currentColor 
}) => {
  const theme = useTheme();

  const colorGridStyles = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 1fr))',
    gap: 1,
    mt: 2
  }), []);

  const getColorButtonStyles = (colorValue) => useMemo(() => ({
    width: 48,
    height: 48,
    borderRadius: 1,
    border: currentColor === colorValue 
      ? `3px solid ${theme.palette.text.primary}` 
      : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    backgroundColor: colorValue,
    position: 'relative',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: theme.shadows[4]
    }
  }), [currentColor, colorValue, theme]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 300
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6">
          Choose Event Color
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select a color for this event
        </Typography>

        <Box sx={colorGridStyles}>
          {COLOR_OPTIONS.map((colorOption) => (
            <Box key={colorOption.value} sx={{ textAlign: 'center' }}>
              <IconButton
                onClick={() => onColorSelect(colorOption.value)}
                sx={getColorButtonStyles(colorOption.value)}
              >
                {currentColor === colorOption.value && (
                  <Check 
                    sx={{ 
                      color: theme.palette.getContrastText(colorOption.value),
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }} 
                  />
                )}
              </IconButton>
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  mt: 0.5,
                  fontSize: '0.7rem',
                  color: theme.palette.text.secondary
                }}
              >
                {colorOption.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
});

EventColorPicker.displayName = 'EventColorPicker';

export default EventColorPicker;