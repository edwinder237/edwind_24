// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Button, Container, Grid, Typography, List, ListItem, ListItemIcon, ListItemText, Card, CardContent, Chip } from '@mui/material';

// project import
import AnimateButton from 'components/@extended/AnimateButton';
import Animation from './Animation';

// assets
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

// ==============================|| LANDING - PRICING PAGE ||============================== //

const PricingBlock = () => {
  const theme = useTheme();

  const plans = [
    {
      title: 'Starter',
      price: 49,
      period: 'per month',
      description: 'Perfect for small teams getting started with training management',
      features: [
        { text: 'Up to 50 participants', included: true },
        { text: '5 concurrent projects', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Email support', included: true },
        { text: 'Course templates', included: true },
        { text: 'Advanced reporting', included: false },
        { text: 'API access', included: false },
        { text: 'Custom branding', included: false }
      ],
      buttonText: 'Start Free Trial',
      buttonVariant: 'outlined',
      popular: false
    },
    {
      title: 'Professional',
      price: 149,
      period: 'per month',
      description: 'Ideal for growing organizations with advanced training needs',
      features: [
        { text: 'Up to 500 participants', included: true },
        { text: 'Unlimited projects', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Priority email & chat support', included: true },
        { text: 'Course templates', included: true },
        { text: 'Advanced reporting', included: true },
        { text: 'API access', included: true },
        { text: 'Custom branding', included: false }
      ],
      buttonText: 'Get Started',
      buttonVariant: 'contained',
      popular: true
    },
    {
      title: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Tailored solutions for large organizations with complex requirements',
      features: [
        { text: 'Unlimited participants', included: true },
        { text: 'Unlimited projects', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Dedicated support team', included: true },
        { text: 'Course templates', included: true },
        { text: 'Advanced reporting', included: true },
        { text: 'Full API access', included: true },
        { text: 'Custom branding', included: true }
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outlined',
      popular: false
    }
  ];

  return (
    <Box id="pricing" sx={{ py: { xs: 4, md: 10 }, bgcolor: theme.palette.mode === 'dark' ? 'grey.0' : 'grey.100' }}>
      <Container>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12}>
            <Grid container spacing={1} justifyContent="center" sx={{ mb: 4, textAlign: 'center' }}>
              <Grid item sm={10} md={6}>
                <Grid container spacing={1} justifyContent="center">
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="primary">
                      Pricing Plans
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      Choose Your Plan
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" color="textSecondary">
                      Flexible pricing options to meet your organization's training needs
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Grid container spacing={3} alignItems="center" justifyContent="center">
              {plans.map((plan, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Animation
                    variants={{
                      hidden: { opacity: 0, translateY: 550 },
                      visible: { opacity: 1, translateY: 0 }
                    }}
                  >
                    <Card 
                      sx={{ 
                        position: 'relative',
                        height: '100%',
                        border: plan.popular ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                        borderColor: plan.popular ? theme.palette.primary.main : theme.palette.divider,
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                    >
                      <CardContent sx={{ p: 4, pt: plan.popular ? 2 : 4 }}>
                        {plan.popular && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Chip 
                              label="MOST POPULAR" 
                              color="primary" 
                              size="small"
                              sx={{ 
                                fontWeight: 600
                              }} 
                            />
                          </Box>
                        )}
                        
                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                          {plan.title}
                        </Typography>
                        
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          {typeof plan.price === 'number' ? (
                            <>
                              <Typography variant="h1" component="span" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                ${plan.price}
                              </Typography>
                              <Typography variant="h6" component="span" color="textSecondary">
                                {' '}{plan.period}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                              {plan.price}
                            </Typography>
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center', minHeight: 48 }}>
                          {plan.description}
                        </Typography>
                        
                        <List sx={{ mb: 3 }}>
                          {plan.features.map((feature, idx) => (
                            <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                {feature.included ? (
                                  <CheckOutlined style={{ fontSize: '18px', color: '#4caf50' }} />
                                ) : (
                                  <CloseOutlined style={{ fontSize: '18px', color: '#9e9e9e' }} />
                                )}
                              </ListItemIcon>
                              <ListItemText 
                                primary={feature.text}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  color: feature.included ? 'textPrimary' : 'textSecondary',
                                  sx: { textDecoration: feature.included ? 'none' : 'line-through' }
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                        
                        <AnimateButton>
                          <Button 
                            fullWidth 
                            size="large" 
                            variant={plan.buttonVariant}
                            sx={{
                              backgroundColor: plan.buttonVariant === 'contained' ? '#1976d2' : 'transparent',
                              borderColor: '#1976d2',
                              color: plan.buttonVariant === 'contained' ? 'white' : '#1976d2',
                              '&:hover': {
                                backgroundColor: plan.buttonVariant === 'contained' ? '#1565c0' : 'rgba(25, 118, 210, 0.04)',
                                borderColor: '#1565c0'
                              }
                            }}
                          >
                            {plan.buttonText}
                          </Button>
                        </AnimateButton>
                      </CardContent>
                    </Card>
                  </Animation>
                </Grid>
              ))}
            </Grid>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              All plans include unlimited course creation, mobile access, and automatic progress tracking
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Start with a 14-day free trial • No credit card required • Cancel anytime
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PricingBlock;