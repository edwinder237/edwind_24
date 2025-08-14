import { useState } from 'react';

export const useReportsState = () => {
  // State for filters
  const [filters, setFilters] = useState({
    courses: [],
    participants: [],
    instructors: [],
    trainingRecipients: [],
    companies: [],
    projects: [],
    startDate: '',
    endDate: '',
    status: [],
    topics: []
  });

  // State for results
  const [sortBy, setSortBy] = useState('completionDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showResults, setShowResults] = useState(false);
  const [signOffDialogOpen, setSignOffDialogOpen] = useState(false);
  const [selectedSignOffData, setSelectedSignOffData] = useState(null);
  const [groupBy, setGroupBy] = useState('none');
  const [loading, setLoading] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      courses: [],
      participants: [],
      instructors: [],
      trainingRecipients: [],
      companies: [],
      projects: [],
      startDate: '',
      endDate: '',
      status: [],
      topics: []
    });
    setShowResults(false);
  };

  // Apply filters and show results
  const applyFilters = async (fetchFunction) => {
    if (fetchFunction) {
      setLoading(true);
      try {
        await fetchFunction();
        setShowResults(true);
        setFiltersExpanded(false); // Collapse filters after running report
      } catch (error) {
        console.error('Failed to apply filters:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback for when no fetch function provided
      setLoading(true);
      setTimeout(() => {
        setShowResults(true);
        setLoading(false);
        setFiltersExpanded(false);
      }, 800);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, filter) => {
      if (Array.isArray(filter)) {
        return count + filter.length;
      }
      return count + (filter ? 1 : 0);
    }, 0);
  };

  // Handle sort
  const handleSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  return {
    // State
    filters,
    sortBy,
    sortOrder,
    showResults,
    signOffDialogOpen,
    selectedSignOffData,
    groupBy,
    loading,
    filtersExpanded,
    
    // Actions
    handleFilterChange,
    clearFilters,
    applyFilters,
    getActiveFilterCount,
    handleSort,
    setSignOffDialogOpen,
    setSelectedSignOffData,
    setGroupBy,
    setFiltersExpanded
  };
};