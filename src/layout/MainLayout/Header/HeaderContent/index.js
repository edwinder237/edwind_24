import { useMemo } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { Box, useMediaQuery } from '@mui/material';

// project import
import Message from './Message';
import Profile from './Profile';
import OrganizationSwitcher from './OrganizationSwitcher';
import MegaMenuSection from './MegaMenuSection';
import Search from './Search';

import useConfig from 'hooks/useConfig';
import DrawerHeader from 'layout/MainLayout/Drawer/DrawerHeader';
import { LAYOUT_CONST } from 'config';

// ==============================|| HEADER - CONTENT ||============================== //

const HeaderContent = ({ onSearchClick }) => {
  const { menuOrientation } = useConfig();

  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const megaMenu = useMemo(() => <MegaMenuSection />, []);

  return (
    <>
      {menuOrientation === LAYOUT_CONST.HORIZONTAL_LAYOUT && !downLG && <DrawerHeader open={true} />}

      <Box sx={{ width: '100%', ml: 1 }} />

      <Search onClick={onSearchClick} />
      <OrganizationSwitcher />
      <Profile />
    </>
  );
};

HeaderContent.propTypes = {
  onSearchClick: PropTypes.func
};

export default HeaderContent;

//{!downLG && megaMenu} <Message />