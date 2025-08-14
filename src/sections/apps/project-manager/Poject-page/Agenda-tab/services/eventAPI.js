const API_BASE = '/api/projects';

class EventAPI {
  static async addEventParticipant(eventId, participantId) {
    const response = await fetch(`${API_BASE}/addEventParticipant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, participantId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add participant: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async removeEventParticipant(eventId, participantId) {
    const response = await fetch(`${API_BASE}/removeEventParticipant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, participantId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove participant: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async addEventGroup(eventId, groupId) {
    const response = await fetch(`${API_BASE}/addEventGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, groupId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add group: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async updateEvent(eventId, updates) {
    const response = await fetch('/api/calendar/db-update-event', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId, ...updates }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async createEvent(eventData) {
    const response = await fetch('/api/calendar/db-create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async deleteEvent(eventId) {
    const response = await fetch('/api/calendar/db-delete-event', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async updateAttendanceStatus(eventId, participantId, status) {
    const response = await fetch(`${API_BASE}/updateAttendanceStatus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, participantId, status }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update attendance: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async importCurriculumSchedule(projectId) {
    const response = await fetch(`${API_BASE}/import-curriculum-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to import curriculum: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export default EventAPI;