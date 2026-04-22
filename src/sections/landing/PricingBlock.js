// third-party
import { FormattedMessage, useIntl } from 'react-intl';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

// project import
import AnimateButton from 'components/@extended/AnimateButton';
import Animation from './Animation';
import { ThemeMode } from 'config';

// assets
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

// ==============================|| LANDING - PRICING PAGE ||============================== //

const PricingBlock = () => {
  const theme = useTheme();
  const intl = useIntl();

  const plans = [
    {
      title: intl.formatMessage({ id: 'landing.pricing.essential' }),
      price: 29,
      period: intl.formatMessage({ id: 'landing.pricing.perMonth' }),
      description: intl.formatMessage({ id: 'landing.pricing.essentialDesc' }),
      features: [
        { text: 'SmartPulse — 5/day', included: true },
        { text: 'Syllo AI — 5/day', included: true },
        { text: '10 Projects', included: true },
        { text: '20 Courses', included: true },
        { text: '10 Curriculums', included: true },
        { text: 'Calendar & Survey Integration', included: true },
        { text: 'Analytics & Attendance', included: true },
        { text: '100 Mass Emails/month', included: true },
        { text: 'Timeline & Kirkpatrick', included: false },
        { text: 'Group Management', included: false }
      ],
      buttonText: intl.formatMessage({ id: 'landing.pricing.startFreeTrial' }),
      buttonVariant: 'outlined',
      popular: false,
      showTrialChip: true
    },
    {
      title: intl.formatMessage({ id: 'landing.pricing.professional' }),
      price: 49,
      period: intl.formatMessage({ id: 'landing.pricing.perMonth' }),
      description: intl.formatMessage({ id: 'landing.pricing.professionalDesc' }),
      features: [
        { text: 'SmartPulse — 20/day', included: true },
        { text: 'Syllo AI — 25/day', included: true },
        { text: '30 Projects', included: true },
        { text: '50 Courses', included: true },
        { text: '25 Curriculums', included: true },
        { text: 'Timeline & Kirkpatrick', included: true },
        { text: 'Group Management', included: true },
        { text: '1,000 Mass Emails/month', included: true },
        { text: 'All Integrations & Analytics', included: true },
        { text: 'Sub-organizations', included: false }
      ],
      buttonText: intl.formatMessage({ id: 'landing.pricing.getStarted' }),
      buttonVariant: 'contained',
      popular: true,
      showTrialChip: false
    },
    {
      title: intl.formatMessage({ id: 'landing.pricing.enterprise' }),
      price: 250,
      period: intl.formatMessage({ id: 'landing.pricing.perMonth' }),
      description: intl.formatMessage({ id: 'landing.pricing.enterpriseDesc' }),
      features: [
        { text: 'SmartPulse — Unlimited', included: true },
        { text: 'Syllo AI — Unlimited', included: true },
        { text: 'Unlimited Projects', included: true },
        { text: 'Unlimited Courses', included: true },
        { text: 'Unlimited Curriculums', included: true },
        { text: 'Timeline & Kirkpatrick', included: true },
        { text: 'Group Management', included: true },
        { text: 'Unlimited Mass Emails', included: true },
        { text: 'Sub-organizations', included: true },
        { text: 'Everything Included', included: true }
      ],
      buttonText: intl.formatMessage({ id: 'landing.pricing.contactSales' }),
      buttonVariant: 'outlined',
      popular: false,
      showTrialChip: false
    }
  ];

  // Full comparison table data from MVP document
  const comparisonData = [
    {
      category: 'landing.pricing.table.aiFeatures',
      rows: [
        { feature: 'landing.pricing.table.smartPulse', essential: '5/day', professional: '20/day', enterprise: 'unlimited' },
        { feature: 'landing.pricing.table.sylloAi', essential: '5/day', professional: '25/day', enterprise: 'unlimited' }
      ]
    },
    {
      category: 'landing.pricing.table.contentLimits',
      rows: [
        { feature: 'landing.pricing.table.projects', essential: '10', professional: '30', enterprise: 'unlimited' },
        { feature: 'landing.pricing.table.courses', essential: '20', professional: '50', enterprise: 'unlimited' },
        { feature: 'landing.pricing.table.curriculums', essential: '10', professional: '25', enterprise: 'unlimited' }
      ]
    },
    {
      category: 'landing.pricing.table.advancedFeatures',
      rows: [
        { feature: 'landing.pricing.table.timeline', essential: false, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.kirkpatrick', essential: false, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.groupManagement', essential: false, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.massEmails', essential: '100/mo', professional: '1,000/mo', enterprise: 'unlimited' },
        { feature: 'landing.pricing.table.subOrganizations', essential: false, professional: false, enterprise: true }
      ]
    },
    {
      category: 'landing.pricing.table.integrations',
      rows: [
        { feature: 'landing.pricing.table.calendarIntegration', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.surveyIntegration', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.analytics', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.timezones', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.multiLanguages', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.attendanceTracker', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.issueTracker', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.parkingLot', essential: true, professional: true, enterprise: true }
      ]
    },
    {
      category: 'landing.pricing.table.coreFeatures',
      rows: [
        { feature: 'landing.pricing.table.trainingSchedule', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.trainingHoursReport', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.massCommunications', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.smartCourseScheduling', essential: true, professional: true, enterprise: true },
        { feature: 'landing.pricing.table.curriculumManagement', essential: true, professional: true, enterprise: true }
      ]
    }
  ];

  const renderCellValue = (value) => {
    if (value === true) {
      return <CheckOutlined style={{ fontSize: '16px', color: theme.palette.success.main }} />;
    }
    if (value === false) {
      return <CloseOutlined style={{ fontSize: '16px', color: theme.palette.grey[500] }} />;
    }
    if (value === 'unlimited') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
          <FormattedMessage id="landing.pricing.table.unlimited" />
        </Typography>
      );
    }
    return <Typography variant="body2">{value}</Typography>;
  };

  return (
    <Box id="pricing" sx={{ py: { xs: 4, md: 10 }, bgcolor: theme.palette.mode === ThemeMode.DARK ? 'grey.0' : 'grey.100' }}>
      <Container>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12}>
            <Grid container spacing={1} justifyContent="center" sx={{ mb: 4, textAlign: 'center' }}>
              <Grid item sm={10} md={6}>
                <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
                  <FormattedMessage id="landing.pricing.subtitle" />
                </Typography>
                <Typography variant="h2" sx={{ mb: 2 }}>
                  <FormattedMessage id="landing.pricing.title" />
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  <FormattedMessage id="landing.pricing.description" />
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Pricing Cards */}
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
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        )}

                        {plan.showTrialChip && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Chip
                              label={<FormattedMessage id="landing.pricing.freeTrial" />}
                              size="small"
                              variant="outlined"
                              color="success"
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                        )}

                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                          {plan.title}
                        </Typography>

                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          <Typography variant="h1" component="span" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                            ${plan.price}
                          </Typography>
                          <Typography variant="h6" component="span" color="textSecondary">
                            {' '}{plan.period}
                          </Typography>
                        </Box>

                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center', minHeight: 48 }}>
                          {plan.description}
                        </Typography>

                        <List sx={{ mb: 3 }}>
                          {plan.features.map((feature, idx) => (
                            <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                {feature.included ? (
                                  <CheckOutlined style={{ fontSize: '16px', color: theme.palette.success.main }} />
                                ) : (
                                  <CloseOutlined style={{ fontSize: '16px', color: theme.palette.grey[500] }} />
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
                              backgroundColor: plan.buttonVariant === 'contained' ? theme.palette.primary.main : 'transparent',
                              borderColor: theme.palette.primary.main,
                              color: plan.buttonVariant === 'contained' ? 'white' : theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: plan.buttonVariant === 'contained' ? theme.palette.primary.dark : 'rgba(0, 131, 253, 0.04)',
                                borderColor: theme.palette.primary.dark
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

          {/* Footer text */}
          <Grid item xs={12} sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              <FormattedMessage id="landing.pricing.footer1" />
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              <FormattedMessage id="landing.pricing.footer2" />
            </Typography>
          </Grid>

          {/* Full Comparison Table */}
          <Grid item xs={12} sx={{ mt: 6 }}>
            <Typography variant="h3" sx={{ textAlign: 'center', mb: 4, fontWeight: 600 }}>
              <FormattedMessage id="landing.pricing.compareFeatures" />
            </Typography>
            <Animation
              variants={{
                hidden: { opacity: 0, translateY: 50 },
                visible: { opacity: 1, translateY: 0 }
              }}
            >
              <TableContainer
                component={Paper}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: 'none',
                  overflow: 'auto'
                }}
              >
                <Table sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.mode === ThemeMode.DARK ? 'grey.50' : 'grey.50' }}>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          position: 'sticky',
                          left: 0,
                          bgcolor: theme.palette.mode === ThemeMode.DARK ? 'grey.50' : 'grey.50',
                          zIndex: 1,
                          minWidth: 200
                        }}
                      >
                        <FormattedMessage id="landing.pricing.feature" />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 120 }}>
                        <FormattedMessage id="landing.pricing.essential" />
                        <Typography variant="caption" display="block" color="textSecondary">$29/mo</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', color: theme.palette.primary.main, minWidth: 120 }}>
                        <FormattedMessage id="landing.pricing.professional" />
                        <Typography variant="caption" display="block" color="primary">$49/mo</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 120 }}>
                        <FormattedMessage id="landing.pricing.enterprise" />
                        <Typography variant="caption" display="block" color="textSecondary">$250/mo</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparisonData.map((group) => (
                      <>
                        {/* Category header row */}
                        <TableRow key={`cat-${group.category}`}>
                          <TableCell
                            colSpan={4}
                            sx={{
                              fontWeight: 700,
                              bgcolor: theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.03)' : 'grey.100',
                              fontSize: '0.85rem',
                              py: 1.5
                            }}
                          >
                            <FormattedMessage id={group.category} />
                          </TableCell>
                        </TableRow>
                        {/* Feature rows */}
                        {group.rows.map((row, rowIndex) => (
                          <TableRow
                            key={`${group.category}-${rowIndex}`}
                            sx={{
                              '&:nth-of-type(even)': {
                                bgcolor: theme.palette.mode === ThemeMode.DARK ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
                              }
                            }}
                          >
                            <TableCell
                              sx={{
                                position: 'sticky',
                                left: 0,
                                bgcolor: 'inherit',
                                zIndex: 1
                              }}
                            >
                              <FormattedMessage id={row.feature} />
                            </TableCell>
                            <TableCell align="center">{renderCellValue(row.essential)}</TableCell>
                            <TableCell align="center">{renderCellValue(row.professional)}</TableCell>
                            <TableCell align="center">{renderCellValue(row.enterprise)}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Animation>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PricingBlock;
