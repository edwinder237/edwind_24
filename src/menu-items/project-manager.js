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
  ScheduleOutlined
} from '@ant-design/icons';
import { LocalParking } from '@mui/icons-material';

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
  LocalParking
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
      permission: 'access-projects-dashboard'
    },
    {
      id: 'pm-timeline',
      title: <FormattedMessage id="Timeline" />,
      type: 'item',
      url: '/project-manager/projects/timeline',
      icon: icons.ScheduleOutlined,
      breadcrumbs: true,
      permission: 'access-timeline'
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
      id: 'pm-resources',
      title: <FormattedMessage id="Resources" />,
      type: 'collapse',
      icon: icons.TeamOutlined,
      children: [
        {
          id: 'pm-resources-team',
          title: <FormattedMessage id="Team Members" />,
          type: 'item',
          url: '/project-manager/resources/team',
          breadcrumbs: true
        },
        {
          id: 'pm-resources-instructors',
          title: <FormattedMessage id="Instructors" />,
          type: 'item',
          url: '/project-manager/resources/instructors',
          breadcrumbs: true
        },
        {
          id: 'pm-resources-training-recipients',
          title: <FormattedMessage id="Training Recipients" />,
          type: 'item',
          url: '/project-manager/training-recipients',
          breadcrumbs: true
        },
        {
          id: 'pm-resources-topics',
          title: <FormattedMessage id="Topics" />,
          type: 'item',
          url: '/project-manager/resources/topics',
          breadcrumbs: true
        },
        {
          id: 'pm-resources-participant-roles',
          title: <FormattedMessage id="Participant Roles" />,
          type: 'item',
          url: '/project-manager/resources/participant-roles',
          breadcrumbs: true
        }
      ]
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
        }
      ]
    }
  ]
};

export default ProjectManager;