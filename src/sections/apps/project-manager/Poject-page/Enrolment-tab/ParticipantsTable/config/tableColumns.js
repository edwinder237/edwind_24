import { useMemo } from 'react';
import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LinearWithLabel from 'components/@extended/progress/LinearWithLabel';
import ToolAccessCell from '../components/ToolAccessCell';
import RoleDropdownCell from '../components/RoleDropdownCell';
import GroupDropdownCell from '../components/GroupDropdownCell';
import { IndeterminateCheckbox } from 'components/third-party/ReactTable';
import {
  roundedMedian,
  filterGreaterThan,
  SelectColumnFilter,
  SliderColumnFilter,
} from 'utils/react-table';


// Selection Header Component
const SelectionHeader = ({ getToggleAllPageRowsSelectedProps }) => (
  <IndeterminateCheckbox
    indeterminate
    {...getToggleAllPageRowsSelectedProps()}
  />
);

// Selection Cell Component
const SelectionCell = ({ row }) => (
  <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
);

/**
 * Hook to generate table column configuration
 */
export const useTableColumns = (onRefresh) => {
  const theme = useTheme();

  return useMemo(() => {
    // Memoized cell components to prevent re-renders
    const memoizedSelectionHeader = (props) => <SelectionHeader {...props} />;
    const memoizedSelectionCell = (props) => <SelectionCell {...props} />;
    
    return [
    {
      title: "Row Selection",
      id: "selection",
      Header: memoizedSelectionHeader,
      Footer: "#",
      accessor: "selection",
      groupByBoundary: true,
      Cell: memoizedSelectionCell,
      disableSortBy: true,
      disableFilters: true,
      disableGroupBy: true,
      Aggregated: () => null,
    },
    {
      Header: "id",
      Footer: "id",
      accessor: "id",
      className: "cell-center",
      disableFilters: true,
      disableGroupBy: true,
    },
    {
      Header: "First Name",
      Footer: "First Name",
      accessor: "participant.firstName",
      dataType: "text",
      disableGroupBy: true,
      disableFilters: true,
      aggregate: "count",
      Aggregated: ({ value }) => `${value} Person`,
    },
    {
      Header: "Last Name",
      Footer: "Last Name",
      accessor: "participant.lastName",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ row, value }) => value,
    },
    {
      Header: "Role",
      Footer: "Role",
      dataType: "text",
      accessor: "participant.role.title",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ value, row }) => {
        // Role data is included in participant object, show it immediately
        const roleObject = row.original.participant?.role;
        
        return (
          <RoleDropdownCell 
            value={roleObject} 
            row={row} 
            onUpdate={onRefresh}
          />
        );
      },
    },
    {
      Header: "Email",
      Footer: "Email",
      accessor: "participant.email",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ row, value }) => value,
    },
    {
      Header: "Company",
      Footer: "Company",
      accessor: "participant.parentGroup",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ value }) => {
        // Handle parentGroup value - ensure it's rendered as string
        if (typeof value === 'object' && value !== null) {
          return value.name || value.title || value.groupName || value.company || 'Unknown Company';
        }
        return value || 'N/A';
      },
    },
    {
      Header: "Group",
      Footer: "Group",
      accessor: (row) => {
        try {
          // Return the first group object or null
          return row?.group?.[0] || null;
        } catch (error) {
          return null;
        }
      },
      id: "groupName",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ row, value }) => {
        return (
          <GroupDropdownCell 
            value={value} 
            row={row} 
            onUpdate={onRefresh}
          />
        );
      },
    },
    {
      Header: "Notes",
      Footer: "Notes",
      dataType: "text",
      accessor: "participant.notes",
      disableGroupBy: true,
      disableFilters: true,
      Cell: ({ value }) => {
        // Handle notes value - ensure it's rendered as string
        if (typeof value === 'object' && value !== null) {
          return value.text || value.content || value.note || JSON.stringify(value);
        }
        return value || '';
      },
    },
    {
      Header: "Tool Access",
      Footer: "Tool Access",
      accessor: "participant.toolAccesses",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      show: false,
      Cell: ({ value, row }) => {
        return (
          <ToolAccessCell 
            value={value} 
            row={row} 
            onRefresh={onRefresh}
          />
        );
      },
    },
  ];
  }, [onRefresh, theme]);
};