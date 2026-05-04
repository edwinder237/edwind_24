import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

// material-ui
import { Box, Chip, useMediaQuery } from '@mui/material';

// project import
import Notification from './Notification';
import Profile from './Profile';
import OrganizationSwitcher from './OrganizationSwitcher';
import MegaMenuSection from './MegaMenuSection';
import Search from './Search';

import useConfig from 'hooks/useConfig';
import useUser from 'hooks/useUser';
import DrawerHeader from 'layout/MainLayout/Drawer/DrawerHeader';
import { LAYOUT_CONST } from 'config';

// ==============================|| HEADER - CONTENT ||============================== //

const HeaderContent = ({ onSearchClick }) => {
  const { menuOrientation } = useConfig();
  const { user } = useUser();
  const router = useRouter();

  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const megaMenu = useMemo(() => <MegaMenuSection />, []);

  // Trial banner calculations
  const subscription = user?.subscription;
  const isTrialing = subscription?.status === 'trialing';
  const trialEnd = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - new Date()) / 86400000)) : 0;

  return (
    <>
      {menuOrientation === LAYOUT_CONST.HORIZONTAL_LAYOUT && !downLG && <DrawerHeader open={true} />}

      <Box sx={{ width: '100%', ml: 1 }} />

      {isTrialing && (
        <Chip
          label={`Pro Trial: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
          color={daysLeft <= 3 ? 'error' : 'warning'}
          size="small"
          onClick={() => router.push('/organization-settings?tab=subscription')}
          sx={{ cursor: 'pointer', mr: 1, fontWeight: 600 }}
        />
      )}

      <Search onClick={onSearchClick} />
      <OrganizationSwitcher />
      <Notification />
      <Profile />
    </>
  );
};

HeaderContent.propTypes = {
  onSearchClick: PropTypes.func
};

export default HeaderContent;

//{!downLG && megaMenu} <Message />