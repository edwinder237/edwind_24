import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Stack, 
  Chip, 
  Card, 
  CardContent, 
  Alert,
  Button,
  Link,
  Grid,
  CircularProgress
} from '@mui/material';
import { 
  LocationOnOutlined, 
  DirectionsOutlined, 
  OpenInNewOutlined 
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Direct imports for Google Maps components
import { GoogleMap, LoadScriptNext, DirectionsRenderer } from '@react-google-maps/api';

// Utility functions separated from component
const mapUtils = {
  // Memoized marker icon generator
  createMarkerIcon: (() => {
    const cache = new Map();
    return (projectId, color) => {
      const key = `${projectId}-${color}`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const icon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="3"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${projectId}</text>
          </svg>
        `)}`
        ,
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      };
      
      cache.set(key, icon);
      return icon;
    };
  })(),

  parseLocationData(location) {
    if (!location) return null;
    if (typeof location === 'string') {
      try {
        return JSON.parse(location);
      } catch {
        return null;
      }
    }
    return location;
  },

  getProjectStatusColor(status, theme) {
    switch (status?.toLowerCase()) {
      case 'completed': return theme.palette.success.main;
      case 'ongoing': return theme.palette.info.main;
      case 'pending': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.primary.main;
    }
  },

  formatDate(date) {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString();
  },

  generateMapsUrl(projects) {
    if (projects.length === 0) return null;
    const waypoints = projects.map(p => `${p.location.lat},${p.location.lng}`).join('|');
    return `https://www.google.com/maps/dir/${waypoints}`;
  },

  sortProjectsByDate(projects) {
    return [...projects].sort((a, b) => {
      const dateA = new Date(a.startDate || a.project_settings?.startDate || 0);
      const dateB = new Date(b.startDate || b.project_settings?.startDate || 0);
      return dateA - dateB;
    });
  }
};

// Custom hooks for better separation of concerns
const useGeocodedProjects = (projects, map) => {
  const [geocodedProjects, setGeocodedProjects] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const geocodeProjects = useCallback(async () => {
    if (!map || !window.google?.maps?.places) return;

    const projectsToGeocode = projects.filter(project => {
      const location = mapUtils.parseLocationData(project.location);
      return location?.place_id && location?.description && !location.lat && !location.lng;
    }).map(project => ({
      ...project,
      location: mapUtils.parseLocationData(project.location)
    }));

    if (projectsToGeocode.length === 0) {
      setGeocodedProjects([]);
      return;
    }

    setIsGeocoding(true);
    const tempDiv = document.createElement('div');
    const placesService = new window.google.maps.places.PlacesService(tempDiv);

    try {
      const results = await Promise.all(
        projectsToGeocode.map((project, index) => 
          new Promise(resolve => {
            setTimeout(() => {
              placesService.getDetails(
                {
                  placeId: project.location.place_id,
                  fields: ['name', 'geometry', 'formatted_address']
                },
                (place, status) => {
                  if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    resolve({
                      ...project,
                      location: {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.formatted_address || project.location.description,
                        place_id: project.location.place_id
                      }
                    });
                  } else {
                    resolve(null);
                  }
                }
              );
            }, index * 200);
          })
        )
      );
      
      setGeocodedProjects(results.filter(Boolean));
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  }, [map, projects]);

  useEffect(() => {
    const timer = setTimeout(geocodeProjects, 500);
    return () => clearTimeout(timer);
  }, [geocodeProjects]);

  return { geocodedProjects, isGeocoding };
};

const useProjectsWithLocation = (projects, geocodedProjects) => {
  return useMemo(() => {
    const validProjects = [];
    
    projects.forEach(project => {
      const location = mapUtils.parseLocationData(project.location);
      if (location?.lat && location?.lng && 
          !isNaN(parseFloat(location.lat)) && !isNaN(parseFloat(location.lng))) {
        validProjects.push({
          ...project,
          location: {
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lng),
            address: location.address || location.description || 'No address provided'
          }
        });
      }
    });

    validProjects.push(...geocodedProjects);
    return validProjects;
  }, [projects, geocodedProjects]);
};

const useMapBounds = (projectsWithLocation, map) => {
  const [mapCenter, setMapCenter] = useState({
    lat: 45.5017, // Montreal coordinates as default
    lng: -73.5673
  });

  useEffect(() => {
    if (projectsWithLocation.length > 0 && map && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      projectsWithLocation.forEach(project => {
        bounds.extend(project.location);
      });
      
      map.fitBounds(bounds);
      setMapCenter({
        lat: bounds.getCenter().lat(),
        lng: bounds.getCenter().lng()
      });
    }
  }, [projectsWithLocation, map]);

  return mapCenter;
};

