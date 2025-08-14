import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Chip,
  Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TuneOutlined, SchoolOutlined, WorkspacePremiumOutlined, EmojiEventsOutlined } from '@mui/icons-material';
import MainCard from 'components/MainCard';

const ModuleLevelDialog = ({ open, onClose, onSave, currentLevel, moduleTitle }) => {
  const theme = useTheme();
  const [selectedLevel, setSelectedLevel] = useState(currentLevel || 'Beginner');

  useEffect(() => {
    setSelectedLevel(currentLevel || 'Beginner');
  }, [currentLevel, open]);

  const handleSave = useCallback(() => {
    onSave(selectedLevel);
    onClose();
  }, [onSave, selectedLevel, onClose]);

  const handleCancel = useCallback(() => {
    setSelectedLevel(currentLevel || 'Beginner');
    onClose();
  }, [currentLevel, onClose]);

  const getLevelColor = useCallback((level) => {
    switch (level) {
      case 'Beginner': return theme.palette.success.main;
      case 'Intermediate': return theme.palette.warning.main;
      case 'Advanced': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  }, [theme]);

  const getLevelIcon = useCallback((level) => {
    switch (level) {
      case 'Beginner': return <SchoolOutlined />;
      case 'Intermediate': return <WorkspacePremiumOutlined />;
      case 'Advanced': return <EmojiEventsOutlined />;
      default: return <SchoolOutlined />;
    }
  }, []);

  const levelOptions = useMemo(() => ['Beginner', 'Intermediate', 'Advanced'], []);

  const dialogPaperProps = useMemo(() => ({
    sx: {
      borderRadius: 0,
      boxShadow: 'none',
      bgcolor: 'transparent',
      minWidth: 320,
      maxWidth: 400
    }
  }), []);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={dialogPaperProps}
    >
      <MainCard
        title="Set Module Level"
        subheader={moduleTitle}
        secondary={
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main'
            }}
          >
            <TuneOutlined fontSize="small" />
          </Box>
        }
        sx={{
          m: 0,
          '& .MuiCardHeader-root': {
            pb: 1
          }
        }}
      >
        <Box sx={{ py: 1 }}>
          <FormControl component="fieldset" fullWidth>          
            <RadioGroup
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              {levelOptions.map((level) => (
                <FormControlLabel
                  key={level}
                  value={level}
                  control={
                    <Radio 
                      size="small"
                      sx={{
                        color: getLevelColor(level),
                        '&.Mui-checked': {
                          color: getLevelColor(level)
                        }
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                      <Box sx={{ color: getLevelColor(level), display: 'flex', alignItems: 'center' }}>
                        {getLevelIcon(level)}
                      </Box>
                      <Typography variant="body1" fontWeight={500}>
                        {level}
                      </Typography>
                      <Chip
                        size="small"
                        label={level}
                        sx={{
                          bgcolor: getLevelColor(level),
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    </Box>
                  }
                  sx={{
                    m: 0,
                    py: 0.5,
                    px: 1.5,
                    borderRadius: 1.5,
                    border: '1px solid transparent',
                    transition: 'all 0.2s ease',
                    ...(selectedLevel === level && {
                      bgcolor: `${getLevelColor(level)}08`,
                      borderColor: getLevelColor(level)
                    }),
                    '&:hover': {
                      bgcolor: `${getLevelColor(level)}05`,
                      borderColor: `${getLevelColor(level)}40`
                    }
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleCancel}
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            size="small"
            sx={{
              bgcolor: getLevelColor(selectedLevel),
              '&:hover': {
                bgcolor: getLevelColor(selectedLevel),
                filter: 'brightness(0.9)'
              }
            }}
          >
            Set Level
          </Button>
        </Stack>
      </MainCard>
    </Dialog>
  );
};

export default ModuleLevelDialog;