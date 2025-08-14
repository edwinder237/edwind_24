import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Box,
  Typography,
  Grid,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider
} from '@mui/material';
import { PrintOutlined } from '@mui/icons-material';

const TrainingSignOffSheet = ({ open, onClose, data }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Training Sign-off Sheet</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<PrintOutlined />} onClick={handlePrint}>
              Print
            </Button>
            <Button onClick={onClose}>Close</Button>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2, '@media print': { p: 0 } }}>
          <Paper sx={{ p: 3, border: '1px solid #ddd' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight="bold">TRAINING COMPLETION CERTIFICATE</Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                Training Sign-off Sheet
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="h6" gutterBottom>Training Details</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Course Name:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data?.courseName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Duration:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data?.duration ? `${data.duration} minutes` : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Instructor:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data?.instructor || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Date:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data?.completionDate || 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>Participants</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Training Recipient</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Signature</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.participants?.map((participant, index) => (
                    <TableRow key={index}>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{participant.company}</TableCell>
                      <TableCell>{participant.role}</TableCell>
                      <TableCell>{participant.trainingRecipient}</TableCell>
                      <TableCell>{participant.department}</TableCell>
                      <TableCell>{participant.score || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={participant.status} 
                          color={participant.status === 'Completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ height: 40, borderBottom: '1px solid #ddd' }}></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #ddd' }}>
              <Grid container spacing={4}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Instructor Signature:</Typography>
                  <Box sx={{ height: 40, borderBottom: '1px solid #ddd', mt: 1 }}></Box>
                  <Typography variant="caption" color="text.secondary">
                    {data?.instructor || 'Instructor Name'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Date:</Typography>
                  <Box sx={{ height: 40, borderBottom: '1px solid #ddd', mt: 1 }}></Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingSignOffSheet;