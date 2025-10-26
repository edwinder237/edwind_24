/**
 * Hook for accessing normalized groups data
 * 
 * This hook uses the normalized entity store instead of denormalized agenda data
 * providing better performance and a single source of truth for groups.
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'utils/axios';
import { 
  selectAllGroups,
  selectGroupsLoading,
  selectGroupsError,
  selectGroupsMetadata,
  selectFilteredGroups,
  selectGroupStatistics
} from 'store/entities/groupsSlice';
import { selectAllParticipants } from 'store/entities/participantsSlice';
import { useGetProjectAgendaQuery, useGetProjectParticipantsQuery } from 'store/api/projectApi';

export const useNormalizedGroups = (projectId) => {
  // Trigger data fetching and normalization via RTK Query
  const {
    data: agendaData,
    error: agendaError,
    isLoading: agendaLoading,
    isFetching: refreshing,
    refetch: refreshData
  } = useGetProjectAgendaQuery(projectId, {
    skip: !projectId,
    // Disable automatic refetching for manual control
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false
  });

  // Fetch participants separately to ensure normalized store is populated
  const {
    data: participantsData,
    error: participantsError,
    isLoading: participantsLoading,
    refetch: refreshParticipants
  } = useGetProjectParticipantsQuery(projectId, {
    skip: !projectId,
    refetchOnMountOrArgChange: true, // Always fetch fresh participant data
    refetchOnFocus: false,
    refetchOnReconnect: false
  });

  // Get normalized groups from entity store
  const groups = useSelector(selectAllGroups);
  const loading = useSelector(selectGroupsLoading) || agendaLoading || participantsLoading;
  const error = useSelector(selectGroupsError) || agendaError || participantsError;
  const metadata = useSelector(selectGroupsMetadata);
  const statistics = useSelector(selectGroupStatistics);

  // Get participants for group assignments (from normalized store)
  const participants = useSelector(selectAllParticipants);

  // Get project info from agenda (still denormalized for now)
  const projectInfo = agendaData?.projectInfo || null;
  
  // Filter groups by current project
  const projectGroups = useMemo(() => {
    // If we have metadata with projectId, filter groups
    if (metadata?.projectId === projectId) {
      return groups;
    }
    
    // Otherwise, get groups from agenda data for backward compatibility
    // This ensures the component works during migration
    return agendaData?.groups || [];
  }, [groups, metadata?.projectId, projectId, agendaData?.groups]);
  
  // Computed metrics
  const metrics = useMemo(() => ({
    totalGroups: projectGroups.length,
    activeGroups: projectGroups.filter(g => 
      g.participants && g.participants.length > 0
    ).length,
    emptyGroups: projectGroups.filter(g => 
      !g.participants || g.participants.length === 0
    ).length,
    totalParticipantsInGroups: projectGroups.reduce((acc, g) => 
      acc + (g.participants?.length || 0), 0
    ),
    averageGroupSize: projectGroups.length > 0 
      ? Math.round(projectGroups.reduce((acc, g) => 
          acc + (g.participants?.length || 0), 0
        ) / projectGroups.length * 10) / 10
      : 0,
    groupsWithCurriculum: projectGroups.filter(g => 
      g.group_curriculums && g.group_curriculums.length > 0
    ).length,
    bySize: projectGroups.reduce((acc, g) => {
      const size = g.participants?.length || 0;
      if (size === 0) acc.empty = (acc.empty || 0) + 1;
      else if (size <= 5) acc.small = (acc.small || 0) + 1;
      else if (size <= 15) acc.medium = (acc.medium || 0) + 1;
      else acc.large = (acc.large || 0) + 1;
      return acc;
    }, {})
  }), [projectGroups]);
  
  // Computed states
  const hasData = projectGroups.length > 0;
  const isEmpty = !loading && projectGroups.length === 0;
  
  // Force refresh implementation
  const forceRefresh = useCallback(async () => {
    try {
      console.log('[useNormalizedGroups] Refreshing groups and participants...');
      await Promise.all([
        refreshData(),
        refreshParticipants()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [refreshData, refreshParticipants]);
  
  return {
    // Normalized data
    groups: projectGroups,
    participants,
    projectInfo,
    
    // State
    loading,
    refreshing,
    error,
    hasData,
    isEmpty,
    
    // Metrics
    metrics,
    statistics,
    metadata,
    
    // Actions
    refreshData,
    forceRefresh,
    
    // Selectors for advanced use cases
    selectors: {
      selectAllGroups,
      selectFilteredGroups,
      selectGroupStatistics
    }
  };
};

/**
 * Hook for accessing a single group from normalized store
 */
export const useNormalizedGroup = (groupId) => {
  const group = useSelector(state => 
    state.groups?.entities?.[groupId]
  );
  
  return group;
};

/**
 * Hook for accessing groups by curriculum from normalized store
 */
export const useGroupsByCurriculum = (curriculumId) => {
  const allGroups = useSelector(selectAllGroups);
  
  const groups = useMemo(() => {
    if (!curriculumId) return [];
    
    return allGroups.filter(group => 
      group.group_curriculums?.some(gc => gc.curriculumId === curriculumId)
    );
  }, [allGroups, curriculumId]);
  
  return {
    groups,
    count: groups.length
  };
};

/**
 * Hook for group progress calculation
 */
export const useGroupProgress = (groupId, projectId) => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const calculateProgress = useCallback(async () => {
    if (!groupId || !projectId) return;
    
    setLoading(true);
    try {
      const response = await axios.post('/api/groups/calculate-progress', {
        groupId,
        projectId
      });
      
      if (response.data) {
        setProgressData({
          groupProgress: response.data.groupProgress,
          participantProgress: response.data.participantProgress
        });
      }
    } catch (error) {
      console.error('Error calculating group progress:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, projectId]);
  
  return {
    progressData,
    loading,
    calculateProgress
  };
};