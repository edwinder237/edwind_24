import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

// Dynamically import react-apexcharts with no SSR
const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      height={350}
    >
      <CircularProgress />
    </Box>
  )
});

const ChartWrapper = (props) => {
  return <Chart {...props} />;
};

export default ChartWrapper;