const useDirections = (projectsWithLocation, showDirections) => {
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const calculateRoute = useCallback(async () => {
    if (projectsWithLocation.length < 2 || !showDirections || !window.google) {
      setDirectionsResponse(null);
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();
      const sortedProjects = mapUtils.sortProjectsByDate(projectsWithLocation);
      const waypoints = sortedProjects.slice(1, -1).map(project => ({
        location: project.location,
        stopover: true
      }));

      const result = await directionsService.route({
        origin: sortedProjects[0].location,
        destination: sortedProjects[sortedProjects.length - 1].location,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
      });

      setDirectionsResponse(result);
    } catch (error) {
      console.error('Error calculating directions:', error);
      setDirectionsResponse(null);
    }
  }, [projectsWithLocation, showDirections]);

  useEffect(() => {
    if (projectsWithLocation.length > 0) {
      calculateRoute();
    }
  }, [calculateRoute]);

  return directionsResponse;
};

// Constants
const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '500px',
  borderRadius: '8px'
};

const GOOGLE_MAPS_LIBRARIES = ['places', 'marker'];

// Memoized fallback component
const ProjectLocationsList = memo(({ projects }) => {
  const theme = useTheme();
  
  const mapsUrl = useMemo(() => mapUtils.generateMapsUrl(projects), [projects]);
  
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      minHeight: 400,
      flexDirection: 'column',
      gap: 3
    }}>
      <LocationOnOutlined sx={{ fontSize: 64, color: 'text.secondary' }} />
      <Typography variant="h6" color="text.secondary" textAlign="center">
        Map view requires Google Maps API key
      </Typography>
      {projects.length > 1 && mapsUrl && (
        <Button
          variant="contained"
          size="large"
          startIcon={<DirectionsOutlined />}
          endIcon={<OpenInNewOutlined />}
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mt: 2 }}
        >
          Open Route in Google Maps
        </Button>
      )}
    </Box>
  );
});

// Separate memoized card component
const ProjectLocationCard = memo(({ project, index, theme }) => {
  const statusColor = mapUtils.getProjectStatusColor(project.projectStatus, theme);
  
  return (
    <Grid item xs={12} md={6}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: statusColor,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {index + 1}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{project.title}</Typography>
                <Chip
                  label={project.projectStatus || 'Unknown'}
                  size="small"
                  sx={{
                    backgroundColor: statusColor,
                    color: 'white'
                  }}
                />
              </Box>
            </Stack>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Location
              </Typography>
              <Typography variant="body2">
                {project.location.address}
              </Typography>
              <Link
                href={`https://www.google.com/maps/search/?api=1&query=${project.location.lat},${project.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', mt: 0.5 }}
              >
                View on Maps <OpenInNewOutlined sx={{ fontSize: 12, ml: 0.5 }} />
              </Link>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Timeline
              </Typography>
              <Typography variant="body2">
                Start: {mapUtils.formatDate(project.startDate || project.project_settings?.startDate)}
              </Typography>
              <Typography variant="body2">
                End: {mapUtils.formatDate(project.endDate || project.project_settings?.endDate)}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
});

// Memoized legend component
const ProjectStatusLegend = memo(({ theme }) => {
  const statusItems = useMemo(() => [
    { status: 'completed', label: 'Completed', color: theme.palette.success.main },
    { status: 'ongoing', label: 'Ongoing', color: theme.palette.info.main },
    { status: 'pending', label: 'Pending', color: theme.palette.warning.main },
    { status: 'cancelled', label: 'Cancelled', color: theme.palette.error.main },
    { status: 'started', label: 'Started', color: theme.palette.primary.main }
  ], [theme]);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Project Status Legend
      </Typography>
      <Stack direction="row" spacing={3} flexWrap="wrap">
        {statusItems.map(item => (
          <Box key={item.status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                backgroundColor: item.color 
              }} 
            />
            <Typography variant="body2">{item.label}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
});

// Memoized project details component
const ProjectDetailsCard = memo(({ project, theme }) => {
  if (!project) return null;
  
  const statusColor = mapUtils.getProjectStatusColor(project.projectStatus, theme);
  
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {project.title}
            </Typography>
            <Chip 
              label={project.projectStatus || 'Unknown'} 
              size="small"
              sx={{ 
                backgroundColor: statusColor,
                color: 'white',
                mb: 1
              }}
            />
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Location
            </Typography>
            <Typography variant="body2">
              {project.location.address}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Timeline
            </Typography>
            <Typography variant="body2">
              Start: {mapUtils.formatDate(project.startDate || project.project_settings?.startDate)}
            </Typography>
            <Typography variant="body2">
              End: {mapUtils.formatDate(project.endDate || project.project_settings?.endDate)}
            </Typography>
          </Box>

          {project.organizationInfo?.organizationName && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Organization
              </Typography>
              <Typography variant="body2">
                {project.organizationInfo.organizationName}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
});

// Custom hook for managing advanced markers
const useCustomMarkers = (map, projectsWithLocation, onMarkerClick, theme) => {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (!map || !projectsWithLocation.length || !window.google?.maps?.marker) return;

    // Clear existing markers
    markers.forEach(marker => {
      if (marker.map) marker.map = null;
    });

    const newMarkers = [];

    projectsWithLocation.forEach((project) => {
      const statusColor = mapUtils.getProjectStatusColor(project.projectStatus, theme);
      
      // Create HTML element for the marker
      const markerElement = document.createElement('div');
      markerElement.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${statusColor};
          border: 3px solid white;
          border-radius: 50%;
          color: white;
          font-weight: bold;
          font-size: 11px;
          font-family: Arial, sans-serif;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        ">
          ${project.id}
        </div>
      `;

      // Add hover effect
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.1)';
      });
      
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });
      
      // Create AdvancedMarkerElement
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: project.location,
        title: project.title,
        content: markerElement
      });
      
      // Add click event listener
      marker.addListener('click', () => onMarkerClick(project));
      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Cleanup function
    return () => {
      newMarkers.forEach(marker => {
        if (marker.map) marker.map = null;
      });
    };
  }, [map, projectsWithLocation, onMarkerClick, theme]);

  return markers;
};

