import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import { Box, Button, Chip, ClickAwayListener, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Skeleton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import DataTable, { DataTableSkeleton } from 'components/DataTable';
import MainCard from 'components/MainCard';
import DeleteCard from 'components/cards/DeleteCard';
import { openSnackbar } from 'store/reducers/snackbar';

// assets
import { EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

// ==============================|| ROOM LAYOUT ICONS ||============================== //

const RoomLayoutIcon = ({ type, size = 80 }) => {
  const theme = useTheme();
  const scale = size / 80;

  const seatColor = theme.palette.primary.main;
  const tableColor = theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400];
  const tableBorder = theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[500];

  const Seat = ({ top, left }) => (
    <Box
      sx={{
        position: 'absolute',
        top: top * scale,
        left: left * scale,
        width: 8 * scale,
        height: 8 * scale,
        borderRadius: '50%',
        bgcolor: seatColor,
        border: `${1.5 * scale}px solid ${theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark}`,
      }}
    />
  );

  const Table = ({ top, left, width, height, borderRadius = 2 }) => (
    <Box
      sx={{
        position: 'absolute',
        top: top * scale,
        left: left * scale,
        width: width * scale,
        height: height * scale,
        bgcolor: tableColor,
        border: `${2 * scale}px solid ${tableBorder}`,
        borderRadius: borderRadius * scale,
      }}
    />
  );

  const layouts = {
    'Theatre': (
      <>
        {/* Rows of seats */}
        {[0, 14, 28, 42].map((rowY) => (
          [...Array(6)].map((_, i) => (
            <Seat key={`${rowY}-${i}`} top={rowY} left={4 + i * 12} />
          ))
        ))}
        {/* Podium */}
        <Table top={58} left={20} width={40} height={12} />
      </>
    ),
    'U-shape': (
      <>
        {/* Top row */}
        {[...Array(5)].map((_, i) => (
          <Seat key={`top-${i}`} top={2} left={10 + i * 12} />
        ))}
        {/* Left column */}
        {[...Array(3)].map((_, i) => (
          <Seat key={`left-${i}`} top={18 + i * 14} left={2} />
        ))}
        {/* Right column */}
        {[...Array(3)].map((_, i) => (
          <Seat key={`right-${i}`} top={18 + i * 14} left={70} />
        ))}
        {/* U-shaped table */}
        <Table top={14} left={14} width={52} height={8} />
        <Table top={14} left={14} width={8} height={44} />
        <Table top={14} left={58} width={8} height={44} />
      </>
    ),
    'Classroom': (
      <>
        {/* 3 rows with desks */}
        {[0, 24, 48].map((rowY) => (
          <Box key={rowY}>
            {[...Array(4)].map((_, i) => (
              <Seat key={`seat-${rowY}-${i}`} top={rowY} left={8 + i * 18} />
            ))}
            <Table top={rowY + 10} left={6} width={68} height={8} />
          </Box>
        ))}
      </>
    ),
    'Boardroom': (
      <>
        {/* Left side seats */}
        {[...Array(4)].map((_, i) => (
          <Seat key={`left-${i}`} top={8 + i * 16} left={4} />
        ))}
        {/* Right side seats */}
        {[...Array(4)].map((_, i) => (
          <Seat key={`right-${i}`} top={8 + i * 16} left={68} />
        ))}
        {/* Long table */}
        <Table top={6} left={18} width={44} height={68} borderRadius={4} />
      </>
    ),
    'Banquet': (
      <>
        {/* 4 round tables with seats */}
        {[[12, 12], [48, 12], [12, 48], [48, 48]].map(([cx, cy], tableIdx) => (
          <Box key={tableIdx}>
            <Box
              sx={{
                position: 'absolute',
                top: (cy - 8) * scale,
                left: (cx - 8) * scale,
                width: 16 * scale,
                height: 16 * scale,
                borderRadius: '50%',
                bgcolor: tableColor,
                border: `${2 * scale}px solid ${tableBorder}`,
              }}
            />
            {[0, 72, 144, 216, 288].map((deg) => (
              <Seat
                key={deg}
                top={cy - 4 + 14 * Math.sin(deg * Math.PI / 180)}
                left={cx - 4 + 14 * Math.cos(deg * Math.PI / 180)}
              />
            ))}
          </Box>
        ))}
      </>
    ),
    'Cabaret': (
      <>
        {/* 4 round tables with half-circle seating */}
        {[[16, 16], [56, 16], [16, 56], [56, 56]].map(([cx, cy], tableIdx) => (
          <Box key={tableIdx}>
            <Box
              sx={{
                position: 'absolute',
                top: (cy - 8) * scale,
                left: (cx - 8) * scale,
                width: 16 * scale,
                height: 16 * scale,
                borderRadius: '50%',
                bgcolor: tableColor,
                border: `${2 * scale}px solid ${tableBorder}`,
              }}
            />
            {[180, 225, 270, 315].map((deg) => (
              <Seat
                key={deg}
                top={cy - 4 + 14 * Math.sin(deg * Math.PI / 180)}
                left={cx - 4 + 14 * Math.cos(deg * Math.PI / 180)}
              />
            ))}
          </Box>
        ))}
      </>
    ),
    'Conference': (
      <>
        {/* Top row seats */}
        {[...Array(5)].map((_, i) => (
          <Seat key={`top-${i}`} top={4} left={8 + i * 14} />
        ))}
        {/* Bottom row seats */}
        {[...Array(5)].map((_, i) => (
          <Seat key={`bottom-${i}`} top={64} left={8 + i * 14} />
        ))}
        {/* Conference table */}
        <Table top={18} left={10} width={60} height={40} borderRadius={4} />
      </>
    ),
    'Clusters': (
      <>
        {/* 4 small group tables */}
        {[[16, 18], [56, 18], [16, 54], [56, 54]].map(([cx, cy], tableIdx) => (
          <Box key={tableIdx}>
            <Box
              sx={{
                position: 'absolute',
                top: (cy - 6) * scale,
                left: (cx - 6) * scale,
                width: 12 * scale,
                height: 12 * scale,
                borderRadius: '50%',
                bgcolor: tableColor,
                border: `${2 * scale}px solid ${tableBorder}`,
              }}
            />
            {[0, 90, 180, 270].map((deg) => (
              <Seat
                key={deg}
                top={cy - 4 + 12 * Math.sin(deg * Math.PI / 180)}
                left={cx - 4 + 12 * Math.cos(deg * Math.PI / 180)}
              />
            ))}
          </Box>
        ))}
      </>
    ),
    'V-shape': (
      <>
        {/* Left angled table */}
        <Box
          sx={{
            position: 'absolute',
            top: 20 * scale,
            left: 6 * scale,
            width: 30 * scale,
            height: 10 * scale,
            bgcolor: tableColor,
            border: `${2 * scale}px solid ${tableBorder}`,
            borderRadius: 2 * scale,
            transform: 'rotate(-25deg)',
            transformOrigin: 'right center',
          }}
        />
        {/* Right angled table */}
        <Box
          sx={{
            position: 'absolute',
            top: 20 * scale,
            left: 44 * scale,
            width: 30 * scale,
            height: 10 * scale,
            bgcolor: tableColor,
            border: `${2 * scale}px solid ${tableBorder}`,
            borderRadius: 2 * scale,
            transform: 'rotate(25deg)',
            transformOrigin: 'left center',
          }}
        />
        {/* Left side seats */}
        {[...Array(4)].map((_, i) => (
          <Seat key={`left-${i}`} top={38 + i * 2} left={6 + i * 8} />
        ))}
        {/* Right side seats */}
        {[...Array(4)].map((_, i) => (
          <Seat key={`right-${i}`} top={38 + i * 2} left={66 - i * 8} />
        ))}
        {/* Presenter position */}
        <Box
          sx={{
            position: 'absolute',
            top: 66 * scale,
            left: 34 * scale,
            width: 12 * scale,
            height: 12 * scale,
            borderRadius: '50%',
            border: `${2 * scale}px solid ${seatColor}`,
          }}
        />
      </>
    ),
    'Traditional classroom': (
      <>
        {/* 4 rows of desks */}
        {[0, 16, 32, 48].map((rowY) => (
          <Box key={rowY}>
            {[...Array(6)].map((_, i) => (
              <Seat key={`seat-${rowY}-${i}`} top={rowY} left={4 + i * 12} />
            ))}
            <Table top={rowY + 9} left={2} width={76} height={5} />
          </Box>
        ))}
        {/* Presenter */}
        <Box
          sx={{
            position: 'absolute',
            top: 66 * scale,
            left: 34 * scale,
            width: 12 * scale,
            height: 12 * scale,
            borderRadius: '50%',
            border: `${2 * scale}px solid ${seatColor}`,
          }}
        />
      </>
    ),
    'Single square or round': (
      <>
        {/* Top seats */}
        {[...Array(4)].map((_, i) => (
          <Seat key={`top-${i}`} top={4} left={12 + i * 16} />
        ))}
        {/* Left seats */}
        {[...Array(2)].map((_, i) => (
          <Seat key={`left-${i}`} top={24 + i * 20} left={4} />
        ))}
        {/* Right seats */}
        {[...Array(2)].map((_, i) => (
          <Seat key={`right-${i}`} top={24 + i * 20} left={68} />
        ))}
        {/* Bottom seats */}
        {[...Array(4)].map((_, i) => (
          <Seat key={`bottom-${i}`} top={68} left={12 + i * 16} />
        ))}
        {/* Square/round table */}
        <Table top={18} left={18} width={44} height={44} borderRadius={8} />
      </>
    ),
    'Virtual': (
      <>
        {/* Main screen */}
        <Box
          sx={{
            position: 'absolute',
            top: 8 * scale,
            left: 12 * scale,
            width: 56 * scale,
            height: 36 * scale,
            bgcolor: tableColor,
            border: `${2 * scale}px solid ${tableBorder}`,
            borderRadius: 4 * scale,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: 44 * scale,
              height: 26 * scale,
              bgcolor: theme.palette.info.main,
              opacity: 0.4,
              borderRadius: 2 * scale,
            }}
          />
        </Box>
        {/* Participant tiles */}
        {[...Array(5)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: 54 * scale,
              left: (8 + i * 14) * scale,
              width: 12 * scale,
              height: 12 * scale,
              bgcolor: tableColor,
              border: `${2 * scale}px solid ${tableBorder}`,
              borderRadius: 2 * scale,
            }}
          />
        ))}
      </>
    ),
  };

  return (
    <Box sx={{ width: size, height: size, position: 'relative' }}>
      {layouts[type] || layouts['Conference']}
    </Box>
  );
};

