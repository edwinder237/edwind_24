// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {
  ToolOutlined,
  SettingOutlined,
  DatabaseOutlined,
  DollarOutlined,
  ApartmentOutlined,
  ApiOutlined,
  DashboardOutlined
} from '@ant-design/icons';

// icons
const icons = {
  ToolOutlined,
  SettingOutlined,
  DatabaseOutlined,
  DollarOutlined,
  ApartmentOutlined,
  ApiOutlined,
  DashboardOutlined
};

// ==============================|| MENU ITEMS - INTERNAL (Owner Only) ||============================== //

const Internal = {
  id: 'internal',
  title: <FormattedMessage id="Internal" />,
  type: 'group',
  permission: 'owner', // Level 0 only - Owner access required
  children: [
    {
      id: 'internal-dashboard',
      title: <FormattedMessage id="Dashboard" />,
      type: 'item',
      url: '/internal/dashboard',
      icon: icons.DashboardOutlined,
      breadcrumbs: true
    },
    {
      id: 'internal-subscriptions',
      title: <FormattedMessage id="Subscription Management" />,
      type: 'item',
      url: '/internal/subscriptions',
      icon: icons.DollarOutlined,
      breadcrumbs: true
    },
    {
      id: 'internal-usage',
      title: <FormattedMessage id="Provider Usage" />,
      type: 'item',
      url: '/internal/usage',
      icon: icons.ApiOutlined,
      breadcrumbs: true
    },
    {
      id: 'internal-organizations',
      title: <FormattedMessage id="All Organizations" />,
      type: 'item',
      url: '/internal/organizations',
      icon: icons.ApartmentOutlined,
      breadcrumbs: true
    },
    {
      id: 'internal-system',
      title: <FormattedMessage id="System Settings" />,
      type: 'item',
      url: '/internal/system',
      icon: icons.SettingOutlined,
      breadcrumbs: true
    }
  ]
};

export default Internal;
