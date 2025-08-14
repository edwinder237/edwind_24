// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {AppstoreAddOutlined, DollarOutlined, LoginOutlined, PhoneOutlined, RocketOutlined,UnorderedListOutlined,EditOutlined,CalendarOutlined,ScheduleOutlined } from '@ant-design/icons';

// icons
const icons = { AppstoreAddOutlined, DollarOutlined, LoginOutlined, PhoneOutlined, RocketOutlined, UnorderedListOutlined, EditOutlined,CalendarOutlined,ScheduleOutlined};

// ==============================|| MENU ITEMS - APPLICATIONS ||============================== //

const applications = {
  id: 'Project Manager',
  title: <FormattedMessage id="Project Manager" />,
  icon: icons.AppstoreAddOutlined,
  type: 'group',
  children: [
    {
      id: 'Projects',
      title: <FormattedMessage id="Projects" />,
      type: 'item',
      url: '/projects',
      icon: icons.ScheduleOutlined,
      target: false,
      breadcrumbs: false
    },
  ]
};

export default applications;