// Simplified markers component
const MapMarkers = memo(({ map, projectsWithLocation, onMarkerClick, theme }) => {
  useCustomMarkers(map, projectsWithLocation, onMarkerClick, theme);
  return null; // Markers are handled directly by the hook
});

const ProjectsMap = ({ projects = [], height = 500, showDirections = false, googleMapsApiKey }) => {
  const theme = useTheme();
  const [map, setMap] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Custom hooks for better separation of concerns
  const { geocodedProjects, isGeocoding } = useGeocodedProjects(projects, map);
  const projectsWithLocation = useProjectsWithLocation(projects, geocodedProjects);
  const mapCenter = useMapBounds(projectsWithLocation, map);
  const directionsResponse = useDirections(projectsWithLocation, showDirections);

  // Track map load for usage tracking (fire-and-forget)
  const trackMapLoad = useCallback(() => {
    fetch('/api/maps/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 'timeline' })
    }).catch(err => console.warn('[ProjectsMap] Failed to track map load:', err));
  }, []);

  // Memoized callbacks
  const onMapLoad = useCallback((map) => {
    setMap(map);
    trackMapLoad();
  }, [trackMapLoad]);

  const onMarkerClick = useCallback((project) => {
    setSelectedProject(project);
  }, []);
  
  // Memoized location data validation
  const hasLocationData = useMemo(() => {
    return projects.some(project => {
      const location = mapUtils.parseLocationData(project.location);
      return location?.place_id || (location?.lat && location?.lng);
    });
  }, [projects]);

  // Early returns for better performance
  if (!googleMapsApiKey) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Google Maps API Key Required
          </Typography>
          <Typography>
            Google Maps API key is required to display the interactive map.
            Please ensure GOOGLE_MAPS_API_KEY is set in your environment variables.
          </Typography>
        </Alert>
        <ProjectLocationsList projects={projectsWithLocation} />
      </Paper>
    );
  }

  if (!hasLocationData) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <LocationOnOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Project Locations Available
        </Typography>
        <Typography color="text.secondary">
          Add location data to your projects to see them on the map.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>
      {/* Legend at the top */}
      <ProjectStatusLegend theme={theme} />

      <Box sx={{ display: 'flex', gap: 2, height: height - 100 }}>
        {/* Map Container - Full width */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Paper sx={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0, width: '100%' }}>
            <LoadScriptNext
              googleMapsApiKey={googleMapsApiKey}
              libraries={GOOGLE_MAPS_LIBRARIES}
              loadingElement={
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              }
            >
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={4}
                onLoad={onMapLoad}
                options={{
                  mapId: 'project-timeline-map',
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                }}
              >
                {map && (
                  <MapMarkers
                    map={map}
                    projectsWithLocation={projectsWithLocation}
                    onMarkerClick={onMarkerClick}
                    theme={theme}
                  />
                )}

                {/* Directions */}
                {showDirections && directionsResponse && (
                  <DirectionsRenderer
                    directions={directionsResponse}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: theme.palette.primary.main,
                        strokeWeight: 4,
                        strokeOpacity: 0.8,
                      }
                    }}
                  />
                )}
              </GoogleMap>
            </LoadScriptNext>
            
            {/* Loading Overlay */}
            {isGeocoding && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}
              >
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Stack spacing={2} alignItems="center">
                    <CircularProgress size={32} />
                    <Typography variant="body2">
                      Loading project locations...
                    </Typography>
                  </Stack>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>

      </Box>
    </Box>
  );
};

export default ProjectsMap;