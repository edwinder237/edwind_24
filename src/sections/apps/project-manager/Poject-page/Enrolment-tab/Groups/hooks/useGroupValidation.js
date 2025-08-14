import { useMemo } from 'react';
import * as Yup from 'yup';

/**
 * Custom hook for group form validation schema
 */
export const useGroupValidation = (isMultipleMode, groupsInState) => {
  return useMemo(() => 
    Yup.object().shape({
      groupName: !isMultipleMode ? Yup.string()
        .max(255)
        .test('unique-groupName', 'Group name already exists', function (value) {
          return !groupsInState.some(group => group.groupName === value);
        })
        .required("Mandatory field") : Yup.string(),
      groupNames: isMultipleMode ? Yup.array()
        .when('useSequentialNaming', {
          is: false,
          then: Yup.array()
            .of(
              Yup.string()
                .max(255)
                .test('unique-groupName', 'Group name already exists', function (value) {
                  const currentNames = this.parent || [];
                  const existingNames = groupsInState.map(group => group.groupName);
                  // Check for duplicates within the array
                  const duplicateInArray = currentNames.filter(name => name === value).length > 1;
                  // Check if already exists in the system
                  const existsInSystem = existingNames.includes(value);
                  return !duplicateInArray && !existsInSystem;
                })
                .required("Group name is required")
            )
            .min(1, "At least one group name is required"),
          otherwise: Yup.array()
        }) : Yup.array(),
      sequentialCount: isMultipleMode ? Yup.number()
        .min(1, "Count must be at least 1")
        .max(50, "Count cannot exceed 50")
        .integer("Count must be a whole number") : Yup.number(),
      sequentialPrefix: isMultipleMode ? Yup.string()
        .max(20, "Prefix cannot exceed 20 characters")
        .matches(/^[a-zA-Z0-9\s\-_]*$/, "Prefix can only contain letters, numbers, spaces, hyphens, and underscores") : Yup.string(),
    }), [isMultipleMode, groupsInState]);
};