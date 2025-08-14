// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { DollarOutlined, LoginOutlined, PhoneOutlined, RocketOutlined,UnorderedListOutlined,EditOutlined,CalendarOutlined,ScheduleOutlined } from '@ant-design/icons';
import { LocalParking } from '@mui/icons-material';

// icons
const icons = { DollarOutlined, LoginOutlined, PhoneOutlined, RocketOutlined, UnorderedListOutlined, EditOutlined,CalendarOutlined,ScheduleOutlined, LocalParking};

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
      icon: icons.LocalParking,
      target: false,
      breadcrumbs: true
    },
   
   
  ]
};

export default Courses;