const RoomLayoutReference = ({ rooms = [] }) => {
  const theme = useTheme();
  const layouts = [
    'Theatre',
    'U-shape',
    'Classroom',
    'Boardroom',
    'Banquet',
    'Cabaret',
    'Conference',
    'Clusters',
    'V-shape',
    'Traditional classroom',
    'Single square or round',
    'Virtual'
  ];

  // Count rooms by layout type
  const layoutCounts = useMemo(() => {
    const counts = {};
    layouts.forEach(layout => {
      counts[layout] = rooms.filter(room => room.roomType === layout).length;
    });
    return counts;
  }, [rooms]);

  return (
    <MainCard
      title="Room Layout Reference"
      secondary={
        <Tooltip title="Visual guide for different room configurations">
          <InfoCircleOutlined style={{ fontSize: 16 }} />
        </Tooltip>
      }
      sx={{ mb: 3 }}
    >
      <Grid container spacing={2}>
        {layouts.map((layout) => {
          const count = layoutCounts[layout] || 0;
          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={layout}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  pb: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  height: '100%',
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  borderColor: theme.palette.divider,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2,
                  }
                }}
              >
                {count > 0 && (
                  <Chip
                    label={count}
                    size="small"
                    color="success"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      minWidth: 24,
                      height: 24,
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}
                  />
                )}
                <RoomLayoutIcon type={layout} size={90} />
                <Chip
                  label={layout}
                  size="small"
                  color="primary"
                  sx={{
                    mt: 0.5,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 'auto',
                    '& .MuiChip-label': {
                      px: 1,
                      py: 0.5,
                      whiteSpace: 'normal',
                      textAlign: 'center'
                    }
                  }}
                />
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </MainCard>
  );
};

