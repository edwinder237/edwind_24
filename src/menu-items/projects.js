// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { DollarOutlined, LoginOutlined, PhoneOutlined, RocketOutlined,UnorderedListOutlined,EditOutlined,CalendarOutlined,ScheduleOutlined } from '@ant-design/icons';

// icons
const icons = { DollarOutlined, LoginOutlined, PhoneOutlined, RocketOutlined, UnorderedListOutlined, EditOutlined,CalendarOutlined,ScheduleOutlined};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const Courses = {
  id: 'Project Manager',
  title: <FormattedMessage id="Project Manager" />,
  type: 'group',
  children: [
    {
      id: 'Projects',
      title: <FormattedMessage id="Projects" />,
      type: 'item',
      url: '/projects',
      icon: icons.ScheduleOutlined,
      target: false,
      breadcrumbs: true
    },
    {
      id: 'calendar',
      title: <FormattedMessage id="calendar" />,
      type: 'item',
      url: '/apps/calendar',
      icon: icons.CalendarOutlined
    },
   
   
  ]
};

export default Courses;
