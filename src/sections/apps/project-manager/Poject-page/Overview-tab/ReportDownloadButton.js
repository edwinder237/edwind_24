import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button, CircularProgress } from '@mui/material';
import { Download } from '@mui/icons-material';
import TrainingReportPDF from './TrainingReportPDF';

const ReportDownloadButton = ({ data, language }) => {
  const fileName = `${(data.project.title || 'Report').replace(/[^a-zA-Z0-9]/g, '_')}_Training_Report.pdf`;

  return (
    <PDFDownloadLink
      document={<TrainingReportPDF data={data} language={language} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button
          variant="contained"
          color="success"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Download />}
        >
          {loading ? 'Building PDF...' : 'Download PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default ReportDownloadButton;