// ==============================|| FILTER OPTIONS ||============================== //

const typeOptions = ['All', 'Physical', 'Virtual'];
const layoutOptions = [
  'All',
  'Theatre',
  'U-shape',
  'Classroom',
  'Boardroom',
  'Banquet',
  'Cabaret',
  'Conference',
  'Clusters',
  'V-shape',
  'Traditional classroom',
  'Single square or round',
  'Virtual'
];
const statusOptions = ['All', 'Available', 'Occupied', 'Maintenance'];

// ==============================|| EDITABLE NOTES CELL ||============================== //

const EditableNotesCell = ({ value, row, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value || '');
  };

  const handleSave = () => {
    onSave(row.original.id, editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value || '');
    }
  };

  if (isEditing) {
    return (
      <ClickAwayListener onClickAway={handleSave}>
        <TextField
          size="small"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value.slice(0, 200))}
          onKeyDown={handleKeyDown}
          autoFocus
          fullWidth
          sx={{ minWidth: 150 }}
          inputProps={{ maxLength: 200 }}
          helperText={`${editValue.length}/200`}
        />
      </ClickAwayListener>
    );
  }

  return (
    <Tooltip title="Double-click to edit">
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          maxWidth: 200,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
            borderRadius: 1,
          },
          p: 0.5,
          minHeight: 24,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {value || 'Click to add note...'}
      </Typography>
    </Tooltip>
  );
};

