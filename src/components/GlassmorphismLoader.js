import React from 'react';
import {
  Box,
  Typography,
  Fade,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import { keyframes } from '@mui/system';

// Animation keyframes
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const GlassmorphismLoader = ({ 
  open = false, 
  message = "Creating your project...", 
  subtitle = "This will only take a moment" 
}) => {
  const theme = useTheme();

  if (!open) return null;

  return (
    <Fade in={open} timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(theme.palette.background.default, 0.3),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Glassmorphism Card */}
        <Box
          sx={{
            background: `linear-gradient(
              135deg,
              ${alpha(theme.palette.background.paper, 0.25)} 0%,
              ${alpha(theme.palette.background.paper, 0.1)} 100%
            )`,
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            minWidth: '320px',
            maxWidth: '450px',
            textAlign: 'center',
            boxShadow: `
              0 8px 32px ${alpha(theme.palette.common.black, 0.12)},
              inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}
            `,
            position: 'relative',
            overflow: 'hidden',
            animation: `${pulse} 2s ease-in-out infinite`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '200%',
              height: '100%',
              background: `linear-gradient(
                90deg,
                transparent,
                ${alpha(theme.palette.primary.main, 0.1)},
                transparent
              )`,
              animation: `${shimmer} 3s ease-in-out infinite`,
            },
          }}
        >
          <Stack spacing={3} alignItems="center">
            {/* EDBAHN Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${float} 2.5s ease-in-out infinite`,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 114 77" fill="none">
                <rect width="114" height="77" rx="10" fill="white" />
                <g transform="matrix(-1.6018306636155604,0,0,1.6018306636155604,95.28604118993134,0.1029745228503316)" fill={theme.palette.primary.main}>
                  <g><polygon points="1,9.3 47,18.4 32.2,20.9 17.1,15.8 27.7,21.9 11.1,24.6" /></g>
                  <g><polygon points="37.4,21.9 20.2,24.6 35.6,38.7" /></g>
                </g>
              </svg>
            </Box>

            {/* Text Content */}
            <Stack spacing={1}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  background: `linear-gradient(
                    45deg,
                    ${theme.palette.primary.main},
                    ${theme.palette.primary.light}
                  )`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.5px',
                }}
              >
                {message}
              </Typography>
              
              <Typography
                variant="body2"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.8),
                  fontSize: '0.9rem',
                  fontWeight: 400,
                }}
              >
                {subtitle}
              </Typography>
            </Stack>

            {/* Progress Dots */}
            <Stack direction="row" spacing={1} alignItems="center">
              {[0, 1, 2].map((index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.4,
                    animation: `${pulse} 1.5s ease-in-out infinite`,
                    animationDelay: `${index * 0.3}s`,
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Box>

        {/* Background Particles */}
        {[...Array(6)].map((_, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              width: `${Math.random() * 6 + 4}px`,
              height: `${Math.random() * 6 + 4}px`,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `${float} ${Math.random() * 3 + 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </Box>
    </Fade>
  );
};

export default GlassmorphismLoader;