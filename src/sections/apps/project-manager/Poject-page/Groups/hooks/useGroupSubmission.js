import { useCallback } from 'react';
import { useDispatch } from 'store';
import { useTheme } from '@mui/material/styles';
import { openSnackbar } from 'store/reducers/snackbar';
import { processGroupNames, createGroupsFromNames } from '../utils/groupNameUtils';

/**
 * Custom hook for handling group form submission
 */
export const useGroupSubmission = (
  customer,
  isMultipleMode,
  groupsInState,
  handleAddParticipant,
  onCancel
) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const formContext = "Group";

  const handleSubmit = useCallback(async (values, { setSubmitting }) => {
    try {
      console.log('Form submission started:', values);
      setSubmitting(true);
      
      if (isMultipleMode) {
        // Handle multiple groups creation
        const groupNamesToCreate = processGroupNames(values, groupsInState);
        console.log('Group names to create:', groupNamesToCreate);
        
        const newGroups = createGroupsFromNames(
          groupNamesToCreate, 
          values.bulkChipColor || theme.palette.primary.main
        );
        
        console.log('Groups to be created:', newGroups);
        
        // Add groups sequentially to prevent database race conditions
        for (let i = 0; i < newGroups.length; i++) {
          const newGroup = newGroups[i];
          console.log(`About to add group ${i + 1}:`, newGroup.groupName);
          
          try {
            await handleAddParticipant(newGroup);
            console.log(`Successfully added group ${i + 1}:`, newGroup.groupName);
          } catch (error) {
            console.error(`Failed to add group ${i + 1}:`, newGroup.groupName, error);
            // Continue with next group even if one fails
          }
        }
        console.log('All groups added');
        
        dispatch(
          openSnackbar({
            open: true,
            message: `${newGroups.length} ${formContext}${newGroups.length > 1 ? 's' : ''} added successfully.`,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: false
          })
        );
      } else {
        // Handle single group creation
        const newGroup = {
          groupName: values.groupName,
          employees: [],
          courses: [],
          chipColor: values.chipColor || theme.palette.primary.main
        };
        
        if (customer) {
          // Update existing group
          dispatch(
            openSnackbar({
              open: true,
              message: `${formContext} updated successfully.`,
              variant: 'alert',
              alert: {
                color: 'success'
              },
              close: false
            })
          );
        } else {
          // Create new group
          await handleAddParticipant(newGroup);
          dispatch(
            openSnackbar({
              open: true,
              message: `${formContext} added successfully.`,
              variant: 'alert',
              alert: {
                color: 'success'
              },
              close: false
            })
          );
        }
      }

      setSubmitting(false);
      onCancel();
    } catch (error) {
      console.error(error);
      setSubmitting(false);
      
      dispatch(
        openSnackbar({
          open: true,
          message: `Failed to ${customer ? 'update' : 'add'} ${formContext.toLowerCase()}. Please try again.`,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: false
        })
      );
    }
  }, [
    customer,
    isMultipleMode,
    groupsInState,
    handleAddParticipant,
    onCancel,
    dispatch,
    theme.palette.primary.main,
    formContext
  ]);

  return { handleSubmit };
};