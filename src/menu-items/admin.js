// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined
} from '@ant-design/icons';

// icons
const icons = {
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined
};

// ==============================|| MENU ITEMS - ADMIN ||============================== //

const Admin = {
  id: 'admin',
  title: <FormattedMessage id="Admin" />,
  type: 'group',
  permission: 'admin', // Entire section requires admin role
  children: [
    {
      id: 'admin-users',
      title: <FormattedMessage id="User Management" />,
      type: 'item',
      url: '/admin/users',
      icon: icons.UserOutlined,
      breadcrumbs: true
    }
  ]
};

export default Admin;
