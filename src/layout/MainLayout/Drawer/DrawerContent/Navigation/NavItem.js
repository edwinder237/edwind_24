import PropTypes from 'prop-types';
import { forwardRef, useEffect } from 'react';

// next
import { useRouter } from 'next/router';
import NextLink from 'next/link';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Chip, ListItemButton, ListItemIcon, ListItemText, Typography, useMediaQuery } from '@mui/material';

// project import
import Dot from 'components/@extended/Dot';
import FeatureBadge from 'components/@extended/FeatureBadge';
import useConfig from 'hooks/useConfig';
import useUser from 'hooks/useUser';
import { dispatch, useSelector } from 'store';
import { activeItem, openDrawer } from 'store/reducers/menu';
import { LAYOUT_CONST } from 'config';

// ==============================|| NAVIGATION - LIST ITEM ||============================== //

const NavItem = ({ item, level }) => {
  const theme = useTheme();
  const { user } = useUser();

  const menu = useSelector((state) => state.menu);
  const matchDownLg = useMediaQuery(theme.breakpoints.down('lg'));
  const { drawerOpen, openItem } = menu;

  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { menuOrientation } = useConfig();

  // Access control: permissions + subscription plan tier
  const userPermissions = user?.permissions || [];
  const userRole = user?.role?.toLowerCase() || '';
  const adminRoles = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];
  const isAdminRole = adminRoles.includes(userRole);

  // Permission check
  // Owner-only items: require exactly 'owner' role (admin does not bypass)
  if (item.permission === 'owner' && userRole !== 'owner') {
    return null;
  }

  if (item.permission && item.permission !== 'owner' && !isAdminRole) {
    let hasPermission;
    if (item.permission.endsWith(':*')) {
      const prefix = item.permission.slice(0, -1);
      hasPermission = userPermissions.some(p => p.startsWith(prefix));
    } else {
      hasPermission = userPermissions.includes(item.permission);
    }
    if (!hasPermission) return null;
  }

  // Organization subscription plan tier check
  if (item.featureBadge && !isAdminRole) {
    const TIER_ORDER = { essential: 0, professional: 1, enterprise: 2 };
    const BADGE_TO_PLAN = { pro: 'professional', enterprise: 'enterprise' };
    const requiredPlan = BADGE_TO_PLAN[item.featureBadge];
    const orgPlan = user?.subscription?.planId || 'essential';
    if ((TIER_ORDER[orgPlan] || 0) < (TIER_ORDER[requiredPlan] || 0)) {
      return null;
    }
  }

  let itemTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  let listItemProps = {
    component: forwardRef((props, ref) => (
      <NextLink {...props} href={item.url} target={itemTarget} ref={ref} style={{ textDecoration: 'none', color: 'inherit' }} />
    ))
  };
  if (item?.external) {
    listItemProps = { component: 'a', href: item.url, target: itemTarget };
  }

  const Icon = item.icon;
  const itemIcon = item.icon ? <Icon style={{ fontSize: drawerOpen ? '1rem' : '1.25rem' }} /> : false;

  const isSelected = openItem.findIndex((id) => id === item.id) > -1;
  const location = useRouter();
  const { asPath } = location;

  // active menu item on page load
  useEffect(() => {
    if (asPath && asPath.includes('product-details')) {
      if (item.url && item.url.includes('product-details')) {
        dispatch(activeItem({ openItem: [item.id] }));
      }
    }

    if (asPath && asPath.includes('kanban')) {
      if (item.url && item.url.includes('kanban')) {
        dispatch(activeItem({ openItem: [item.id] }));
      }
    }

    if (asPath === item.url) {
      dispatch(activeItem({ openItem: [item.id] }));
    }

    // eslint-disable-next-line
  }, [asPath]);

  const textColor = theme.palette.mode === 'dark' ? 'grey.400' : 'text.primary';
  const iconSelectedColor = theme.palette.mode === 'dark' && drawerOpen ? 'text.primary' : 'primary.main';

  return (
    <>
      {menuOrientation === LAYOUT_CONST.VERTICAL_LAYOUT || downLG ? (
        <ListItemButton
          {...listItemProps}
          disabled={item.disabled}
          selected={isSelected}
          sx={{
            zIndex: 1201,
            pl: drawerOpen ? `${level * 28}px` : 1.5,
            py: !drawerOpen && level === 1 ? 1.25 : 1,
            ...(drawerOpen && {
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'divider' : 'primary.lighter'
              },
              '&.Mui-selected': {
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                borderRight: `2px solid ${theme.palette.primary.main}`,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  color: theme.palette.primary.contrastText,
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                }
              }
            }),
            ...(!drawerOpen && {
              '&:hover': {
                bgcolor: 'transparent'
              },
              '&.Mui-selected': {
                '&:hover': {
                  bgcolor: 'transparent'
                },
                bgcolor: 'transparent'
              }
            })
          }}
        >
          {itemIcon && (
            <ListItemIcon
              sx={{
                minWidth: 28,
                color: isSelected ? theme.palette.primary.contrastText : textColor,
                ...(!drawerOpen && {
                  borderRadius: 1.5,
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'secondary.light' : 'secondary.lighter'
                  }
                }),
                ...(!drawerOpen &&
                  isSelected && {
                    bgcolor: theme.palette.mode === 'dark' ? 'primary.900' : 'primary.lighter',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'primary.darker' : 'primary.lighter'
                    }
                  })
              }}
            >
              {itemIcon}
            </ListItemIcon>
          )}
          {(drawerOpen || (!drawerOpen && level !== 1)) && (
            <ListItemText
              primary={
                <Typography variant="h6" sx={{ color: isSelected ? theme.palette.primary.contrastText : textColor }}>
                  {item.title}
                </Typography>
              }
            />
          )}
          {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
            <Chip
              color={item.chip.color}
              variant={item.chip.variant}
              size={item.chip.size}
              label={item.chip.label}
              avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
            />
          )}
          {(drawerOpen || (!drawerOpen && level !== 1)) && item.featureBadge && (
            <FeatureBadge tier={item.featureBadge} size="small" />
          )}
        </ListItemButton>
      ) : (
        <ListItemButton
          {...listItemProps}
          disabled={item.disabled}
          selected={isSelected}
          sx={{
            zIndex: 1201,
            ...(drawerOpen && {
              '&:hover': {
                bgcolor: 'transparent'
              },
              '&.Mui-selected': {
                bgcolor: 'transparent',
                color: iconSelectedColor,
                '&:hover': {
                  color: iconSelectedColor,
                  bgcolor: 'transparent'
                }
              }
            }),
            ...(!drawerOpen && {
              '&:hover': {
                bgcolor: 'transparent'
              },
              '&.Mui-selected': {
                '&:hover': {
                  bgcolor: 'transparent'
                },
                bgcolor: 'transparent'
              }
            })
          }}
        >
          {itemIcon && (
            <ListItemIcon
              sx={{
                minWidth: 36,
                ...(!drawerOpen && {
                  borderRadius: 1.5,
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  '&:hover': {
                    bgcolor: 'transparent'
                  }
                }),
                ...(!drawerOpen &&
                  isSelected && {
                    bgcolor: 'transparent',
                    '&:hover': {
                      bgcolor: 'transparent'
                    }
                  })
              }}
            >
              {itemIcon}
            </ListItemIcon>
          )}

          {!itemIcon && (
            <ListItemIcon
              sx={{
                color: isSelected ? 'primary.main' : 'secondary.main',
                ...(!drawerOpen && {
                  borderRadius: 1.5,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  '&:hover': {
                    bgcolor: 'transparent'
                  }
                }),
                ...(!drawerOpen &&
                  isSelected && {
                    bgcolor: 'transparent',
                    '&:hover': {
                      bgcolor: 'transparent'
                    }
                  })
              }}
            >
              <Dot size={4} color={isSelected ? 'primary' : 'secondary'} />
            </ListItemIcon>
          )}
          <ListItemText
            primary={
              <Typography variant="h6" color="inherit">
                {item.title}
              </Typography>
            }
          />
          {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
            <Chip
              color={item.chip.color}
              variant={item.chip.variant}
              size={item.chip.size}
              label={item.chip.label}
              avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
            />
          )}
          {(drawerOpen || (!drawerOpen && level !== 1)) && item.featureBadge && (
            <FeatureBadge tier={item.featureBadge} size="small" />
          )}
        </ListItemButton>
      )}
    </>
  );
};

NavItem.propTypes = {
  item: PropTypes.object,
  level: PropTypes.number
};

export default NavItem;
