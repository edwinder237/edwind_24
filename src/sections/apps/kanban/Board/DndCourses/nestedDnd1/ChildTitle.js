import React from 'react'


// material-ui
import { Box,Grid, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';


function ColumnTitle({shortName}) {
    const theme = useTheme();

  return (
    <Grid container alignItems="center" spacing={3}  >
    <Grid item xs zeroMinWidth>
      <Box sx={{
      mb: 1.5,
      fontWeight: 500,
      '& input:focus': {
        bgcolor: theme.palette.mode === 'dark' ? theme.palette.secondary.grey[100] : theme.palette.grey[50]
      },
      '& input:hover': {
        bgcolor: theme.palette.mode === 'dark' ? theme.palette.secondary.grey[100] : theme.palette.grey[50]
      },
      '& input:hover + fieldset': {
        display: 'block'
      },
      '&, & input': { bgcolor: 'transparent' },
      '& fieldset': { display: 'none' },
      '& input:focus + fieldset': { display: 'block' }
    }}>
      {shortName}
      </Box>
    </Grid>
    <Grid item sx={{ mb: 1.5 }}>
  
    </Grid>
  </Grid>
  )
}

export default ColumnTitle