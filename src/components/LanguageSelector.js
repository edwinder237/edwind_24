import { useState } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';

// project import
import useConfig from 'hooks/useConfig';

// assets
import { GlobalOutlined } from '@ant-design/icons';

// Language options with flag emojis
const languages = [
  { code: 'en', label: 'landing.language.english', flag: '🇺🇸' },
  { code: 'fr', label: 'landing.language.french', flag: '🇫🇷' }
];

// ==============================|| LANGUAGE SELECTOR ||============================== //

const LanguageSelector = ({ variant = 'icon', sx = {} }) => {
  const { i18n, onChangeLocalization } = useConfig();
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode) => {
    onChangeLocalization(languageCode);
    handleClose();
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n) || languages[0];

  return (
    <Box sx={sx}>
      <IconButton
        onClick={handleClick}
        size="medium"
        sx={{
          color: variant === 'landing' ? 'rgba(255,255,255,0.8)' : 'text.primary',
          '&:hover': {
            color: variant === 'landing' ? 'white' : 'primary.main',
            bgcolor: variant === 'landing' ? 'rgba(255,255,255,0.1)' : 'action.hover'
          }
        }}
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <GlobalOutlined style={{ fontSize: '20px' }} />
      </IconButton>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button'
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={i18n === language.code}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Typography variant="body1">{language.flag}</Typography>
            </ListItemIcon>
            <ListItemText>
              {intl.formatMessage({ id: language.label })}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
