import React, { useEffect, useState } from 'react';
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
  
  const learnersList = learners?.map((person, i) => ({
    key: i.toString(),
    title: `${person.firstName} ${person.lastName}`,
    description: person.derpartement,
    chosen: enrolled.some(enrollee => enrollee.participantId === person.id),
    metaData: person
  }));

  const handleChange = (newTargetKeys) => {
    setTargetKeys(newTargetKeys);
    const selectedParticipants = learnersList?.filter((person) => newTargetKeys.includes(person.key)) || [];
    const participantsMetaData = selectedParticipants.map((participant) => participant.metaData);
    handleSelectedEnrollee(participantsMetaData);
  };

  const reset = () => {
    setTargetKeys([]);
    handleSelectedEnrollee([]);
  };

  useEffect(() => {
    if (learnersList) {
      const tempTargetKeys = learnersList.filter(person => person.chosen).map(person => person.key);
      setTargetKeys(tempTargetKeys);
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
    const newTargetKeys = [...targetKeys, ...keys];
    handleChange(newTargetKeys);
    setPageLeft(1);
  };

  const moveToSource = (keys) => {
    const newTargetKeys = targetKeys.filter(key => !keys.includes(key));
    handleChange(newTargetKeys);
    setPageRight(1);
  };

  // Render transfer list
  const renderTransferList = (title, items, searchValue, onSearchChange, selectedKeys, onToggle, page, onPageChange, totalItems, operations) => (
    <Card sx={{ width: 300, height: 480 }}>
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
          {items.map((item) => (
            <ListItem key={item.key} dense disablePadding>
              <ListItemButton onClick={() => onToggle(item.key)} dense>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedKeys.includes(item.key)}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  secondary={item.description}
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
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

  // Selected keys for each side
  const [selectedLeftKeys, setSelectedLeftKeys] = useState([]);
  const [selectedRightKeys, setSelectedRightKeys] = useState([]);

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
          { reset }
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
          'Selected',
          paginatedTargetItems,
          searchRight,
          setSearchRight,
          selectedRightKeys,
          handleToggleRight,
          pageRight,
          setPageRight,
          filteredTargetItems.length,
          { reset }
        )}
      </Grid>
    </Grid>
  );
};

export default TransferLists;
