// material-ui
import { Autocomplete, Checkbox, TextField } from '@mui/material';

const data = [
  { label: 'CRM360' },
  { label: 'DESKING60'},
  { label: 'CAMPAIGN360' }
]

// ==============================|| AUTOCOMPLETE - CHECKBOXES ||============================== //

export default function TagsPicker({handleTagsChange}) {

  return (
 
      <Autocomplete
        multiple
        id="checkboxes-tags-demo"
        options={data}
        disableCloseOnSelect
        getOptionLabel={(option) => option.label}
        onChange={(e,value)=>handleTagsChange(value)}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox id='tags' style={{ marginRight: 8 }} checked={selected} />
            {option.label}
          </li>
        )}
        renderInput={(params) => <TextField {...params} placeholder="Select tags" />}
        sx={{
          '& .MuiOutlinedInput-root': {
            p: 1
          },
          '& .MuiAutocomplete-tag': {
            bgcolor: 'primary.lighter',
            border: '1px solid',
            borderColor: 'primary.light',
            '& .MuiSvgIcon-root': {
              color: 'primary.main',
              '&:hover': {
                color: 'primary.dark'
              }
            }
          }
        }}
      />
  );
}
