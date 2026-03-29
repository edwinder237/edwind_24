// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
  ScheduleOutlined,
  ToolOutlined,
  BankOutlined
} from '@ant-design/icons';
import { LocalParking, ViewTimeline } from '@mui/icons-material';

// icons
const icons = {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
  ScheduleOutlined,
  ToolOutlined,
  BankOutlined,
  LocalParking,
  ViewTimeline
};

// ==============================|| MENU ITEMS - PROJECT MANAGER ||============================== //

const ProjectManager = {
  id: 'project-manager',
  title: <FormattedMessage id="Project Manager" />,
  type: 'group',
  children: [
    {
      id: 'pm-dashboard',
      title: <FormattedMessage id="Dashboard" />,
      type: 'item',
      url: '/project-manager/dashboard',
      icon: icons.DashboardOutlined,
      breadcrumbs: true,
      permission: 'access-projects-dashboard',
      featureKey: 'dashboard'
    },
    {
      id: 'pm-timeline',
      title: <FormattedMessage id="Timeline" />,
      type: 'item',
      url: '/project-manager/projects/timeline',
      icon: icons.ViewTimeline,
      breadcrumbs: true,
      permission: 'timeline:*',
      featureKey: 'timeline'
    },
    {
      id: 'pm-projects-list',
      title: <FormattedMessage id="Projects" />,
      type: 'item',
      url: '/projects',
      icon: icons.LocalParking,
      breadcrumbs: false
    },
    {
      id: 'pm-my-team',
      title: <FormattedMessage id="My Team" />,
      type: 'item',
      url: '/project-manager/my-team',
      icon: icons.TeamOutlined,
      breadcrumbs: true
    },
    {
      id: 'pm-training-recipients',
      title: <FormattedMessage id="Training Recipients" />,
      type: 'item',
      url: '/project-manager/training-recipients',
      icon: icons.BankOutlined,
      breadcrumbs: true
    },
    {
      id: 'pm-configuration',
      title: <FormattedMessage id="Configuration" />,
      type: 'item',
      url: '/project-manager/configuration',
      icon: icons.SettingOutlined,
      breadcrumbs: true
    },
    {
      id: 'pm-analytics',
      title: <FormattedMessage id="Analytics" />,
      type: 'collapse',
      icon: icons.BarChartOutlined,
      children: [
        {
          id: 'pm-analytics-reports',
          title: <FormattedMessage id="Reports" />,
          type: 'item',
          url: '/project-manager/reports/reports',
          breadcrumbs: true
        },
        {
          id: 'pm-analytics-kirkpatrick',
          title: <FormattedMessage id="Kirkpatrick" />,
          type: 'item',
          url: '/project-manager/reports/kirkpatrick',
          breadcrumbs: true,
          permission: 'kirkpatrick:*',
          featureKey: 'kirkpatrick'
        }
      ]
    }
  ]
};

export default ProjectManager;