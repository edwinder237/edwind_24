import React, { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  TextField,
  InputAdornment,
  Grid,
  Typography,
  Box,
  IconButton,
  Stack,
  Pagination,
} from '@mui/material';
import { Search, ArrowForward, ArrowBack } from '@mui/icons-material';

const TransferLists = ({ learners, enrolled, handleSelectedEnrollee }) => {
  const [targetKeys, setTargetKeys] = useState([]);
  const [searchLeft, setSearchLeft] = useState('');
  const [searchRight, setSearchRight] = useState('');
  const [pageLeft, setPageLeft] = useState(1);
  const [pageRight, setPageRight] = useState(1);
  const itemsPerPage = 10;

  // Map learners and use ONLY the isEnrolled flag from API (source of truth)
  const learnersList = useMemo(() => {
    return learners?.map((person, i) => {
      // Build description with role, email, and department/TR name
      let description = person.role || 'Participant';

      // Add email
      if (person.email) {
        description += ` • ${person.email}`;
      }

      if (person.fromOtherTR) {
        // For enrolled from other TRs, show TR name
        description += ` • ${person.trainingRecipientName}`;
      } else if (person.derpartement || person.department) {
        // For participants from this TR, show department
        description += ` • ${person.derpartement || person.department}`;
      }

      return {
        key: i.toString(),
        title: `${person.firstName} ${person.lastName}`,
        description,
        isEnrolled: person.isEnrolled === true, // Use API data as source of truth
        fromOtherTR: person.fromOtherTR || false,
        trainingRecipientName: person.trainingRecipientName,
        metaData: person
      };
    });
  }, [learners]); // Remove 'enrolled' dependency - don't use it

  const handleChange = (newTargetKeys) => {
    setTargetKeys(newTargetKeys);
    // Only pass non-enrolled participants that were selected
    const selectedParticipants = learnersList?.filter((person) =>
      newTargetKeys.includes(person.key) && !person.isEnrolled
    ) || [];
    const participantsMetaData = selectedParticipants.map((participant) => participant.metaData);
    handleSelectedEnrollee(participantsMetaData);
  };

  const reset = () => {
    // Reset only moves enrolled participants back to "Selected", not to "Available"
    if (learnersList) {
      const enrolledKeys = learnersList.filter(person => person.isEnrolled).map(person => person.key);
      setTargetKeys(enrolledKeys);
      handleSelectedEnrollee([]);
    }
  };

  useEffect(() => {
    if (learnersList) {
      // Pre-select already enrolled participants (show on right side)
      const enrolledKeys = learnersList.filter(person => person.isEnrolled).map(person => person.key);
      setTargetKeys(enrolledKeys);
    }
  }, [learnersList]);

  // Filter and paginate functions
  const filterItems = (items, searchTerm) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const paginateItems = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  // Get source and target items
  const sourceItems = learnersList?.filter(item => !targetKeys.includes(item.key)) || [];
  const targetItems = learnersList?.filter(item => targetKeys.includes(item.key)) || [];

  // Filter items
  const filteredSourceItems = filterItems(sourceItems, searchLeft);
  const filteredTargetItems = filterItems(targetItems, searchRight);

  // Paginate items
  const paginatedSourceItems = paginateItems(filteredSourceItems, pageLeft);
  const paginatedTargetItems = paginateItems(filteredTargetItems, pageRight);

  // Move items
  const moveToTarget = (keys) => {
    // Only allow moving non-enrolled participants
    const validKeys = keys.filter(key => {
      const item = learnersList.find(l => l.key === key);
      return item && !item.isEnrolled;
    });
    const newTargetKeys = [...targetKeys, ...validKeys];
    handleChange(newTargetKeys);
    setPageLeft(1);
  };

  const moveToSource = (keys) => {
    // Only allow removing non-enrolled participants
    const validKeys = keys.filter(key => {
      const item = learnersList.find(l => l.key === key);
      return item && !item.isEnrolled;
    });
    const newTargetKeys = targetKeys.filter(key => !validKeys.includes(key));
    handleChange(newTargetKeys);
    setPageRight(1);
  };

  // Render transfer list
  const renderTransferList = (title, items, searchValue, onSearchChange, selectedKeys, onToggle, page, onPageChange, totalItems, operations, side = 'left') => {
    // Check if item is enrolled
    const isItemEnrolled = (item) => {
      const learner = learnersList?.find(l => l.key === item.key);
      return learner?.isEnrolled || false;
    };

    return (
      <Card sx={{ width: 400, height: 480 }}>
        <CardHeader
          title={title}
          subheader={`${selectedKeys.length}/${totalItems} selected`}
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <List sx={{ height: 280, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {items.map((item) => {
              const enrolled = isItemEnrolled(item);
              return (
                <ListItem key={item.key} dense disablePadding>
                  <ListItemButton
                    onClick={() => !enrolled && onToggle(item.key)}
                    dense
                    disabled={enrolled}
                    sx={{
                      opacity: enrolled ? 0.6 : 1,
                      backgroundColor: enrolled ? 'action.disabledBackground' : 'transparent'
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedKeys.includes(item.key)}
                        tabIndex={-1}
                        disableRipple
                        size="small"
                        disabled={enrolled}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={
                        enrolled
                          ? `${item.description} • Already enrolled`
                          : item.description
                      }
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          {items.length === 0 && (
            <ListItem>
              <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center' }}>
                No items found
              </Typography>
            </ListItem>
          )}
        </List>
        {Math.ceil(totalItems / itemsPerPage) > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Pagination
              count={Math.ceil(totalItems / itemsPerPage)}
              page={page}
              onChange={(e, value) => onPageChange(value)}
              size="small"
            />
          </Box>
        )}
        <Box sx={{ mt: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={operations.reset}
            sx={{ mr: 1 }}
          >
            Reset
          </Button>
        </Box>
      </CardContent>
    </Card>
    );
  };

  // Selected keys for each side
  const [selectedLeftKeys, setSelectedLeftKeys] = useState([]);
  const [selectedRightKeys, setSelectedRightKeys] = useState([]);

  // Reset selection states when learners change (e.g., dialog reopens)
  useEffect(() => {
    setSelectedLeftKeys([]);
    setSelectedRightKeys([]);
  }, [learners]);

  const handleToggleLeft = (key) => {
    setSelectedLeftKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleToggleRight = (key) => {
    setSelectedRightKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <Grid container spacing={2} alignItems="center" justifyContent="center">
      <Grid item>
        {renderTransferList(
          'Available',
          paginatedSourceItems,
          searchLeft,
          setSearchLeft,
          selectedLeftKeys,
          handleToggleLeft,
          pageLeft,
          setPageLeft,
          filteredSourceItems.length,
          { reset },
          'left'
        )}
      </Grid>
      
      <Grid item>
        <Stack spacing={1} alignItems="center">
          <Button
            variant="contained"
            onClick={() => {
              moveToTarget(selectedLeftKeys);
              setSelectedLeftKeys([]);
            }}
            disabled={selectedLeftKeys.length === 0}
            sx={{ minWidth: 80 }}
            startIcon={<ArrowForward />}
          >
            Enrol
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              moveToSource(selectedRightKeys);
              setSelectedRightKeys([]);
            }}
            disabled={selectedRightKeys.length === 0}
            sx={{ minWidth: 80 }}
            startIcon={<ArrowBack />}
          >
            Remove
          </Button>
        </Stack>
      </Grid>
      
      <Grid item>
        {renderTransferList(
          'Already Enrolled',
          paginatedTargetItems,
          searchRight,
          setSearchRight,
          selectedRightKeys,
          handleToggleRight,
          pageRight,
          setPageRight,
          filteredTargetItems.length,
          { reset },
          'right'
        )}
      </Grid>
    </Grid>
  );
};

export default TransferLists;
