import React, { useEffect, useRef, useState } from 'react';
import {
  TextField,
  InputAdornment
} from '@mui/material';
import { EnvironmentOutlined } from '@ant-design/icons';

// Function to load Google Maps script
function loadScript(src, position, id) {
  if (!position) {
    return;
  }

  const script = document.createElement('script');
  script.setAttribute('async', '');
  script.setAttribute('id', id);
  script.src = src;
  position.appendChild(script);
}

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
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Initialize input value from props
  useEffect(() => {
    if (value && typeof value === 'object' && value.description) {
      setInputValue(value.description);
    } else if (typeof value === 'string') {
      setInputValue(value);
    } else {
      setInputValue('');
    }
  }, [value]);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && !loaded) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key is not configured');
        return;
      }
      
      if (!document.querySelector('#google-maps')) {
        loadScript(
          `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`,
          document.querySelector('head'),
          'google-maps'
        );
        
        // Set up callback
        window.initGoogleMaps = () => {
          setLoaded(true);
        };
      } else if (window.google && window.google.maps && window.google.maps.places) {
        setLoaded(true);
      }
    }
  }, [loaded]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (loaded && inputRef.current && !autocompleteRef.current) {
      // Get the actual input element (Material-UI wraps it)
      const inputElement = inputRef.current.querySelector('input') || inputRef.current;
      
      const options = {
        fields: [
          'place_id',
          'formatted_address', 
          'name',
          'geometry',
          'address_components',
          'types',
          'photos'
        ],
        componentRestrictions: { country: ['us', 'ca'] }, // Restrict to US and Canada
        types: ['establishment', 'geocode']
      };

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputElement,
        options
      );

      // Add place changed listener
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (!place || !place.place_id) {
          console.warn('No place selected');
          return;
        }

        // Create location data object
        const locationData = {
          place_id: place.place_id,
          formatted_address: place.formatted_address,
          name: place.name,
          description: place.formatted_address,
          geometry: place.geometry ? {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          } : null,
          types: place.types || [],
          photos: place.photos ? place.photos.map(photo => ({
            url: photo.getUrl({ maxWidth: 800, maxHeight: 600 }),
            htmlAttributions: photo.html_attributions
          })) : [],
          imageUrl: place.photos && place.photos.length > 0 
            ? place.photos[0].getUrl({ maxWidth: 1200, maxHeight: 800 })
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

        // Create a compatible object for the autocomplete value
        const autocompleteValue = {
          description: place.formatted_address,
          place_id: place.place_id,
          structured_formatting: {
            main_text: place.name || '',
            secondary_text: place.formatted_address || ''
          }
        };

        // Update input value
        setInputValue(place.formatted_address);

        // Call callbacks
        if (onChange) {
          onChange(autocompleteValue);
        }
        if (onLocationChange) {
          onLocationChange(locationData);
        }
      });
    }
  }, [loaded, onChange, onLocationChange]);

  // Handle input changes
  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    
    // If user clears the input, reset the selection
    if (!newValue && onChange) {
      onChange(null);
      if (onLocationChange) {
        onLocationChange(null);
      }
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // If the input doesn't match a selected place, reset it
    if (value && typeof value === 'object' && value.description) {
      if (inputValue !== value.description) {
        setInputValue(value.description);
      }
    }
  };

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      placeholder={placeholder}
      required={required}
      error={error}
      helperText={helperText}
      variant={variant}
      size={size}
      disabled={disabled}
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleInputBlur}
      InputProps={{
        ref: inputRef,
        startAdornment: (
          <InputAdornment position="start">
            <EnvironmentOutlined style={{ fontSize: '20px', color: '#666' }} />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default LocationAutocomplete;