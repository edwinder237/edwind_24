import PropTypes from 'prop-types';

// material-ui
import { Box, ButtonBase, Typography, useMediaQuery, useTheme } from '@mui/material';

// assets
import { SearchOutlined } from '@ant-design/icons';

// ==============================|| HEADER CONTENT - SEARCH ||============================== //

const Search = ({ onClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ mr: { xs: 1, sm: 2 } }}>
      <ButtonBase
        onClick={onClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: { xs: 1.5, sm: 2 },
          py: 1,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50',
          minWidth: { xs: 'auto', sm: 200 },
          justifyContent: 'flex-start',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'grey.100'
          }
        }}
      >
        <SearchOutlined style={{ fontSize: 16, color: theme.palette.text.secondary }} />
        {!isMobile && (
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ flex: 1, textAlign: 'left' }}
            >
              Search...
            </Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: 0.5,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'grey.200',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: theme.palette.mode === 'dark' ? 'grey.400' : 'text.secondary'
                }}
              >
                {navigator?.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}
              </Typography>
            </Box>
          </>
        )}
      </ButtonBase>
    </Box>
  );
};

Search.propTypes = {
  onClick: PropTypes.func
};

export default Search;
