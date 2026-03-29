// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { MailOutlined } from '@ant-design/icons';

// icons
const icons = { MailOutlined };

// ==============================|| MENU ITEMS - COMMUNICATIONS ||============================== //

const Communications = {
  id: 'communications',
  title: <FormattedMessage id="Communications" />,
  type: 'group',
  children: [
    {
      id: 'comm-email-log',
      title: <FormattedMessage id="Email Log" />,
      type: 'item',
      url: '/project-manager/communications',
      icon: icons.MailOutlined,
      breadcrumbs: true
    }
  ]
};

export default Communications;
