import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Avatar,
  Typography,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  School,
  Support,
  AccessTime,
  Person,
  Event,
  People
} from '@mui/icons-material';

const EventModalCards = ({ items, onItemSelect, type = 'course', scheduledItemCounts = {}, pendingItemIds = [], disabled = false, schedulingStats = {} }) => {
  const theme = useTheme();

  // Get appropriate icon based on type and item
  const getIcon = (item) => {
    if (type === 'other' && item.icon) {
      return <span style={{ fontSize: '20px' }}>{item.icon}</span>;
    }
    
    switch (type) {
      case 'course':
        return <School sx={{ fontSize: 22 }} />;
      case 'supportActivity':
        return <Support sx={{ fontSize: 22 }} />;
      case 'other':
        return <Event sx={{ fontSize: 22 }} />;
      default:
        return <School sx={{ fontSize: 22 }} />;
    }
  };

  // Get appropriate color based on type
  const getColor = () => {
    switch (type) {
      case 'course':
        return theme.palette.primary.main;
      case 'supportActivity':
        return theme.palette.info.main;
      case 'other':
        return theme.palette.warning.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const color = getColor();

  return (
    <Stack spacing={1.5}>
      {items.map((item) => {
        const sessionCount = scheduledItemCounts[item.id] || 0;
        const isScheduled = sessionCount > 0;
        const isPending = pendingItemIds.includes(item.id);
        const isDisabled = disabled || isPending; // Disable if globally disabled or currently being added

        return (
          <Card
            key={item.id}
            elevation={0}
            sx={{
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              opacity: isDisabled ? 0.5 : 1,
              position: 'relative',
              '&:hover': isDisabled ? {} : {
                borderColor: color,
                boxShadow: `0 4px 12px ${alpha(color, 0.15)}`,
                transform: 'translateY(-2px)',
                '& .item-avatar': {
                  transform: 'scale(1.05)',
                  boxShadow: theme.shadows[3]
                }
              }
            }}
            onClick={() => !isDisabled && onItemSelect(item)}
        >
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            {isScheduled && !isPending && (
              <Chip
                label={`${sessionCount} session${sessionCount !== 1 ? 's' : ''}`}
                size="small"
                color="warning"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }}
              />
            )}
            {isPending && (
              <Chip 
                label="Adding..."
                size="small"
                color="info"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }}
              />
            )}
            <Stack direction="row" p={2} spacing={2.5} alignItems="flex-start">
              <Avatar 
                className="item-avatar"
                sx={{ 
                  bgcolor: alpha(color, 0.1),
                  color: color,
                  width: 44,
                  height: 44,
                  transition: 'all 0.2s ease',
                  border: `2px solid ${alpha(color, 0.2)}`,
                  flexShrink: 0
                }}
              >
                {getIcon(item)}
              </Avatar>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600} 
                  sx={{ 
                    mb: 0.5,
                    fontSize: '0.95rem',
                    lineHeight: 1.3,
                    color: theme.palette.text.primary
                  }}
                >
                  {item.title || item.name}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 1.5,
                    lineHeight: 1.4,
                    fontSize: '0.85rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {item.description || 'No description available'}
                </Typography>
                
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  {/* Category/Curriculum Chip */}
                  {(item.curriculumName || item.category) && (
                    <Chip 
                      label={item.curriculumName || item.category}
                      size="small"
                      sx={{
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        border: `1px solid ${alpha(color, 0.2)}`,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 22
                      }}
                    />
                  )}
                  
                  {/* Duration */}
                  {item.duration && (
                    <Chip 
                      icon={<AccessTime sx={{ fontSize: 14 }} />}
                      label={`${item.duration} min`}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 22,
                        '& .MuiChip-icon': {
                          color: theme.palette.info.main
                        }
                      }}
                    />
                  )}
                  
                  {/* Modules count for courses */}
                  {type === 'course' && item.modules?.length > 0 && (
                    <Chip
                      label={`${item.modules.length} modules`}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 22
                      }}
                    />
                  )}

                  {/* Scheduling stats for courses */}
                  {type === 'course' && schedulingStats[item.id] && schedulingStats[item.id].total > 0 && (
                    <Chip
                      icon={<People sx={{ fontSize: 14 }} />}
                      label={`${schedulingStats[item.id].scheduled}/${schedulingStats[item.id].total} completed`}
                      size="small"
                      sx={{
                        bgcolor: schedulingStats[item.id].scheduled === schedulingStats[item.id].total
                          ? alpha(theme.palette.success.main, 0.1)
                          : schedulingStats[item.id].scheduled === 0
                            ? alpha(theme.palette.error.main, 0.1)
                            : alpha(theme.palette.warning.main, 0.1),
                        color: schedulingStats[item.id].scheduled === schedulingStats[item.id].total
                          ? theme.palette.success.main
                          : schedulingStats[item.id].scheduled === 0
                            ? theme.palette.error.main
                            : theme.palette.warning.main,
                        border: `1px solid ${
                          schedulingStats[item.id].scheduled === schedulingStats[item.id].total
                            ? alpha(theme.palette.success.main, 0.2)
                            : schedulingStats[item.id].scheduled === 0
                              ? alpha(theme.palette.error.main, 0.2)
                              : alpha(theme.palette.warning.main, 0.2)
                        }`,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 22,
                        '& .MuiChip-icon': {
                          color: schedulingStats[item.id].scheduled === schedulingStats[item.id].total
                            ? theme.palette.success.main
                            : schedulingStats[item.id].scheduled === 0
                              ? theme.palette.error.main
                              : theme.palette.warning.main
                        }
                      }}
                    />
                  )}
                  
                  {/* Instructor for support activities */}
                  {type === 'supportActivity' && item.instructor && (
                    <Chip 
                      icon={<Person sx={{ fontSize: 14 }} />}
                      label={item.instructor}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.main,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 22,
                        '& .MuiChip-icon': {
                          color: theme.palette.secondary.main
                        }
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        );
      })}
    </Stack>
  );
};

export default EventModalCards;