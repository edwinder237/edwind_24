import {useState} from 'react';

import { Select, MenuItem,FormControl,InputLabel , Chip, Box } from '@mui/material';

export default function ChipSelectMenu  ()  {
    const [selectedChip, setSelectedChip] = useState(null);
    const [openMenu, setOpenMenu] = useState(false);
  
    const chipOptions = ['Option 1', 'Option 2', 'Option 3'];

    const handleChipClick = () => {
      setOpenMenu(true);
    };
  
    const handleMenuClose = () => {
      setOpenMenu(false);
    };
  
    const handleMenuItemClick = (option) => {
      setSelectedChip(option);
      setOpenMenu(false);
    };
  
    return (
      <Box>
        <FormControl>
          <InputLabel id="chip-select-label">Selected Chip</InputLabel>
          <Select
            labelId="chip-select-label"
            open={openMenu}
            onClose={handleMenuClose}
            onOpen={() => setOpenMenu(true)}
            value={selectedChip}
            renderValue={() => <Chip label={selectedChip} />}
          >
            {chipOptions.map((option) => (
              <MenuItem key={option} value={option} onClick={() => handleMenuItemClick(option)}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  };

