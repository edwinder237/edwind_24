import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  Autocomplete,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { EnvironmentOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';

/**
 * LocationAutocomplete component using server-side proxy for usage tracking
 *
 * This component uses our API proxy endpoints:
 * - /api/maps/autocomplete - for searching locations
 * - /api/maps/place-details - for getting full place details
 *
 * This allows us to track Google Maps API usage per organization/user.
 */
const LocationAutocomplete = ({
  value,
  onChange,
  onLocationChange,
  label = "Location",
  placeholder = "Search for a location",
  required = false,
  error = false,
  helperText = "",
  disabled = false,
  fullWidth = true,
  variant = "outlined",
  size = "medium"
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState('');

  // Generate a session token for Google's session-based billing
  useEffect(() => {
    setSessionToken(crypto.randomUUID());
  }, []);

  // Initialize input value from props
  useEffect(() => {
    if (value && typeof value === 'object' && value.description) {
      setInputValue(value.description);
    } else if (typeof value === 'string') {
      setInputValue(value);
    }
  }, [value]);

  // Debounced search function
  const searchLocations = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          input: query,
          sessionToken,
          types: 'establishment|geocode',
          components: 'country:us|country:ca'
        });

        const response = await fetch(`/api/maps/autocomplete?${params}`);
        const data = await response.json();

        if (data.status === 'OK' && data.predictions) {
          setOptions(data.predictions.map(prediction => ({
            place_id: prediction.place_id,
            description: prediction.description,
            structured_formatting: prediction.structured_formatting,
            types: prediction.types
          })));
        } else if (data.status === 'ZERO_RESULTS') {
          setOptions([]);
        } else {
          console.warn('[LocationAutocomplete] API error:', data.status);
          setOptions([]);
        }
      } catch (err) {
        console.error('[LocationAutocomplete] Search error:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [sessionToken]
  );

  // Handle input change - trigger search
  const handleInputChange = (event, newInputValue, reason) => {
    setInputValue(newInputValue);

    if (reason === 'input') {
      searchLocations(newInputValue);
    }

    // If user clears the input, reset the selection
    if (!newInputValue && onChange) {
      onChange(null);
      if (onLocationChange) {
        onLocationChange(null);
      }
    }
  };

  // Handle selection - fetch place details
  const handleChange = async (event, newValue) => {
    if (!newValue) {
      onChange?.(null);
      onLocationChange?.(null);
      return;
    }

    // Set the autocomplete value immediately
    onChange?.(newValue);

    // Fetch full place details from our proxy
    try {
      const params = new URLSearchParams({
        placeId: newValue.place_id,
        sessionToken,
        fields: 'place_id,formatted_address,name,geometry,address_components,types,photos'
      });

      const response = await fetch(`/api/maps/place-details?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const place = data.result;

        // Create location data object
        const locationData = {
          place_id: place.place_id,
          formatted_address: place.formatted_address,
          name: place.name,
          description: place.formatted_address,
          geometry: place.geometry ? {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          } : null,
          types: place.types || [],
          photos: place.photos ? place.photos.map(photo => ({
            url: photo.photo_reference ?
              `/api/maps/photo?photoReference=${photo.photo_reference}&maxWidth=800` :
              null,
            htmlAttributions: photo.html_attributions
          })).filter(p => p.url) : [],
          imageUrl: place.photos && place.photos.length > 0 && place.photos[0].photo_reference
            ? `/api/maps/photo?photoReference=${place.photos[0].photo_reference}&maxWidth=1200`
            : null
        };

        // Parse address components
        if (place.address_components) {
          const components = {};
          place.address_components.forEach(comp => {
            const types = comp.types;
            if (types.includes('street_number')) {
              components.streetNumber = comp.long_name;
            } else if (types.includes('route')) {
              components.street = comp.long_name;
            } else if (types.includes('locality')) {
              components.city = comp.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              components.state = comp.long_name;
              components.stateCode = comp.short_name;
            } else if (types.includes('country')) {
              components.country = comp.long_name;
              components.countryCode = comp.short_name;
            } else if (types.includes('postal_code')) {
              components.postalCode = comp.long_name;
            }
          });
          locationData.components = components;
        }

        onLocationChange?.(locationData);

        // Generate new session token after a place is selected (as per Google's billing)
        setSessionToken(crypto.randomUUID());
      }
    } catch (err) {
      console.error('[LocationAutocomplete] Place details error:', err);
    }
  };

  return (
    <Autocomplete
      freeSolo
      fullWidth={fullWidth}
      disabled={disabled}
      options={options}
      loading={loading}
      value={value}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.description || '';
      }}
      isOptionEqualToValue={(option, value) => option.place_id === value?.place_id}
      filterOptions={(x) => x} // Disable built-in filtering since we use API
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          variant={variant}
          size={size}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <EnvironmentOutlined style={{ fontSize: '20px', color: '#666' }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.place_id}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" fontWeight={500}>
              {option.structured_formatting?.main_text || option.description}
            </Typography>
            {option.structured_formatting?.secondary_text && (
              <Typography variant="caption" color="text.secondary">
                {option.structured_formatting.secondary_text}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      noOptionsText={inputValue.length < 3 ? "Type at least 3 characters" : "No locations found"}
    />
  );
};

export default LocationAutocomplete;
