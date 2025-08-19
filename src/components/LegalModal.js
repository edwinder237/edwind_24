import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import { Close, Shield, Lock, Security, Verified } from '@mui/icons-material';

const LegalModal = ({ open, onClose, type }) => {
  const getContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          content: (
            <Box sx={{ '& > *': { mb: 3 } }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  1. Introduction
                </Typography>
                <Typography variant="body2" paragraph>
                  EDWIND by Lumeve is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our training management platform.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  2. Information We Collect
                </Typography>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Personal Information:
                </Typography>
                <Typography variant="body2" component="div">
                  • Name, email address, and contact information<br />
                  • Company or organization details<br />
                  • Training records and progress data<br />
                  • User preferences and settings
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  3. How We Use Your Information
                </Typography>
                <Typography variant="body2" component="div">
                  • Providing and maintaining our training management services<br />
                  • Managing user accounts and authentication<br />
                  • Tracking training progress and generating reports<br />
                  • Improving our services and user experience<br />
                  • Ensuring platform security and preventing fraud
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  4. Data Security
                </Typography>
                <Typography variant="body2" paragraph>
                  We implement appropriate technical and organizational measures including encryption, access controls, regular security assessments, and incident response procedures.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  5. Your Rights
                </Typography>
                <Typography variant="body2" component="div">
                  • Right to access your personal data<br />
                  • Right to rectification or correction<br />
                  • Right to erasure ("right to be forgotten")<br />
                  • Right to data portability<br />
                  • Right to object to processing
                </Typography>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Contact:</strong> admin@edwind.ca | Montreal, QC, Canada<br />
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )
        };

      case 'terms':
        return {
          title: 'Terms of Service',
          content: (
            <Box sx={{ '& > *': { mb: 3 } }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  1. Acceptance of Terms
                </Typography>
                <Typography variant="body2" paragraph>
                  By accessing EDWIND training management platform, you accept and agree to be bound by these terms and conditions.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  2. Service Description
                </Typography>
                <Typography variant="body2" component="div">
                  EDWIND provides:<br />
                  • Course creation and management tools<br />
                  • Participant enrollment and tracking<br />
                  • Progress monitoring and reporting<br />
                  • Analytics and performance metrics<br />
                  • Calendar and scheduling features
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  3. Acceptable Use
                </Typography>
                <Typography variant="body2" component="div">
                  You agree not to:<br />
                  • Violate any applicable laws or regulations<br />
                  • Infringe on intellectual property rights<br />
                  • Upload malicious software or harmful content<br />
                  • Attempt unauthorized access to our systems<br />
                  • Share account credentials with unauthorized persons
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  4. Payment Terms
                </Typography>
                <Typography variant="body2" paragraph>
                  Subscription fees are billed in advance on a recurring basis. All fees are non-refundable unless otherwise stated.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  5. Limitation of Liability
                </Typography>
                <Typography variant="body2" paragraph>
                  Lumeve shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
                </Typography>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Contact:</strong> admin@edwind.ca | Montreal, QC, Canada<br />
                  <strong>Governed by:</strong> Laws of Quebec, Canada<br />
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )
        };

      case 'license':
        return {
          title: 'License Agreement',
          content: (
            <Box sx={{ '& > *': { mb: 3 } }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  1. Grant of License
                </Typography>
                <Typography variant="body2" paragraph>
                  Lumeve grants you a limited, non-exclusive, non-transferable, revocable license to access and use EDWIND for your internal business purposes.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  2. Subscription Tiers
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Starter
                      </Typography>
                      <Typography variant="body2">
                        Up to 50 participants<br />
                        Basic features<br />
                        Email support
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Professional
                      </Typography>
                      <Typography variant="body2">
                        Up to 250 participants<br />
                        Advanced analytics<br />
                        Priority support
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Enterprise
                      </Typography>
                      <Typography variant="body2">
                        Unlimited participants<br />
                        Custom features<br />
                        Dedicated support
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  3. Restrictions
                </Typography>
                <Typography variant="body2" component="div">
                  You may not:<br />
                  • Reverse engineer or decompile the software<br />
                  • Sublicense or distribute to third parties<br />
                  • Remove proprietary notices<br />
                  • Use for competitive analysis
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  4. Intellectual Property
                </Typography>
                <Typography variant="body2" paragraph>
                  Lumeve retains all rights to the EDWIND platform. You retain ownership of your training content and data.
                </Typography>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Contact:</strong> admin@edwind.ca | Montreal, QC, Canada<br />
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )
        };

      case 'security':
        return {
          title: 'Security & Compliance',
          content: (
            <Box sx={{ '& > *': { mb: 3 } }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Shield sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Enterprise-grade security protecting your data
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Security Features
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Lock sx={{ fontSize: 20, color: 'primary.main' }} />
                      <Typography variant="body2"><strong>Data Encryption</strong></Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      AES-256 encryption in transit and at rest
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Security sx={{ fontSize: 20, color: 'primary.main' }} />
                      <Typography variant="body2"><strong>Access Controls</strong></Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Role-based permissions and MFA
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Compliance Standards
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    icon={<Verified />} 
                    label="SOC 2 Type II" 
                    size="small"
                    variant="outlined" 
                    color="primary"
                  />
                  <Chip 
                    icon={<Verified />} 
                    label="GDPR Compliant" 
                    size="small"
                    variant="outlined" 
                    color="primary"
                  />
                  <Chip 
                    icon={<Verified />} 
                    label="ISO 27001" 
                    size="small"
                    variant="outlined" 
                    color="primary"
                  />
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Data Protection
                </Typography>
                <Typography variant="body2" component="div">
                  • Data stored in secure Canadian data centers (Quebec compliant)<br />
                  • Automated daily backups with point-in-time recovery<br />
                  • 99.9% uptime SLA<br />
                  • Regular penetration testing<br />
                  • 24/7 security monitoring
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Report Security Issues
                </Typography>
                <Typography variant="body2">
                  Contact our security team at <strong>security@edwind.ca</strong><br />
                  We respond to security reports within 24 hours.
                </Typography>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Contact:</strong> admin@edwind.ca | Montreal, QC, Canada<br />
                  <strong>Security Email:</strong> security@edwind.ca<br />
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )
        };

      default:
        return { title: '', content: null };
    }
  };

  const { title, content } = getContent();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div">
            {title}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: 'grey.500' }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3 }}>
        {content}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LegalModal;