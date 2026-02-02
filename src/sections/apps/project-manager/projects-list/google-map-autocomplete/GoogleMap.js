import PropTypes from "prop-types";
import * as React from "react";
import { Autocomplete, Box, Grid, TextField, Typography, Alert, CircularProgress } from "@mui/material";
import parse from "autosuggest-highlight/parse";
import { EnvironmentOutlined } from "@ant-design/icons";
import axios from "utils/axios";

const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

const saveImageToR2 = async (imageUrl, placeName) => {
  if (!imageUrl) return null;
  try {
    const response = await axios.post('/api/images/save-from-url', {
      imageUrl,
      prefix: 'places'
    });
    return response.data.success ? response.data.data.r2Url : imageUrl;
  } catch {
    return imageUrl;
  }
};

const GoogleMaps = React.memo(({ formik, disabled, handleLocationChange }) => {
  const [value, setValue] = React.useState(null);
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionToken, setSessionToken] = React.useState('');

  React.useEffect(() => {
    setSessionToken(crypto.randomUUID());
  }, []);

  const searchLocations = React.useMemo(
    () =>
      debounce(async (query) => {
        if (!query || query.length < 3) {
          setOptions(value ? [value] : []);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
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
            let newOptions = value ? [value] : [];
            newOptions = [...newOptions, ...data.predictions.map(prediction => ({
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: prediction.structured_formatting,
              types: prediction.types
            }))];
            setOptions(newOptions);
            setError(null);
          } else if (data.status === 'ZERO_RESULTS') {
            setOptions(value ? [value] : []);
            setError(null);
          } else if (data.status === 'OVER_QUERY_LIMIT') {
            setError('Search limit reached. Please try again in a moment.');
          } else if (data.status === 'REQUEST_DENIED') {
            setError('Location search is not available.');
          } else {
            setOptions(value ? [value] : []);
          }
        } catch {
          setError('Failed to search locations.');
        } finally {
          setIsLoading(false);
        }
      }, 300),
    [sessionToken, value]
  );

  React.useEffect(() => {
    if (inputValue) {
      searchLocations(inputValue);
    } else {
      setOptions(value ? [value] : []);
    }
  }, [inputValue, searchLocations]);

  const getPlaceDetails = async (placeId) => {
    try {
      const params = new URLSearchParams({
        placeId,
        sessionToken,
        fields: 'place_id,formatted_address,name,geometry,address_components,types,photos'
      });

      const response = await fetch(`/api/maps/place-details?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const place = data.result;
        let imageUrl = null;
        const photos = [];

        if (place.photos?.length > 0) {
          const photoRef = place.photos[0].photo_reference;
          if (photoRef) {
            imageUrl = `/api/maps/photo?photoReference=${photoRef}&maxWidth=1200`;
          }
          place.photos.slice(0, 5).forEach(photo => {
            if (photo.photo_reference) {
              photos.push({
                url: `/api/maps/photo?photoReference=${photo.photo_reference}&maxWidth=800`,
                htmlAttributions: photo.html_attributions
              });
            }
          });
        }

        return { imageUrl, photos, place, address_components: place.address_components, geometry: place.geometry };
      }
      return { imageUrl: null, photos: [], place: null };
    } catch {
      return { imageUrl: null, photos: [], place: null };
    }
  };

  if (error) {
    return <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>;
  }

  return (
    <Autocomplete
      id="google-map-demo"
      getOptionLabel={(option) => typeof option === "string" ? option : option.description}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      fullWidth
      autoHighlight
      includeInputInList
      filterSelectedOptions
      disabled={disabled}
      loading={isLoading}
      value={value}
      onChange={async (event, newValue) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);

        if (newValue) {
          const placeDetails = await getPlaceDetails(newValue.place_id);
          setSessionToken(crypto.randomUUID());

          let r2ImageUrl = null;
          if (placeDetails.imageUrl) {
            r2ImageUrl = await saveImageToR2(placeDetails.imageUrl, newValue.description);
          }

          const locationWithImage = {
            ...newValue,
            imageUrl: r2ImageUrl || placeDetails.imageUrl || null,
            originalGoogleImageUrl: placeDetails.imageUrl || null,
            photos: placeDetails.photos || [],
            geometry: placeDetails.geometry,
            address_components: placeDetails.address_components
          };

          handleLocationChange(locationWithImage);

          if (placeDetails.address_components && formik) {
            let address1 = "";
            placeDetails.address_components.forEach((locData) => {
              if (locData.types[0] === "route") {
                address1 = address1 ? `${locData.long_name} ${address1}` : locData.long_name;
              }
              if (locData.types[0] === "street_number") {
                address1 = address1 ? `${address1} ${locData.long_name}` : locData.long_name;
              }
              if (locData.types[0] === "locality" || locData.types[0] === "postal_town") {
                formik.setFieldValue("city", locData.long_name);
              }
              if (locData.types[0] === "administrative_area_level_1") {
                formik.setFieldValue("county", locData.long_name);
              }
              if (locData.types[0] === "country") {
                formik.setFieldValue("country", locData.long_name);
              }
              if (locData.types[0] === "postal_code") {
                formik.setFieldValue("postCode", locData.long_name);
              }
            });
            formik.setFieldValue("address1", address1);
          }
        } else {
          handleLocationChange(null);
        }
      }}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search your company address"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        if (!option.structured_formatting) {
          return (
            <li key={key} {...otherProps}>
              <Grid container alignItems="center">
                <Grid item><Box component={EnvironmentOutlined} sx={{ color: "text.secondary", mr: 2 }} /></Grid>
                <Grid item xs><Typography variant="body2">{option.description}</Typography></Grid>
              </Grid>
            </li>
          );
        }

        const matches = option.structured_formatting.main_text_matched_substrings || [];
        const parts = parse(option.structured_formatting.main_text, matches.map((match) => [match.offset, match.offset + match.length]));

        return (
          <li key={key} {...otherProps}>
            <Grid container alignItems="center">
              <Grid item><Box component={EnvironmentOutlined} sx={{ color: "text.secondary", mr: 2 }} /></Grid>
              <Grid item xs>
                {parts.map((part, index) => (
                  <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>{part.text}</span>
                ))}
                <Typography variant="body2" color="text.secondary">{option.structured_formatting.secondary_text}</Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
      noOptionsText={inputValue.length < 3 ? "Type at least 3 characters" : "No locations found"}
    />
  );
});

GoogleMaps.propTypes = {
  formik: PropTypes.any,
  disabled: PropTypes.bool,
  handleLocationChange: PropTypes.func.isRequired
};

GoogleMaps.displayName = 'GoogleMaps';

export default GoogleMaps;
