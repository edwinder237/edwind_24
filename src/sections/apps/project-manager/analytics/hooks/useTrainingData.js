import { useState, useEffect, useCallback } from 'react';
import axios from 'utils/axios';

export const useTrainingData = (projectId) => {
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    courses: [],
    participants: [],
    instructors: [],
    trainingRecipients: [],
    topics: [],
    statusOptions: [],
    companies: [],
    assessments: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch filter options - organization scoping is handled by the API middleware
  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (projectId) {
        params.projectId = projectId;
      }

      const response = await axios.get('/api/training-records/filter-options', { params });

      if (response.data.success) {
        setFilterOptions(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch filter options');
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
      setError(err.message || 'Failed to fetch filter options');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch training records with filters - organization scoping is handled by the API middleware
  const fetchTrainingRecords = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {};

      if (projectId) {
        params.projectId = projectId;
      }

      // Add filters to params
      if (filters.courses?.length > 0) {
        params.courses = filters.courses;
      }
      if (filters.participants?.length > 0) {
        params.participants = filters.participants;
      }
      if (filters.instructors?.length > 0) {
        params.instructors = filters.instructors;
      }
      if (filters.companies?.length > 0) {
        params.companies = filters.companies;
      }
      if (filters.trainingRecipients?.length > 0) {
        params.trainingRecipients = filters.trainingRecipients;
      }
      if (filters.status?.length > 0) {
        params.status = filters.status;
      }
      if (filters.topics?.length > 0) {
        params.topics = filters.topics;
      }
      if (filters.projects?.length > 0) {
        params.projects = filters.projects;
      }
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }
      if (filters.assessments?.length > 0) {
        params.assessments = filters.assessments;
      }

      const response = await axios.get('/api/training-records', { params });

      if (response.data.success) {
        setTrainingRecords(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch training records');
      }
    } catch (err) {
      console.error('Error fetching training records:', err);
      setError(err.message || 'Failed to fetch training records');
      setTrainingRecords([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initialize filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  return {
    trainingRecords,
    filterOptions,
    loading,
    error,
    fetchTrainingRecords,
    refetchFilterOptions: fetchFilterOptions
  };
};
