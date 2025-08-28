import PropTypes from "prop-types";
import * as React from "react";

// material-ui
import { Autocomplete, Box, Grid, TextField, Typography, Alert } from "@mui/material";

// third-party
import { getGeocode } from "use-places-autocomplete";
import parse from "autosuggest-highlight/parse";
// Native throttle implementation
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// project import
import { EnvironmentOutlined } from "@ant-design/icons";

function loadScript(src, position, id) {
  if (!position) {
    return;
  }

  const script = document.createElement("script");
  script.setAttribute("async", "");
  script.setAttribute("id", id);
  script.src = src;
  position.appendChild(script);
}

const autocompleteService = { current: null };
const placesService = { current: null };

// Function to get place details including photos
const getPlaceDetails = (placeId) => {
  return new Promise((resolve, reject) => {
    if (!placesService.current || !window.google) {
      resolve({ imageUrl: null, photos: [] });
      return;
    }
    
    const request = {
      placeId: placeId,
      fields: ['photos', 'name', 'formatted_address', 'geometry']
    };
    
    placesService.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        let imageUrl = null;
        const photos = [];
        
        if (place.photos && place.photos.length > 0) {
          // Get the first photo URL with high resolution
          imageUrl = place.photos[0].getUrl({
            maxWidth: 1200,
            maxHeight: 800
          });
          
          // Get multiple photos if available
          place.photos.slice(0, 5).forEach(photo => {
            photos.push({
              url: photo.getUrl({ maxWidth: 800, maxHeight: 600 }),
              htmlAttributions: photo.html_attributions
            });
          });
        }
        
        resolve({ imageUrl, photos, place });
      } else {
        console.warn('Place details request failed:', status);
        resolve({ imageUrl: null, photos: [] });
      }
    });
  });
};

// ==============================|| GOOGLE MAP - AUTOCOMPLETE ||============================== //

const GoogleMaps = ({ formik, disabled, handleLocationChange }) => {
  const [value, setValue] = React.useState(null);
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const loaded = React.useRef(false);
  
  if (typeof window !== "undefined" && !loaded.current) {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      setError("Google Maps API key is not configured. Please add GOOGLE_MAPS_API_KEY to your environment variables.");
      loaded.current = true;
      return;
    }
    
    if (!document.querySelector("#google-maps")) {
      loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`,
        document.querySelector("head"),
        "google-maps"
      );
    }

    loaded.current = true;
  }

  const fetch = React.useMemo(
    () =>
      throttle((request, callback) => {
        if (!autocompleteService.current) {
          callback(null, null);
          return;
        }
        try {
          autocompleteService.current.getPlacePredictions(
            { ...request, types: ['establishment', 'geocode'] }, // Remove country restriction to allow global search
            (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                callback(predictions, null);
              } else {
                console.warn('Places service status:', status);
                callback(null, status);
              }
            }
          );
        } catch (error) {
          console.error('Error fetching place predictions:', error);
          callback(null, error);
        }
      }, 200),
    []
  );

  React.useEffect(() => {
    let active = true;

    if (!autocompleteService.current && window.google) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
    }
    
    // Initialize Places Service for getting place details and photos
    if (!placesService.current && window.google) {
      // Create a hidden div for the PlacesService
      const div = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(div);
    }
    
    if (!autocompleteService.current) {
      return undefined;
    }

    if (inputValue === "") {
      setOptions(value ? [value] : []);
      return undefined;
    }

    setIsLoading(true);
    fetch({ input: inputValue }, (results, error) => {
      if (active) {
        setIsLoading(false);
        if (error) {
          setError(`Failed to fetch suggestions: ${error}`);
          return;
        }
        
        let newOptions = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
        setError(null);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  // Show error alert if there's an issue
  if (error) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Autocomplete
      id="google-map-demo"
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.description
      }
      filterOptions={(x) => x}
      options={options}
      autoComplete
      fullWidth
      autoHighlight
      includeInputInList
      filterSelectedOptions
      disabled={disabled}
      value={value}
      onChange={async (event, newValue) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
        
        if (newValue) {
          try {
            // Get place details including photos
            const placeDetails = await getPlaceDetails(newValue.place_id);
            const locationWithImage = {
              ...newValue,
              imageUrl: placeDetails.imageUrl || null,
              photos: placeDetails.photos || []
            };
            
            handleLocationChange(locationWithImage);
            
            let address1 = "";
            const results = await getGeocode({ address: newValue.description });
            
            if (results && results[0]) {
              results[0].address_components.forEach((locData) => {
                if (locData.types[0] === "route") {
                  if (locData.long_name !== undefined)
                    address1 =
                      address1 !== ""
                        ? `${locData.long_name} ${address1}`
                        : locData.long_name;
                }

                if (locData.types[0] === "street_number") {
                  if (locData.long_name !== undefined)
                    address1 =
                      address1 !== ""
                        ? `${address1} ${locData.long_name}`
                        : locData.long_name;
                }

                if (
                  locData.types[0] === "locality" ||
                  locData.types[0] === "postal_town"
                ) {
                  locData.long_name !== undefined &&
                    formik.setFieldValue("city", locData.long_name);
                }

                if (locData.types[0] === "administrative_area_level_1") {
                  locData.long_name !== undefined &&
                    formik.setFieldValue("county", locData.long_name);
                }

                if (locData.types[0] === "country") {
                  formik.setFieldValue("country", locData.long_name);
                }
                if (locData.types[0] === "postal_code") {
                  locData.long_name !== undefined &&
                    formik.setFieldValue("postCode", locData.long_name);
                }
              });
              formik.setFieldValue("address1", address1);
            }
          } catch (error) {
            console.error('Error processing location:', error);
            handleLocationChange(newValue);
          }
        } else {
          handleLocationChange(null);
        }
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search your company address"
          fullWidth
          loading={isLoading}
          helperText={isLoading ? "Searching locations..." : ""}
        />
      )}
      renderOption={(props, option) => {
        const matches =
          option.structured_formatting.main_text_matched_substrings;
        const parts = parse(
          option.structured_formatting.main_text,
          matches.map((match) => [match.offset, match.offset + match.length])
        );

        return (
          <li {...props}>
            <Grid container alignItems="center">
              <Grid item>
                <Box
                  component={EnvironmentOutlined}
                  sx={{ color: "text.secondary", mr: 2 }}
                />
              </Grid>
              <Grid item xs>
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      fontWeight: part.highlight ? 700 : 400,
                    }}
                  >
                    {part.text}
                  </span>
                ))}
                <Typography variant="body2" color="text.secondary">
                  {option.structured_formatting.secondary_text}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
};

GoogleMaps.propTypes = {
  formik: PropTypes.any,
  disabled: PropTypes.bool,
};

export default GoogleMaps;
