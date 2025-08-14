import React, { useMemo } from "react";
import Link from 'next/link';
// material-ui
import { Box, Chip, Typography, Stack, Accordion, AccordionSummary, AccordionDetails, IconButton, Tooltip } from "@mui/material";
import { TreeView, TreeItem } from "@mui/lab";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { EditOutlined } from '@mui/icons-material';

// project import
import MainCard from "components/MainCard";
import VerticalLinearStepper from "./VerticalLinearStepper";

// assets
import { DownOutlined, RightOutlined } from "@ant-design/icons";

// ==============================|| TREE VIEW - DISABLED ||============================== //

const Moduleswidget = React.memo(({ eventState }) => {
  const { courseTitle, modules, course } = eventState;
  
  // Memoize module count to avoid recalculation
  const moduleCount = useMemo(() => modules?.length || 0, [modules]);
  

  if (!course) {
    return (
      <MainCard
        sx={{ height: 'fit-content' }}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">Course Content</Typography>
          </Stack>
        }
      >
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">
            Select an event with a linked course to view modules and activities.
          </Typography>
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard
      sx={{ 
        height: 'fit-content',
        maxHeight: 500,
        "& .MuiCardContent-root": {
          overflowY: 'auto'
        }
      }}
      title={
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">{course.title}</Typography>
            <Chip 
              label={`${moduleCount} modules`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          </Stack>
          <Tooltip title="Edit Course">
            <Link href={`/courses/${course.id}`} passHref>
              <IconButton
                size="small"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.lighter'
                  }
                }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Link>
          </Tooltip>
        </Stack>
      }
    >
      {moduleCount > 0 ? (
        <Box sx={{ mt: 1 }}>
          {modules.map((module, i) => {
            const activityCount = module.activities?.length || 0;
            return (
              <Accordion 
                key={module.id || i}
                sx={{ 
                  mb: 1,
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    '& .MuiAccordionSummary-content': { 
                      alignItems: 'center' 
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                      {module.title}
                    </Typography>
                    <Chip 
                      label={`${activityCount} activities`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <VerticalLinearStepper activities={module.activities || []} />
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">
            No modules found for this course.
          </Typography>
        </Box>
      )}
    </MainCard>
  );
});

export default Moduleswidget;
