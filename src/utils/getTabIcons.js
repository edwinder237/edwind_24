
import { Chip } from '@mui/material';

const getTabIcons = (condition) => {
  if (condition) {
    return <Chip label="✅" variant="light" color="success" size="small" />;
  }
  return <Chip label="⚠️" variant="light" color="primary" size="small" />;
};

export default getTabIcons;
