// material-ui
import { Box, Typography } from '@mui/material';

// project import
import Navigation from './Navigation';
import SimpleBar from 'components/third-party/SimpleBar';
import packageJson from '../../../../../package.json';

// ==============================|| DRAWER CONTENT ||============================== //

const DrawerContent = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <SimpleBar
      sx={{
        flex: 1,
        '& .simplebar-content': {
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Navigation />
    </SimpleBar>
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        v{packageJson.version}
      </Typography>
    </Box>
  </Box>
);

export default DrawerContent;
