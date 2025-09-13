import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { ReloadOutlined } from '@ant-design/icons';

class GroupsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('Groups tab error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, textAlign: 'left' }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={this.handleRetry}
                startIcon={<ReloadOutlined />}
                disabled={this.state.retryCount >= 3}
              >
                {this.state.retryCount >= 3 ? 'Max Retries' : 'Retry'}
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              Groups Tab Error
            </Typography>
            <Typography variant="body2">
              Something went wrong while loading the groups data. This could be due to:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Network connectivity issues</li>
              <li>Server overload during heavy calculations</li>
              <li>Corrupted group or participant data</li>
            </Box>
          </Alert>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
              <Typography variant="h6" color="error" gutterBottom>
                Development Error Details:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ 
                fontSize: '0.75rem', 
                overflow: 'auto',
                maxHeight: '200px',
                backgroundColor: '#f5f5f5',
                p: 1,
                borderRadius: 1
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              If this problem persists, try refreshing the page or contact support.
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Error ID: {Date.now().toString(36)}
            </Typography>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default GroupsErrorBoundary;