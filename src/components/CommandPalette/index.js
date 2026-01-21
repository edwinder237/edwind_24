import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Dialog,
  DialogContent,
  InputBase,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  SearchOutlined,
  ProjectOutlined,
  BookOutlined,
  AppstoreOutlined,
  UserOutlined,
  CloseOutlined
} from '@ant-design/icons';
import axios from 'utils/axios';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Result type configurations
const RESULT_TYPES = {
  project: {
    icon: ProjectOutlined,
    label: 'Projects',
    color: 'primary'
  },
  course: {
    icon: BookOutlined,
    label: 'Courses',
    color: 'success'
  },
  curriculum: {
    icon: AppstoreOutlined,
    label: 'Curriculums',
    color: 'warning'
  },
  participant: {
    icon: UserOutlined,
    label: 'Participants',
    color: 'info'
  }
};

export default function CommandPalette({ open, onClose }) {
  const theme = useTheme();
  const router = useRouter();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const debouncedQuery = useDebounce(query, 300);

  // Flatten results for keyboard navigation
  const flatResults = results
    ? [
        ...results.projects,
        ...results.courses,
        ...results.curriculums,
        ...results.participants
      ]
    : [];

  // Search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/search/global?q=${encodeURIComponent(debouncedQuery)}`);
        if (response.data.success) {
          setResults(response.data.results);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults(null);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setSelectedIndex(0);
      // Focus input after dialog animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!flatResults.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            handleSelect(flatResults[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    },
    [flatResults, selectedIndex, onClose]
  );

  // Handle result selection
  const handleSelect = (item) => {
    onClose();
    router.push(item.url);
  };

  // Get icon component for result type
  const getIcon = (type) => {
    const config = RESULT_TYPES[type];
    const IconComponent = config?.icon || SearchOutlined;
    return <IconComponent style={{ fontSize: 18 }} />;
  };

  // Render a section of results
  const renderSection = (items, type) => {
    if (!items || items.length === 0) return null;

    const config = RESULT_TYPES[type];
    const startIndex = flatResults.findIndex((item) => item.type === type);

    return (
      <Box key={type}>
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {config.label}
        </Typography>
        <List disablePadding>
          {items.map((item, idx) => {
            const globalIndex = startIndex + idx;
            const isSelected = globalIndex === selectedIndex;

            return (
              <ListItemButton
                key={item.id}
                selected={isSelected}
                onClick={() => handleSelect(item)}
                sx={{
                  py: 1,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12)
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: `${config.color}.main` }}>
                  {getIcon(type)}
                </ListItemIcon>
                <ListItemText
                  primary={item.displayName || item.title}
                  secondary={
                    type === 'participant'
                      ? item.email
                      : item.summary?.slice(0, 60) || item.description?.slice(0, 60)
                  }
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                    noWrap: true
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    noWrap: true
                  }}
                />
                {item.projectStatus && (
                  <Chip
                    label={item.projectStatus}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                  />
                )}
                {item.code && (
                  <Chip
                    label={item.code}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    );
  };

  const hasResults = results && flatResults.length > 0;
  const noResults = results && flatResults.length === 0 && debouncedQuery.length >= 2;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '15%',
          m: 0,
          borderRadius: 2,
          maxHeight: '70vh',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }
      }}
      BackdropProps={{
        sx: {
          bgcolor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      {/* Search Input */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <SearchOutlined style={{ fontSize: 20, color: theme.palette.text.secondary, marginRight: 12 }} />
        <InputBase
          inputRef={inputRef}
          placeholder="Search projects, courses, curriculums, participants..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          sx={{
            fontSize: '1rem',
            '& input::placeholder': {
              color: 'text.secondary',
              opacity: 0.7
            }
          }}
        />
        {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
        <Box
          sx={{
            ml: 1,
            px: 1,
            py: 0.25,
            borderRadius: 0.5,
            bgcolor: 'action.hover',
            display: { xs: 'none', sm: 'block' }
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            ESC
          </Typography>
        </Box>
      </Box>

      {/* Results */}
      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        {/* Initial state - no query */}
        {!query && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Start typing to search...
            </Typography>
          </Box>
        )}

        {/* Query too short */}
        {query && query.length < 2 && !loading && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Type at least 2 characters to search
            </Typography>
          </Box>
        )}

        {/* No results */}
        {noResults && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No results found for &quot;{debouncedQuery}&quot;
            </Typography>
          </Box>
        )}

        {/* Results */}
        {hasResults && (
          <Box sx={{ py: 1 }}>
            {renderSection(results.projects, 'project')}
            {renderSection(results.courses, 'course')}
            {renderSection(results.curriculums, 'curriculum')}
            {renderSection(results.participants, 'participant')}
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      {hasResults && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {flatResults.length} result{flatResults.length !== 1 ? 's' : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <Box component="span" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 }}>
                ↑↓
              </Box>{' '}
              Navigate
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <Box component="span" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 }}>
                ↵
              </Box>{' '}
              Select
            </Typography>
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
