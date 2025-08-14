import { useMemo } from 'react';
import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Avatar from 'components/@extended/Avatar';
import LinearWithLabel from 'components/@extended/progress/LinearWithLabel';
import ToolAccessCell from '../components/ToolAccessCell';
import { IndeterminateCheckbox } from 'components/third-party/ReactTable';
import {
  roundedMedian,
  filterGreaterThan,
  SelectColumnFilter,
  SliderColumnFilter,
} from 'utils/react-table';

// Avatar Cell Component
const CellAvatar = ({ value }) => (
  <Avatar
    alt="Avatar 1"
    size="sm"
    src={`/assets/images/users/avatar-${!value ? 1 : value}.png`}
  />
);

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

  return useMemo(() => [
    {
      title: "Row Selection",
      id: "selection",
      Header: SelectionHeader,
      Footer: "#",
      accessor: "selection",
      groupByBoundary: true,
      Cell: SelectionCell,
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
      Header: "Avatar",
      Footer: "Avatar",
      accessor: "avatar",
      className: "cell-center",
      disableSortBy: true,
      disableFilters: true,
      disableGroupBy: true,
      Cell: CellAvatar,
    },
    {
      Header: "First Name",
      Footer: "First Name",
      accessor: "participant.firstName",
      dataType: "text",
      disableGroupBy: true,
      aggregate: "count",
      Aggregated: ({ value }) => `${value} Person`,
    },
    {
      Header: "Last Name",
      Footer: "Last Name",
      accessor: "participant.lastName",
      dataType: "text",
      filter: "fuzzyText",
      disableGroupBy: true,
      Cell: ({ row, value }) => value,
    },
    {
      Header: "role",
      Footer: "role",
      dataType: "text",
      accessor: "participant.role",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ value }) => {
        // Handle case where role is an object or string
        if (typeof value === 'object' && value !== null) {
          return value.title || value.name || 'Unknown Role';
        }
        return value || 'N/A';
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
          const groupName = row?.group?.[0]?.group?.groupName;
          return groupName || '';
        } catch (error) {
          return '';
        }
      },
      id: "groupName",
      dataType: "text",
      disableFilters: true,
      disableGroupBy: true,
      Cell: ({ row, value }) => {
        const groupName = value || '';
        const groups = row?.original?.group || [];
        
        if (!groupName) {
          return (
            <Chip
              color="error"
              label="Individual"
              size="small"
              variant="filled"
            />
          );
        }
        
        const matchingGroup = groups.find(g => g?.group?.groupName === groupName);
        const chipColor = matchingGroup?.group?.chipColor || "#1976d2";
        
        return (
          <Chip
            style={{ backgroundColor: chipColor, color: "#fff" }}
            label={groupName}
            size="small"
            variant="filled"
          />
        );
      },
    },
    {
      Header: "Notes",
      Footer: "Notes",
      dataType: "text",
      accessor: "participant.note",
      disableGroupBy: true,
      Cell: ({ value }) => {
        // Handle notes value - ensure it's rendered as string
        if (typeof value === 'object' && value !== null) {
          return value.text || value.content || value.note || JSON.stringify(value);
        }
        return value || '';
      },
    },
  ], [onRefresh, theme]);
};