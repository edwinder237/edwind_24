import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Stack,
  CircularProgress,
  Skeleton
} from '@mui/material';
import MainCard from 'components/MainCard';

const LoadingState = () => {
  return (
    <Grid item xs={12}>
      <MainCard>
        <Stack alignItems="center" spacing={3} sx={{ py: 6 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Generating your report...
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" width={120} height={20} />
            ))}
          </Box>
        </Stack>
      </MainCard>
    </Grid>
  );
};

export default LoadingState;