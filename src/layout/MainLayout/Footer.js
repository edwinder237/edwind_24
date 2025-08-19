// material-ui
import { Link, Stack, Typography } from '@mui/material';

const Footer = () => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: '24px 16px 0px', mt: 'auto' }}>
    <Typography variant="caption">
      &copy; <Link href="https://www.lumeve.ca" target="_blank" color="inherit" underline="hover">Lumeve</Link> All rights reserved
    </Typography>
    <Stack spacing={1.5} direction="row" justifyContent="space-between" alignItems="center">
      <Link href="#" target="_blank" variant="caption" color="textPrimary">
        About us
      </Link>
      <Link href="#" target="_blank" variant="caption" color="textPrimary">
        Privacy
      </Link>
      <Link href="#" target="_blank" variant="caption" color="textPrimary">
        Terms
      </Link>
    </Stack>
  </Stack>
);

export default Footer;