// ==============================|| ROOMS ||============================== //

function RoomsPage() {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Rooms data state
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Training recipients state
  const [trainingRecipients, setTrainingRecipients] = useState([]);

  // Fetch training recipients
  const fetchTrainingRecipients = useCallback(async () => {
    try {
      const response = await fetch('/api/training-recipients/fetchAll');
      if (response.ok) {
        const data = await response.json();
        setTrainingRecipients(data);
      }
    } catch (error) {
      console.error('Error fetching training recipients:', error);
    }
  }, []);

  // Fetch rooms from API
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Failed to load rooms',
            variant: 'alert',
            alert: { color: 'error' }
          })
        );
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load rooms',
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Load data on mount
  useEffect(() => {
    fetchRooms();
    fetchTrainingRecipients();
  }, [fetchRooms, fetchTrainingRecipients]);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    type: 'Physical',
    roomType: 'Conference',
    status: 'Available',
    notes: '',
    trainingRecipientId: ''
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    type: 'All',
    layout: 'All',
    status: 'All',
    location: '',
    minCapacity: '',
    maxCapacity: ''
  });

  // Handle note update
  const handleNoteUpdate = useCallback(async (roomId, newNote) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...room, notes: newNote })
      });

      if (response.ok) {
        setRooms((prevRooms) =>
          prevRooms.map((r) =>
            r.id === roomId ? { ...r, notes: newNote } : r
          )
        );
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Failed to update note',
            variant: 'alert',
            alert: { color: 'error' }
          })
        );
      }
    } catch (error) {
      console.error('Error updating note:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to update note',
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
    }
  }, [rooms, dispatch]);

  // Filter the data based on selected filters
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const typeMatch = filters.type === 'All' || room.type === filters.type;
      const layoutMatch = filters.layout === 'All' || room.roomType === filters.layout;
      const statusMatch = filters.status === 'All' || room.status === filters.status;
      const locationMatch = !filters.location || room.location.toLowerCase().includes(filters.location.toLowerCase());
      const minCapacityMatch = !filters.minCapacity || room.capacity >= parseInt(filters.minCapacity, 10);
      const maxCapacityMatch = !filters.maxCapacity || room.capacity <= parseInt(filters.maxCapacity, 10);
      return typeMatch && layoutMatch && statusMatch && locationMatch && minCapacityMatch && maxCapacityMatch;
    });
  }, [filters, rooms]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'All',
      layout: 'All',
      status: 'All',
      location: '',
      minCapacity: '',
      maxCapacity: ''
    });
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== 'All' && v !== '').length;

  const columns = useMemo(
    () => [
      {
        Header: 'Room Name',
        accessor: 'name'
      },
      {
        Header: 'Training Recipient',
        accessor: 'training_recipient.name',
        Cell: ({ value }) => value || '-'
      },
      {
        Header: 'Location',
        accessor: 'location'
      },
      {
        Header: 'Capacity',
        accessor: 'capacity',
        Cell: ({ value }) => `${value} people`
      },
      {
        Header: 'Type',
        accessor: 'type',
        Cell: ({ value }) => (
          <Chip
            label={value}
            size="small"
            color={value === 'Virtual' ? 'info' : 'default'}
            variant="outlined"
          />
        )
      },
      {
        Header: 'Room Layout',
        accessor: 'roomType',
        Cell: ({ value }) => (
          <Tooltip title={value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RoomLayoutIcon type={value} size={40} />
              <Typography variant="caption" color="text.secondary">{value}</Typography>
            </Box>
          </Tooltip>
        )
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => {
          const color = value === 'Available' ? 'success' : value === 'Occupied' ? 'warning' : 'error';
          return <Chip label={value} size="small" color={color} />;
        }
      },
      {
        Header: 'Notes',
        accessor: 'notes',
        Cell: ({ value, row }) => (
          <EditableNotesCell value={value} row={row} onSave={handleNoteUpdate} />
        )
      }
    ],
    [handleNoteUpdate]
  );

  // Handle opening the edit dialog
  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setEditFormData({
      name: room.name || '',
      location: room.location || '',
      capacity: room.capacity || '',
      type: room.type || 'Physical',
      roomType: room.roomType || 'Conference',
      status: room.status || 'Available',
      notes: room.notes || '',
      trainingRecipientId: room.trainingRecipientId || ''
    });
    setEditDialogOpen(true);
  };

  // Handle creating a new room
  const handleCreate = () => {
    setEditingRoom(null);
    setEditFormData({
      name: '',
      location: '',
      capacity: '',
      type: 'Physical',
      roomType: 'Conference',
      status: 'Available',
      notes: '',
      trainingRecipientId: trainingRecipients.length > 0 ? '' : ''
    });
    setEditDialogOpen(true);
  };

  // Handle closing the edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingRoom(null);
  };

  // Handle form field changes
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle saving the room
  const handleSaveRoom = async () => {
    if (!editFormData.name.trim()) return;
    if (!editingRoom && !editFormData.trainingRecipientId) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please select a training recipient',
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
      return;
    }

    try {
      if (editingRoom) {
        // Update existing room
        const response = await fetch(`/api/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        });

        if (response.ok) {
          const updated = await response.json();
          setRooms(prevRooms =>
            prevRooms.map(room =>
              room.id === editingRoom.id ? updated : room
            )
          );
          dispatch(
            openSnackbar({
              open: true,
              message: `Room "${editFormData.name}" updated successfully`,
              variant: 'alert',
              alert: { color: 'success' }
            })
          );
        } else {
          const errorData = await response.json();
          dispatch(
            openSnackbar({
              open: true,
              message: errorData.error || 'Failed to update room',
              variant: 'alert',
              alert: { color: 'error' }
            })
          );
          return;
        }
      } else {
        // Create new room
        const response = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        });

        if (response.ok) {
          const newRoom = await response.json();
          setRooms(prevRooms => [...prevRooms, newRoom]);
          dispatch(
            openSnackbar({
              open: true,
              message: `Room "${editFormData.name}" created successfully`,
              variant: 'alert',
              alert: { color: 'success' }
            })
          );
        } else {
          const errorData = await response.json();
          dispatch(
            openSnackbar({
              open: true,
              message: errorData.error || 'Failed to create room',
              variant: 'alert',
              alert: { color: 'error' }
            })
          );
          return;
        }
      }
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error saving room:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to save room',
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
    }
  };

  // Handle opening delete dialog
  const handleDeleteRoom = (room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      const response = await fetch(`/api/rooms/${roomToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setRooms(prevRooms => prevRooms.filter(r => r.id !== roomToDelete.id));
        dispatch(
          openSnackbar({
            open: true,
            message: `Room "${roomToDelete.name}" deleted successfully`,
            variant: 'alert',
            alert: { color: 'success' }
          })
        );
      } else {
        const errorData = await response.json();
        dispatch(
          openSnackbar({
            open: true,
            message: errorData.error || 'Failed to delete room',
            variant: 'alert',
            alert: { color: 'error' }
          })
        );
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete room',
          variant: 'alert',
          alert: { color: 'error' }
        })
      );
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const renderActions = (row) => (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleEditRoom(row.original);
          }}
        >
          <EditOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteRoom(row.original);
          }}
        >
          <DeleteOutlined />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  if (loading) {
    return (
      <Page title="Rooms">
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={600} height={24} />
        </Box>
        <MainCard sx={{ mb: 3 }}>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[...Array(12)].map((_, i) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
                <Skeleton variant="rounded" height={140} />
              </Grid>
            ))}
          </Grid>
        </MainCard>
        <DataTableSkeleton rows={10} columns={6} />
      </Page>
    );
  }

  return (
    <Page title="Rooms">
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Manage your training rooms and locations. Add, edit, and organize the physical or virtual spaces where your training sessions take place.
        </Typography>
      </Box>
      <RoomLayoutReference rooms={rooms} />

      {/* Filter Section */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} active`}
              size="small"
              color="primary"
              onDelete={clearFilters}
            />
          )}
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Location"
              placeholder="Search by address..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="Min Capacity"
              type="number"
              value={filters.minCapacity}
              onChange={(e) => handleFilterChange('minCapacity', e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="Max Capacity"
              type="number"
              value={filters.maxCapacity}
              onChange={(e) => handleFilterChange('maxCapacity', e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                {typeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Room Layout</InputLabel>
              <Select
                value={filters.layout}
                label="Room Layout"
                onChange={(e) => handleFilterChange('layout', e.target.value)}
              >
                {layoutOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <DataTable
        columns={columns}
        data={filteredRooms}
        createButtonLabel="Add Room"
        onCreate={handleCreate}
        renderActions={renderActions}
        csvFilename="rooms-export.csv"
        emptyMessage="No rooms found matching your filters."
        initialPageSize={10}
      />

      {/* Edit/Create Room Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRoom ? 'Edit Room' : 'Add New Room'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Name"
                value={editFormData.name}
                onChange={(e) => handleEditFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Training Recipient</InputLabel>
                <Select
                  value={editFormData.trainingRecipientId}
                  label="Training Recipient"
                  onChange={(e) => handleEditFormChange('trainingRecipientId', e.target.value)}
                >
                  {trainingRecipients.map((tr) => (
                    <MenuItem key={tr.id} value={tr.id}>
                      {tr.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location / Address"
                value={editFormData.location}
                onChange={(e) => handleEditFormChange('location', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={editFormData.capacity}
                onChange={(e) => handleEditFormChange('capacity', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={editFormData.type}
                  label="Type"
                  onChange={(e) => handleEditFormChange('type', e.target.value)}
                >
                  <MenuItem value="Physical">Physical</MenuItem>
                  <MenuItem value="Virtual">Virtual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  label="Status"
                  onChange={(e) => handleEditFormChange('status', e.target.value)}
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Occupied">Occupied</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Room Layout</InputLabel>
                <Select
                  value={editFormData.roomType}
                  label="Room Layout"
                  onChange={(e) => handleEditFormChange('roomType', e.target.value)}
                >
                  {layoutOptions.filter(opt => opt !== 'All').map((layout) => (
                    <MenuItem key={layout} value={layout}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <RoomLayoutIcon type={layout} size={40} />
                        <Typography>{layout}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={editFormData.notes}
                onChange={(e) => handleEditFormChange('notes', e.target.value.slice(0, 200))}
                multiline
                rows={2}
                inputProps={{ maxLength: 200 }}
                helperText={`${editFormData.notes.length}/200`}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditDialog} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSaveRoom}
            variant="contained"
            disabled={!editFormData.name.trim() || (!editingRoom && !editFormData.trainingRecipientId)}
          >
            {editingRoom ? 'Save Changes' : 'Create Room'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Room Confirmation Dialog */}
      <DeleteCard
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onDelete={handleConfirmDelete}
        title="Delete Room"
        itemName={roomToDelete?.name}
        message={`Are you sure you want to delete "${roomToDelete?.name}"? This action cannot be undone.`}
      />
    </Page>
  );
}

RoomsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default RoomsPage;
