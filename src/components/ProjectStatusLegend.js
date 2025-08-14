import { Box, Stack, Typography, Chip } from "@mui/material";

const ProjectStatusLegend = () => {
  const statusItems = [
    { 
      status: "ongoing", 
      label: "ONGOING", 
      chipProps: { variant: "light", color: "success", size: "small" } 
    },
    { 
      status: "completed", 
      label: "COMPLETED", 
      chipProps: { variant: "light", color: "primary", size: "small" } 
    },
    { 
      status: "pending", 
      label: "PENDING", 
      chipProps: { variant: "light", color: "warning", size: "small" } 
    },
    { 
      status: "cancelled", 
      label: "CANCELLED", 
      chipProps: { variant: "light", color: "error", size: "small" } 
    }
  ];

  return (
    <Box sx={{ py: 1, px: 0.5 }}>
      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500, mr: 1 }}>
          Status:
        </Typography>
        {statusItems.map((item) => (
          <Chip 
            key={item.status} 
            label={item.label} 
            {...item.chipProps}
            sx={{ 
              fontSize: '0.6rem', 
              height: 18, 
              '& .MuiChip-label': { px: 0.75, py: 0 }
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default ProjectStatusLegend;