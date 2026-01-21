import PropTypes from 'prop-types';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import {
  CoffeeOutlined,
  RestOutlined,
  TeamOutlined,
  MessageOutlined,
  PhoneOutlined,
  BarChartOutlined,
  BulbOutlined,
  DesktopOutlined,
  ToolOutlined,
  EditOutlined,
  BookOutlined,
  ExperimentOutlined,
  SmileOutlined,
  GiftOutlined,
  FileTextOutlined,
  FolderOutlined,
  PushpinOutlined,
  StarOutlined,
  BellOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  AudioOutlined
} from '@ant-design/icons';

// Map category to available icons
const CATEGORY_ICONS = {
  Break: [
    { icon: CoffeeOutlined, name: 'CoffeeOutlined', label: 'Coffee' },
    { icon: RestOutlined, name: 'RestOutlined', label: 'Rest' },
    { icon: ClockCircleOutlined, name: 'ClockCircleOutlined', label: 'Clock' }
  ],
  Meeting: [
    { icon: TeamOutlined, name: 'TeamOutlined', label: 'Team' },
    { icon: MessageOutlined, name: 'MessageOutlined', label: 'Message' },
    { icon: PhoneOutlined, name: 'PhoneOutlined', label: 'Phone' },
    { icon: VideoCameraOutlined, name: 'VideoCameraOutlined', label: 'Video' }
  ],
  Presentation: [
    { icon: BarChartOutlined, name: 'BarChartOutlined', label: 'Chart' },
    { icon: BulbOutlined, name: 'BulbOutlined', label: 'Idea' },
    { icon: DesktopOutlined, name: 'DesktopOutlined', label: 'Desktop' },
    { icon: AudioOutlined, name: 'AudioOutlined', label: 'Audio' }
  ],
  Workshop: [
    { icon: ToolOutlined, name: 'ToolOutlined', label: 'Tools' },
    { icon: EditOutlined, name: 'EditOutlined', label: 'Edit' },
    { icon: BookOutlined, name: 'BookOutlined', label: 'Book' },
    { icon: ExperimentOutlined, name: 'ExperimentOutlined', label: 'Experiment' }
  ],
  Social: [
    { icon: SmileOutlined, name: 'SmileOutlined', label: 'Smile' },
    { icon: GiftOutlined, name: 'GiftOutlined', label: 'Gift' },
    { icon: CoffeeOutlined, name: 'CoffeeOutlined', label: 'Coffee' }
  ],
  Administrative: [
    { icon: FileTextOutlined, name: 'FileTextOutlined', label: 'Document' },
    { icon: FolderOutlined, name: 'FolderOutlined', label: 'Folder' },
    { icon: PushpinOutlined, name: 'PushpinOutlined', label: 'Pin' },
    { icon: CalendarOutlined, name: 'CalendarOutlined', label: 'Calendar' }
  ],
  Other: [
    { icon: StarOutlined, name: 'StarOutlined', label: 'Star' },
    { icon: BellOutlined, name: 'BellOutlined', label: 'Bell' },
    { icon: EnvironmentOutlined, name: 'EnvironmentOutlined', label: 'Location' },
    { icon: TrophyOutlined, name: 'TrophyOutlined', label: 'Trophy' }
  ]
};

// Default icons for each category
const DEFAULT_CATEGORY_ICONS = {
  Break: 'CoffeeOutlined',
  Meeting: 'TeamOutlined',
  Presentation: 'BarChartOutlined',
  Workshop: 'ToolOutlined',
  Social: 'SmileOutlined',
  Administrative: 'FileTextOutlined',
  Other: 'StarOutlined'
};

const CustomEventIconPicker = ({ selectedIcon, category, onSelect }) => {
  const theme = useTheme();
  const icons = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Select Icon
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          p: 1,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 1
        }}
      >
        {icons.map(({ icon: IconComponent, name, label }) => (
          <IconButton
            key={name}
            onClick={() => onSelect(name)}
            title={label}
            sx={{
              width: 40,
              height: 40,
              border: selectedIcon === name
                ? `2px solid ${theme.palette.primary.main}`
                : `1px solid ${theme.palette.divider}`,
              bgcolor: selectedIcon === name
                ? theme.palette.mode === 'dark'
                  ? 'rgba(25, 118, 210, 0.2)'
                  : 'rgba(25, 118, 210, 0.1)'
                : 'transparent',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.04)'
              }
            }}
          >
            <IconComponent style={{ fontSize: 20 }} />
          </IconButton>
        ))}
      </Box>
    </Box>
  );
};

CustomEventIconPicker.propTypes = {
  selectedIcon: PropTypes.string,
  category: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired
};

CustomEventIconPicker.defaultProps = {
  selectedIcon: null
};

export { CATEGORY_ICONS, DEFAULT_CATEGORY_ICONS };
export default CustomEventIconPicker;
