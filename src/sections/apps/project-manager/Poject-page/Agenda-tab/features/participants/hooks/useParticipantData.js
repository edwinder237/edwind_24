import { useMemo } from 'react';

/**
 * Custom hook for participant data processing and calculations
 * Handles participant filtering, deduplication, and statistics
 */
export const useParticipantData = (eventParticipants, participantStatuses, course) => {
  
  // Remove duplicate participants and always sort by name
  const uniqueParticipants = useMemo(() => {
    const deduped = eventParticipants.filter((participant, index, self) => {
      const identifier = participant.enrolleeId || participant.participant?.id || participant.participant?.email || participant.id || participant.email;
      return index === self.findIndex(p => {
        const pIdentifier = p.enrolleeId || p.participant?.id || p.participant?.email || p.id || p.email;
        return pIdentifier === identifier;
      });
    });

    // Always sort by name alphabetically
    return deduped.sort((a, b) => {
      const aName = `${a.participant?.firstName || ''} ${a.participant?.lastName || ''}`.trim().toLowerCase();
      const bName = `${b.participant?.firstName || ''} ${b.participant?.lastName || ''}`.trim().toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [eventParticipants]);

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    const statuses = Object.values(participantStatuses);
    return {
      scheduled: statuses.filter(status => status === 'scheduled').length,
      present: statuses.filter(status => status === 'present').length,
      absent: statuses.filter(status => status === 'absent').length,
      late: statuses.filter(status => status === 'late').length,
      total: uniqueParticipants.length
    };
  }, [participantStatuses, uniqueParticipants.length]);

  // Calculate capacity information
  const capacityInfo = useMemo(() => {
    const maxParticipants = course?.maxParticipants;
    const hasMaxLimit = maxParticipants && maxParticipants > 0;
    const isAtMaxCapacity = hasMaxLimit && attendanceStats.total >= maxParticipants;
    const missingCount = attendanceStats.scheduled - attendanceStats.present;
    
    return { 
      maxParticipants, 
      hasMaxLimit, 
      isAtMaxCapacity, 
      missingCount 
    };
  }, [course?.maxParticipants, attendanceStats.total, attendanceStats.scheduled, attendanceStats.present]);

  // Filter available participants for adding to event
  const getAvailableParticipants = useMemo(() => {
    return (projectParticipants, currentEventParticipants, searchTerm = '') => {
      return projectParticipants.filter(pp => {
        // Exclude participants already in the event
        const isInEvent = currentEventParticipants.some(ep => ep.enrolleeId === pp.id);
        if (isInEvent) return false;
        
        // Filter by search term if provided
        if (searchTerm.trim()) {
          const participant = pp.participant;
          if (!participant) return false;
          
          const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.toLowerCase();
          const role = participant.role?.title?.toLowerCase() || '';
          const email = participant.email?.toLowerCase() || '';
          const searchLower = searchTerm.toLowerCase();
          
          return fullName.includes(searchLower) || 
                 role.includes(searchLower) || 
                 email.includes(searchLower);
        }
        
        return true;
      });
    };
  }, []);

  // Filter suggested participants based on course role requirements
  const getSuggestedParticipants = useMemo(() => {
    return (projectParticipants, currentEventParticipants, courseRoleIds, searchTerm = '') => {
      return projectParticipants.filter(pp => {
        // Check if participant is already in the event
        const isInEvent = currentEventParticipants.some(ep => ep.enrolleeId === pp.id);
        if (isInEvent) return false;
        
        // Check if participant's role matches course requirements
        const participantRoleId = pp.participant?.role?.id;
        const matchesRole = participantRoleId && courseRoleIds.includes(participantRoleId);
        if (!matchesRole) return false;
        
        // Filter by search term if provided
        if (searchTerm.trim()) {
          const participant = pp.participant;
          if (!participant) return false;
          
          const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.toLowerCase();
          const role = participant.role?.title?.toLowerCase() || '';
          const email = participant.email?.toLowerCase() || '';
          const searchLower = searchTerm.toLowerCase();
          
          return fullName.includes(searchLower) || 
                 role.includes(searchLower) || 
                 email.includes(searchLower);
        }
        
        return true;
      });
    };
  }, []);

  // Filter available groups for adding to event
  // Check both eg.groupId and eg.groups?.id to handle different data structures
  const getAvailableGroups = useMemo(() => {
    return (projectGroups, eventGroups) => {
      return projectGroups.filter(group =>
        !eventGroups.some(eg => eg.groupId === group.id || eg.groups?.id === group.id)
      );
    };
  }, []);

  return {
    uniqueParticipants,
    attendanceStats,
    capacityInfo,
    getAvailableParticipants,
    getSuggestedParticipants,
    getAvailableGroups
  };
};