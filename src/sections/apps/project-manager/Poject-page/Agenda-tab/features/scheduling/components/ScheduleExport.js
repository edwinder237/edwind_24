import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Collapse
} from '@mui/material';
import {
  Print,
  ViewList,
  Email,
  Send,
  CalendarMonth,
  PictureAsPdf,
  ExpandMore,
  ExpandLess,
  Download
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useSelector } from 'store';
import useUser from 'hooks/useUser';

const ScheduleExport = ({ projectEvents = [], projectTitle: propProjectTitle = "Project Schedule" }) => {
  // Get current user for pre-filling email
  const { user } = useUser();
  // Get projectId and projectInfo from projectSettings store (proper CQRS pattern - same as ParticipantsTable)
  const projectId = useSelector(state => state.projectSettings?.projectId);
  const storeProjectTitle = useSelector(state => state.projectSettings?.projectInfo?.title);
  // Use store title if available, otherwise fall back to prop
  const projectTitle = storeProjectTitle || propProjectTitle;
  // Read groups from projectAgenda store (CQRS Read Model)
  const groups = useSelector(state => state.projectAgenda?.groups) || [];
  // Get project instructors from projectAgenda store (loaded with agenda data)
  const projectInstructors = useSelector(state => state.projectAgenda?.instructors) || [];
  // Get project timezone from settings
  const projectTimezone = useSelector(state => state.projectSettings?.settings?.timezone);
  const [viewMode, setViewMode] = useState('preview');
  const [dailyFocusData, setDailyFocusData] = useState({});
  const focusCache = useRef(new Map());
  
  // Calendar invite states
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [onlyAssignedEvents, setOnlyAssignedEvents] = useState(true);
  const [includeMeetingLink, setIncludeMeetingLink] = useState(true);
  const [customMeetingLink, setCustomMeetingLink] = useState('');
  const [sendToInstructors, setSendToInstructors] = useState(false);
  
  // Trainer email states
  const [sendingTrainerEmail, setSendingTrainerEmail] = useState(false);
  const [trainerEmailResult, setTrainerEmailResult] = useState(null);

  // Email options states
  const [showEmailOptions, setShowEmailOptions] = useState(false);
  const [useCustomRecipients, setUseCustomRecipients] = useState(false);
  const [additionalEmails, setAdditionalEmails] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [bccEmails, setBccEmails] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Training Schedule - ${projectTitle}`);
  const [includePdf, setIncludePdf] = useState(false);

  // Update email subject when project title changes (e.g., when store loads)
  useEffect(() => {
    if (projectTitle && projectTitle !== 'Project Schedule') {
      setEmailSubject(`Training Schedule - ${projectTitle}`);
    }
  }, [projectTitle]);

  // Email validation states
  const [emailErrors, setEmailErrors] = useState({ to: '', cc: '', bcc: '' });

  // Meeting link validation state
  const [meetingLinkError, setMeetingLinkError] = useState('');

  // Preview states
  const [previewHtml, setPreviewHtml] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Preview customization options
  const [showLogo, setShowLogo] = useState(true);
  const [showFocusOfDay, setShowFocusOfDay] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(projectTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Update timezone when project timezone loads
  useEffect(() => {
    if (projectTimezone) {
      setSelectedTimezone(projectTimezone);
    }
  }, [projectTimezone]);

  // PDF download state
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Common timezones for selection
  const timezones = [
    { value: 'America/Edmonton', label: 'Mountain Time (Edmonton)' },
    { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)' },
    { value: 'America/Toronto', label: 'Eastern Time (Toronto)' },
    { value: 'America/Winnipeg', label: 'Central Time (Winnipeg)' },
    { value: 'America/Halifax', label: 'Atlantic Time (Halifax)' },
    { value: 'America/St_Johns', label: 'Newfoundland Time (St. John\'s)' },
    { value: 'America/New_York', label: 'Eastern Time (New York)' },
    { value: 'America/Chicago', label: 'Central Time (Chicago)' },
    { value: 'America/Denver', label: 'Mountain Time (Denver)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
    { value: 'America/Phoenix', label: 'Arizona Time (Phoenix)' },
    { value: 'Europe/London', label: 'GMT (London)' },
    { value: 'Europe/Paris', label: 'Central European Time (Paris)' },
    { value: 'Europe/Berlin', label: 'Central European Time (Berlin)' },
    { value: 'Asia/Dubai', label: 'Gulf Time (Dubai)' },
    { value: 'Asia/Singapore', label: 'Singapore Time' },
    { value: 'Asia/Tokyo', label: 'Japan Time (Tokyo)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)' },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
  ];

  // Fetch daily focus data
  useEffect(() => {
    if (projectId && projectEvents.length > 0) {
      fetchAllDailyFocus();
    }
  }, [projectId, projectEvents]);

  // Load preview on initial mount when in preview mode
  useEffect(() => {
    if (viewMode === 'preview' && projectId && projectEvents.length > 0 && !previewHtml && !loadingPreview) {
      handleOpenPreview();
    }
  }, [viewMode, projectId, projectEvents.length]);

  const fetchAllDailyFocus = async () => {
    if (!projectId) return;
    
    const uniqueDates = [...new Set(projectEvents.map(event => {
      const eventDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
      return format(eventDate, 'yyyy-MM-dd');
    }))];

    const focusData = {};
    
    for (const dateKey of uniqueDates) {
      const cacheKey = `${projectId}_${dateKey}`;
      if (focusCache.current.has(cacheKey)) {
        const cachedData = focusCache.current.get(cacheKey);
        if (cachedData?.focus) {
          focusData[dateKey] = cachedData.focus;
        }
      } else {
        try {
          const response = await fetch(`/api/projects/daily-focus?projectId=${projectId}&date=${dateKey}`);
          if (response.ok) {
            const data = await response.json();
            const focusText = data?.focus || '';
            focusCache.current.set(cacheKey, { focus: focusText });
            if (focusText) {
              focusData[dateKey] = focusText;
            }
          }
        } catch (error) {
          console.error('Error fetching daily focus:', error);
        }
      }
    }

    setDailyFocusData(focusData);
  };

  // Group events by date
  const groupedEvents = projectEvents.reduce((acc, event) => {
    const eventDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
    const dateKey = format(eventDate, 'yyyy-MM-dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort();

  const handleViewModeChange = (event, newMode) => {
    if (newMode) {
      setViewMode(newMode);
      // Load preview when switching to preview mode
      if (newMode === 'preview' && !previewHtml && !loadingPreview) {
        handleOpenPreview();
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calendar invite functions
  const handleOpenGroupSelection = () => {
    setSelectedGroups([]);
    setInviteResult(null);
    setShowGroupSelection(true);
  };

  const handleCloseGroupSelection = () => {
    setShowGroupSelection(false);
    setSelectedGroups([]);
    setInviteResult(null);
    setCustomMeetingLink('');
    setMeetingLinkError('');
    setSendToInstructors(false);
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Preview functions
  const handleOpenPreview = async (customShowLogo, customShowFocus, customTimezone) => {
    if (!projectId) {
      return;
    }

    // Use passed values or current state
    const logoVisible = customShowLogo !== undefined ? customShowLogo : showLogo;
    const focusVisible = customShowFocus !== undefined ? customShowFocus : showFocusOfDay;
    const timezone = customTimezone !== undefined ? customTimezone : selectedTimezone;

    setLoadingPreview(true);
    try {
      const response = await fetch('/api/projects/trainer-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'preview',
          projectId,
          projectTitle,
          events: projectEvents,
          dailyFocusData,
          includeEventSummaries: true,
          showLogo: logoVisible,
          showFocusOfDay: focusVisible,
          timezone
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPreviewHtml(result.html);
      } else {
        console.error('Failed to generate preview:', result.message);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  // PDF download function - uses browser print dialog
  const handleDownloadPdf = async () => {
    let htmlContent = previewHtml;

    // Generate preview first if not available
    if (!htmlContent) {
      setDownloadingPdf(true);
      try {
        const response = await fetch('/api/projects/trainer-schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'preview',
            projectId,
            projectTitle,
            events: projectEvents,
            dailyFocusData,
            includeEventSummaries: true,
            showLogo,
            showFocusOfDay,
            timezone: selectedTimezone
          }),
        });

        const result = await response.json();
        if (response.ok && result.success) {
          htmlContent = result.html;
          setPreviewHtml(result.html);
        } else {
          console.error('Failed to generate preview for PDF');
          setDownloadingPdf(false);
          return;
        }
      } catch (error) {
        console.error('Error generating preview:', error);
        setDownloadingPdf(false);
        return;
      }
    }

    setDownloadingPdf(true);

    // Open HTML in a new window with fixed width to match email template
    const printWindow = window.open('', '_blank', 'width=950,height=800');
    if (printWindow) {
      // Add print-specific styles to override responsive CSS that stacks columns
      const printStyles = `
        <style>
          /* Force all table cells to align top */
          td, th {
            vertical-align: top !important;
          }
          /* Override the responsive stacking for print - must come after the original styles */
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            /* Prevent column stacking in print mode */
            .stack .column {
              width: auto !important;
              display: table-cell !important;
              vertical-align: top !important;
            }
            .row-content.stack {
              display: table !important;
              width: 100% !important;
            }
            /* Force ALL td elements to top align */
            td, th {
              vertical-align: top !important;
            }
          }
          /* Also override for screen when print dialog renders */
          @media (max-width: 920px) {
            .stack .column {
              width: auto !important;
              display: table-cell !important;
              vertical-align: top !important;
            }
            .row-content.stack {
              display: table !important;
              width: 100% !important;
            }
            td, th {
              vertical-align: top !important;
            }
          }
        </style>
      `;

      // Insert print styles before closing head tag
      const htmlWithPrintStyles = htmlContent.replace('</head>', `${printStyles}</head>`);

      printWindow.document.write(htmlWithPrintStyles);
      printWindow.document.close();

      // Set document title for the PDF filename
      const sanitizedTitle = projectTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
      printWindow.document.title = `${sanitizedTitle}-Schedule`;

      // Wait for images to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setDownloadingPdf(false);
        }, 800);
      };

      // Fallback in case onload doesn't fire
      setTimeout(() => {
        setDownloadingPdf(false);
      }, 4000);
    } else {
      console.error('Could not open print window. Please allow popups.');
      setDownloadingPdf(false);
    }
  };

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Helper to validate a single email
  const isValidEmail = (email) => emailRegex.test(email);

  // Helper to parse comma-separated emails (returns only valid emails)
  const parseEmails = (emailString) => {
    if (!emailString || !emailString.trim()) return [];
    return emailString.split(',')
      .map(email => email.trim())
      .filter(email => email && isValidEmail(email));
  };

  // Helper to get invalid emails from a string
  const getInvalidEmails = (emailString) => {
    if (!emailString || !emailString.trim()) return [];
    return emailString.split(',')
      .map(email => email.trim())
      .filter(email => email && !isValidEmail(email));
  };

  // Validate email field and update error state
  const validateEmailField = (value, field) => {
    const invalidEmails = getInvalidEmails(value);
    if (invalidEmails.length > 0) {
      setEmailErrors(prev => ({
        ...prev,
        [field]: `Invalid email${invalidEmails.length > 1 ? 's' : ''}: ${invalidEmails.join(', ')}`
      }));
      return false;
    } else {
      setEmailErrors(prev => ({ ...prev, [field]: '' }));
      return true;
    }
  };

  // Validate meeting link URL for security
  const validateMeetingLink = (url) => {
    if (!url || !url.trim()) {
      setMeetingLinkError('');
      return true; // Empty is valid (optional field)
    }

    const trimmedUrl = url.trim();

    // Check for javascript: protocol (XSS attack)
    if (/^javascript:/i.test(trimmedUrl)) {
      setMeetingLinkError('Invalid URL: javascript protocol not allowed');
      return false;
    }

    // Check for data: protocol (potential XSS)
    if (/^data:/i.test(trimmedUrl)) {
      setMeetingLinkError('Invalid URL: data protocol not allowed');
      return false;
    }

    // Check for vbscript: protocol
    if (/^vbscript:/i.test(trimmedUrl)) {
      setMeetingLinkError('Invalid URL: vbscript protocol not allowed');
      return false;
    }

    // Must start with http:// or https://
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setMeetingLinkError('URL must start with https:// or http://');
      return false;
    }

    // Basic URL structure validation
    try {
      const urlObj = new URL(trimmedUrl);
      // Ensure it has a valid hostname (not empty or localhost-like for production)
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        setMeetingLinkError('Invalid URL: hostname is too short');
        return false;
      }
    } catch {
      setMeetingLinkError('Invalid URL format');
      return false;
    }

    setMeetingLinkError('');
    return true;
  };

  // Direct send to specified recipients
  const handleSendTrainerEmailDirect = async () => {
    let toEmails = [];

    // If using custom recipients, validate and parse the email fields
    if (useCustomRecipients) {
      // Validate all email fields first
      const toValid = validateEmailField(additionalEmails, 'to');
      const ccValid = validateEmailField(ccEmails, 'cc');
      const bccValid = validateEmailField(bccEmails, 'bcc');

      if (!toValid || !ccValid || !bccValid) {
        setTrainerEmailResult({ type: 'error', message: 'Please fix invalid email addresses before sending.' });
        return;
      }

      // Use recipient emails from input field
      toEmails = parseEmails(additionalEmails);

      if (toEmails.length === 0) {
        setTrainerEmailResult({ type: 'error', message: 'Please enter at least one recipient email address.' });
        return;
      }
    } else {
      // Use current user's email as default
      if (user?.email) {
        toEmails.push(user.email);
      }
    }

    if (toEmails.length === 0) {
      setTrainerEmailResult({ type: 'error', message: 'No email recipients specified.' });
      return;
    }

    if (!projectId) {
      setTrainerEmailResult({ type: 'error', message: 'Project not loaded. Please try again.' });
      return;
    }

    setSendingTrainerEmail(true);
    setTrainerEmailResult(null);

    // Parse CC and BCC emails (always available now)
    const ccEmailList = parseEmails(ccEmails);
    const bccEmailList = parseEmails(bccEmails);

    try {
      const response = await fetch('/api/projects/trainer-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          projectId,
          projectTitle,
          events: projectEvents,
          dailyFocusData,
          trainerEmails: toEmails,
          ccEmails: ccEmailList,
          bccEmails: bccEmailList,
          customSubject: emailSubject.trim() || null,
          customTemplate: null,
          templateType: 'summary',
          includeEventSummaries: true,
          showLogo,
          showFocusOfDay,
          timezone: selectedTimezone,
          includePdf
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const recipientSummary = toEmails.length === 1
          ? toEmails[0]
          : `${toEmails.length} recipients`;
        setTrainerEmailResult({
          type: 'success',
          message: `Schedule sent to ${recipientSummary}`
        });
        // Clear success message after 3 seconds
        setTimeout(() => {
          setTrainerEmailResult(null);
        }, 3000);
      } else {
        setTrainerEmailResult({
          type: 'error',
          message: `Failed to send: ${result.message || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Error sending trainer schedule:', error);
      setTrainerEmailResult({
        type: 'error',
        message: 'Failed to send schedule. Please try again.'
      });
    } finally {
      setSendingTrainerEmail(false);
    }
  };

  const handleSendCalendarInvites = async () => {
    // Require at least one group OR instructors to be selected
    if (selectedGroups.length === 0 && !sendToInstructors) {
      setInviteResult({ type: 'error', message: 'Please select at least one group or enable "Send to all instructors".' });
      return;
    }

    // Validate meeting link if provided
    if (includeMeetingLink && customMeetingLink.trim() && !validateMeetingLink(customMeetingLink)) {
      setInviteResult({ type: 'error', message: 'Please fix the meeting link URL before sending.' });
      return;
    }

    setSendingInvites(true);
    setInviteResult(null);

    try {
      // Filter events based on the onlyAssignedEvents option
      // Check both eg.groupId and eg.groups?.id to handle different data structures
      const eventsToSend = onlyAssignedEvents && selectedGroups.length > 0
        ? projectEvents.filter(event =>
            event.event_groups?.some(eg => selectedGroups.includes(eg.groupId) || selectedGroups.includes(eg.groups?.id))
          )
        : projectEvents;

      // Get instructor emails if sendToInstructors is enabled
      const instructorEmails = sendToInstructors
        ? projectInstructors
            .map(pi => pi.instructor?.email || pi.email)
            .filter(Boolean)
        : [];

      const response = await fetch('/api/projects/send-calendar-invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          groupIds: selectedGroups,
          events: eventsToSend,
          projectTitle,
          dailyFocusData,
          onlyAssignedEvents,
          includeMeetingLink,
          customMeetingLink: customMeetingLink.trim() || null,
          instructorEmails: instructorEmails.length > 0 ? instructorEmails : undefined,
          timezone: selectedTimezone
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const recipientCount = result.summary?.successCount || 0;
        const instructorNote = sendToInstructors && instructorEmails.length > 0
          ? ` (including ${instructorEmails.length} instructor${instructorEmails.length !== 1 ? 's' : ''})`
          : '';
        setInviteResult({
          type: 'success',
          message: `Calendar invites sent successfully! ${recipientCount} recipient${recipientCount !== 1 ? 's' : ''} received invites${instructorNote}.`
        });
        // Auto close after 3 seconds
        setTimeout(() => {
          handleCloseGroupSelection();
        }, 3000);
      } else {
        setInviteResult({
          type: 'error',
          message: `Failed to send calendar invites: ${result.message || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Error sending calendar invites:', error);
      setInviteResult({
        type: 'error',
        message: 'Failed to send calendar invites. Please try again.'
      });
    } finally {
      setSendingInvites(false);
    }
  };

  const getEventDisplayTitle = (event) => {
    const baseTitle = event.title || 'Untitled Event';
    const groups = event.event_groups || [];

    if (groups.length === 0) return baseTitle;

    const groupNames = groups.map(eventGroup => eventGroup.groups?.groupName).filter(Boolean);
    if (groupNames.length === 0) return baseTitle;

    return `${baseTitle} (${groupNames.join(', ')})`;
  };

  // CSV Export function
  const handleExportCSV = () => {
    // CSV header
    const headers = ['Date', 'Time', 'Event', 'Course', 'Groups', 'Type'];

    // Build rows from events
    const rows = [];
    sortedDates.forEach(dateKey => {
      const dayEvents = groupedEvents[dateKey];
      const eventDate = parseISO(dateKey + 'T12:00:00');

      dayEvents
        .sort((a, b) => {
          const startA = typeof a.start === 'string' ? parseISO(a.start) : new Date(a.start);
          const startB = typeof b.start === 'string' ? parseISO(b.start) : new Date(b.start);
          return startA - startB;
        })
        .forEach((event, index) => {
          const startDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
          const endDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end)) : null;
          const startTime = format(startDate, 'HH:mm');
          const endTime = endDate ? format(endDate, 'HH:mm') : '';

          const groups = event.event_groups || [];
          const groupNames = groups.map(eventGroup => eventGroup.groups?.groupName).filter(Boolean);

          rows.push([
            format(eventDate, 'MMM d, yyyy'),
            `${startTime}${endTime ? ` - ${endTime}` : ''}`,
            getEventDisplayTitle(event),
            event.course?.title || '-',
            groupNames.length > 0 ? groupNames.join(', ') : '-',
            event.course ? 'Course' : 'Event'
          ]);
        });
    });

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderTableView = () => (
    <Box sx={{ p: 2 }}>
      {/* Export CSV Button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download />}
          onClick={handleExportCSV}
        >
          Export CSV
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Time</strong></TableCell>
              <TableCell><strong>Event</strong></TableCell>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Groups</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedDates.map((dateKey) => {
              const dayEvents = groupedEvents[dateKey];
              const eventDate = parseISO(dateKey + 'T12:00:00');
              
              return dayEvents
                .sort((a, b) => {
                  const startA = typeof a.start === 'string' ? parseISO(a.start) : new Date(a.start);
                  const startB = typeof b.start === 'string' ? parseISO(b.start) : new Date(b.start);
                  return startA - startB;
                })
                .map((event, index) => {
                const startDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
                const endDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end)) : null;
                const startTime = format(startDate, 'HH:mm');
                const endTime = endDate ? format(endDate, 'HH:mm') : '';
                
                const groups = event.event_groups || [];
                const groupNames = groups.map(eventGroup => eventGroup.groups?.groupName).filter(Boolean);
                
                return (
                  <TableRow key={`${dateKey}-${event.id}`} hover>
                    <TableCell>
                      {index === 0 ? format(eventDate, 'MMM d, yyyy') : ''}
                    </TableCell>
                    <TableCell>
                      {startTime}{endTime && ` - ${endTime}`}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getEventDisplayTitle(event)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {event.course ? (
                        <Chip label={event.course.title} size="small" color="success" variant="outlined" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {groupNames.length > 0 ? groupNames.join(', ') : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={event.course ? 'Course' : 'Event'} 
                        size="small"
                        color={event.course ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                );
              });
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold', flex: 1 }}>
            {projectTitle}
          </Typography>

          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="preview">
                {loadingPreview ? <CircularProgress size={16} sx={{ mr: 0.5 }} /> : <CalendarMonth sx={{ mr: 0.5 }} />}
                Schedule
              </ToggleButton>
              <ToggleButton value="table">
                <ViewList sx={{ mr: 0.5 }} />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Email />}
              onClick={handleOpenGroupSelection}
            >
              Send Invites
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {viewMode === 'table' ? renderTableView() : (
          <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Customization Options */}
            <Box sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mr: 1 }}>
                Customize:
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={showLogo}
                    onChange={(e) => {
                      setShowLogo(e.target.checked);
                      if (previewHtml) {
                        handleOpenPreview(e.target.checked, showFocusOfDay, selectedTimezone);
                      }
                    }}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Show Logo</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showFocusOfDay}
                    onChange={(e) => {
                      setShowFocusOfDay(e.target.checked);
                      if (previewHtml) {
                        handleOpenPreview(showLogo, e.target.checked, selectedTimezone);
                      }
                    }}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Show Focus of the Day</Typography>}
              />
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="timezone-select-label">Time Zone</InputLabel>
                <Select
                  labelId="timezone-select-label"
                  value={selectedTimezone}
                  label="Time Zone"
                  onChange={(e) => {
                    setSelectedTimezone(e.target.value);
                    if (previewHtml) {
                      handleOpenPreview(showLogo, showFocusOfDay, e.target.value);
                    }
                  }}
                >
                  {timezones.map((tz) => (
                    <MenuItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Actions Section */}
            <Box sx={{
              mb: 2,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              {/* Main Actions Row */}
              <Box sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mr: 1 }}>
                  Actions:
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={downloadingPdf ? <CircularProgress size={16} /> : <PictureAsPdf />}
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? 'Generating...' : 'Download PDF'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Print />}
                  onClick={handlePrint}
                  disabled={!previewHtml}
                >
                  Print
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={sendingTrainerEmail ? <CircularProgress size={16} color="inherit" /> : <Send />}
                  onClick={handleSendTrainerEmailDirect}
                  disabled={sendingTrainerEmail}
                >
                  {sendingTrainerEmail ? 'Sending...' : 'Send Email'}
                </Button>
                <Button
                  variant="text"
                  size="small"
                  endIcon={showEmailOptions ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setShowEmailOptions(!showEmailOptions)}
                  sx={{ ml: 'auto' }}
                >
                  {showEmailOptions ? 'Hide' : 'Email Options'}
                </Button>
              </Box>

              {/* Email Result Alert - Shown below actions for visibility */}
              {trainerEmailResult && (
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  <Alert
                    severity={trainerEmailResult.type}
                    sx={{ py: 0.5 }}
                    onClose={() => setTrainerEmailResult(null)}
                  >
                    {trainerEmailResult.message}
                  </Alert>
                </Box>
              )}

              {/* Expandable Email Options */}
              <Collapse in={showEmailOptions}>
                <Divider />
                <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Stack spacing={2}>
                    {/* Default recipient info with switch */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Send to: <strong>{user?.email}</strong>
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={useCustomRecipients}
                            onChange={(e) => setUseCustomRecipients(e.target.checked)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2">Change recipient</Typography>}
                        labelPlacement="start"
                        sx={{ mr: 0 }}
                      />
                    </Box>

                    {/* Custom recipient field - only shown when switch is on */}
                    <Collapse in={useCustomRecipients}>
                      <TextField
                        label="To"
                        placeholder="email1@example.com, email2@example.com"
                        size="small"
                        fullWidth
                        value={additionalEmails}
                        onChange={(e) => {
                          setAdditionalEmails(e.target.value);
                          if (emailErrors.to) setEmailErrors(prev => ({ ...prev, to: '' }));
                        }}
                        onBlur={() => validateEmailField(additionalEmails, 'to')}
                        error={!!emailErrors.to}
                        helperText={emailErrors.to || "Separate multiple emails with commas"}
                      />
                    </Collapse>

                    {/* CC and BCC - always visible */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="CC"
                        placeholder="cc@example.com"
                        size="small"
                        fullWidth
                        value={ccEmails}
                        onChange={(e) => {
                          setCcEmails(e.target.value);
                          if (emailErrors.cc) setEmailErrors(prev => ({ ...prev, cc: '' }));
                        }}
                        onBlur={() => validateEmailField(ccEmails, 'cc')}
                        error={!!emailErrors.cc}
                        helperText={emailErrors.cc || "Carbon copy recipients"}
                      />
                      <TextField
                        label="BCC"
                        placeholder="bcc@example.com"
                        size="small"
                        fullWidth
                        value={bccEmails}
                        onChange={(e) => {
                          setBccEmails(e.target.value);
                          if (emailErrors.bcc) setEmailErrors(prev => ({ ...prev, bcc: '' }));
                        }}
                        onBlur={() => validateEmailField(bccEmails, 'bcc')}
                        error={!!emailErrors.bcc}
                        helperText={emailErrors.bcc || "Blind carbon copy recipients"}
                      />
                    </Stack>

                    {/* Custom subject */}
                    <TextField
                      label="Subject"
                      size="small"
                      fullWidth
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      helperText="Modify the email subject as needed"
                    />

                    {/* PDF attachment option */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includePdf}
                          onChange={(e) => setIncludePdf(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Attach PDF to email"
                    />
                  </Stack>
                </Box>
              </Collapse>
            </Box>

            {/* Preview Content */}
            {loadingPreview ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: 400 }}>
                <CircularProgress />
              </Box>
            ) : previewHtml ? (
              <Box sx={{ backgroundColor: '#f5f5f5', borderRadius: 1, flex: 1, minHeight: 600 }}>
                <iframe
                  srcDoc={previewHtml}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    minHeight: '600px',
                    borderRadius: '4px'
                  }}
                  title="Email Preview"
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: 400, color: 'text.secondary' }}>
                <Typography>Loading schedule...</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Group Selection Dialog */}
      <Dialog
        open={showGroupSelection}
        onClose={handleCloseGroupSelection}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme => theme.palette.background.paper,
            backgroundImage: 'none',
            maxWidth: '500px',
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Email color="primary" />
            <Typography variant="h5" fontWeight={500}>Send Calendar Invites</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which groups should receive individual calendar invites.
          </Typography>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mb: 2,
            pb: 2,
            borderBottom: theme => `1px solid ${theme.palette.divider}`
          }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={onlyAssignedEvents}
                  onChange={(e) => setOnlyAssignedEvents(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2">Send only events assigned to selected groups</Typography>}
              sx={{ m: 0 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={includeMeetingLink}
                  onChange={(e) => setIncludeMeetingLink(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2">Include meeting link</Typography>}
              sx={{ m: 0 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={sendToInstructors}
                  onChange={(e) => setSendToInstructors(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    Send to all project instructors
                    {projectInstructors.length > 0 && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                        ({projectInstructors.length} instructor{projectInstructors.length !== 1 ? 's' : ''})
                      </Typography>
                    )}
                  </Typography>
                  {projectInstructors.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                      {projectInstructors
                        .map(pi => pi.instructor?.email || pi.email)
                        .filter(Boolean)
                        .join(', ')}
                    </Typography>
                  )}
                </Box>
              }
              sx={{ m: 0, alignItems: 'flex-start' }}
            />
          </Box>

          {includeMeetingLink && (
            <TextField
              label="Custom Meeting Link (optional)"
              placeholder="https://meet.google.com/... or https://teams.microsoft.com/..."
              size="small"
              fullWidth
              value={customMeetingLink}
              onChange={(e) => {
                setCustomMeetingLink(e.target.value);
                if (meetingLinkError) setMeetingLinkError('');
              }}
              onBlur={() => validateMeetingLink(customMeetingLink)}
              error={!!meetingLinkError}
              helperText={meetingLinkError || "Leave empty to use the meeting link from each event"}
              sx={{ mb: 2 }}
            />
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
            {onlyAssignedEvents
              ? "Only events specifically assigned to the selected groups will be included in the invites."
              : "All scheduled events will be included in the invites for all selected groups."
            }
            {!includeMeetingLink && " Meeting links will be excluded from invites."}
          </Typography>

          {inviteResult && (
            <Alert
              severity={inviteResult.type}
              sx={{ mb: 2 }}
              onClose={() => setInviteResult(null)}
            >
              {inviteResult.message}
            </Alert>
          )}

          {groups && groups.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '300px', overflowY: 'auto' }}>
              {groups.map((group) => {
                // Check both eg.groupId and eg.groups?.id to handle different data structures
                const eventCount = onlyAssignedEvents
                  ? projectEvents.filter(event =>
                      event.event_groups?.some(eg => eg.groupId === group.id || eg.groups?.id === group.id)
                    ).length
                  : projectEvents.length;

                return (
                  <Stack
                    key={group.id}
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: theme => `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme => selectedGroups.includes(group.id)
                        ? theme.palette.action.selected
                        : theme.palette.background.paper,
                      '&:hover': {
                        backgroundColor: theme => theme.palette.action.hover
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Checkbox
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => handleGroupToggle(group.id)}
                      color="primary"
                      size="small"
                    />
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: group.chipColor || '#1976d2',
                        flexShrink: 0
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {group.groupName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {group.participants?.length || 0} participant{(group.participants?.length || 0) !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${eventCount} event${eventCount !== 1 ? 's' : ''}`}
                      size="small"
                      variant={selectedGroups.includes(group.id) ? "filled" : "outlined"}
                      color={selectedGroups.includes(group.id) ? "primary" : "default"}
                      sx={{
                        fontWeight: selectedGroups.includes(group.id) ? 600 : 400,
                        minWidth: '80px'
                      }}
                    />
                  </Stack>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No groups found for this project.
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 2, 
          borderTop: theme => `1px solid ${theme.palette.divider}`,
          backgroundColor: theme => theme.palette.grey[50]
        }}>
          <Button 
            onClick={handleCloseGroupSelection} 
            disabled={sendingInvites}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendCalendarInvites}
            disabled={(selectedGroups.length === 0 && !sendToInstructors) || sendingInvites}
            startIcon={sendingInvites ? <CircularProgress size={16} color="inherit" /> : <Send />}
          >
            {sendingInvites ? 'Sending...' : (() => {
              const eventsToSend = (onlyAssignedEvents && selectedGroups.length > 0)
                ? projectEvents.filter(event =>
                    event.event_groups?.some(eg => selectedGroups.includes(eg.groupId) || selectedGroups.includes(eg.groups?.id))
                  ).length
                : projectEvents.length;

              const parts = [];
              if (selectedGroups.length > 0) {
                const groupText = selectedGroups.length === 1 ? 'Group' : 'Groups';
                parts.push(`${selectedGroups.length} ${groupText}`);
              }
              if (sendToInstructors && projectInstructors.length > 0) {
                parts.push(`${projectInstructors.length} Instructor${projectInstructors.length !== 1 ? 's' : ''}`);
              }
              const eventText = eventsToSend === 1 ? 'Event' : 'Events';
              const recipientText = parts.length > 0 ? parts.join(', ') : '0 Recipients';
              return `Send Invites (${recipientText}, ${eventsToSend} ${eventText})`;
            })()}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ScheduleExport;