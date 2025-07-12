// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { ReadOutlined } from '@ant-design/icons';

// icons
const icons = { ReadOutlined };

// ==============================|| MENU ITEMS - PAGES ||============================== //

const Courses = {
  id: 'Course Manager',
  title: <FormattedMessage id="Course Manager" />,
  type: 'group',
  children: [
    {
      id: 'Courses',
      title: <FormattedMessage id="Courses" />,
      type: 'item',
      url: '/courses',
      icon: icons.ReadOutlined,
      target: false
    },
   
  ]
};

export default Courses;


//DOM Troubleshoot: DollarOutlined, LoginOutlined, PhoneOutlined, RocketOutlined,UnorderedListOutlined,EditOutlined,ApartmentOutlined,