// third-party
import { FormattedMessage, useIntl } from 'react-intl';

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
  const intl = useIntl();

  const plans = [
    {
      title: intl.formatMessage({ id: 'landing.pricing.starter' }),
      price: 49,
      period: intl.formatMessage({ id: 'landing.pricing.perMonth' }),
      description: intl.formatMessage({ id: 'landing.pricing.starterDesc' }),
      features: [
        { text: intl.formatMessage({ id: 'landing.pricing.upTo50Participants' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.5Projects' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.basicAnalytics' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.emailSupport' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.courseTemplates' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.advancedReporting' }), included: false },
        { text: intl.formatMessage({ id: 'landing.pricing.apiAccess' }), included: false },
        { text: intl.formatMessage({ id: 'landing.pricing.customBranding' }), included: false }
      ],
      buttonText: intl.formatMessage({ id: 'landing.pricing.startFreeTrial' }),
      buttonVariant: 'outlined',
      popular: false
    },
    {
      title: intl.formatMessage({ id: 'landing.pricing.professional' }),
      price: 149,
      period: intl.formatMessage({ id: 'landing.pricing.perMonth' }),
      description: intl.formatMessage({ id: 'landing.pricing.professionalDesc' }),
      features: [
        { text: intl.formatMessage({ id: 'landing.pricing.upTo500Participants' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.unlimitedProjects' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.advancedAnalytics' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.prioritySupport' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.courseTemplates' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.advancedReporting' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.apiAccess' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.customBranding' }), included: false }
      ],
      buttonText: intl.formatMessage({ id: 'landing.pricing.getStarted' }),
      buttonVariant: 'contained',
      popular: true
    },
    {
      title: intl.formatMessage({ id: 'landing.pricing.enterprise' }),
      price: intl.formatMessage({ id: 'landing.pricing.custom' }),
      period: '',
      description: intl.formatMessage({ id: 'landing.pricing.enterpriseDesc' }),
      features: [
        { text: intl.formatMessage({ id: 'landing.pricing.unlimitedParticipants' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.unlimitedProjects' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.advancedAnalytics' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.dedicatedSupport' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.courseTemplates' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.advancedReporting' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.fullApiAccess' }), included: true },
        { text: intl.formatMessage({ id: 'landing.pricing.customBranding' }), included: true }
      ],
      buttonText: intl.formatMessage({ id: 'landing.pricing.contactSales' }),
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
                      <FormattedMessage id="landing.pricing.subtitle" />
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      <FormattedMessage id="landing.pricing.title" />
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" color="textSecondary">
                      <FormattedMessage id="landing.pricing.description" />
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
                              label={<FormattedMessage id="landing.pricing.mostPopular" />}
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
              <FormattedMessage id="landing.pricing.footer1" />
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              <FormattedMessage id="landing.pricing.footer2" />
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PricingBlock;
