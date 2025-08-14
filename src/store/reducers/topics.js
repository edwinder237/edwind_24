// third-party
import { createSlice } from '@reduxjs/toolkit';

// project import
import axios from 'utils/axios';
import { dispatch } from '../index';

// ==============================|| SLICE - TOPICS ||============================== //

const initialState = {
  error: null,
  topics: [],
  selectedTopic: null,
  loading: false
};

const slice = createSlice({
  name: 'topics',
  initialState,
  reducers: {
    // LOADING
    setLoading(state, action) {
      state.loading = action.payload;
    },

    // HAS ERROR
    hasError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },

    // GET TOPICS
    getTopicsSuccess(state, action) {
      state.topics = action.payload;
      state.loading = false;
      state.error = null;
    },

    // GET TOPIC
    getTopicSuccess(state, action) {
      state.selectedTopic = action.payload;
      state.loading = false;
      state.error = null;
    },

    // CREATE TOPIC
    createTopicSuccess(state, action) {
      state.topics.push(action.payload);
      state.loading = false;
      state.error = null;
    },

    // UPDATE TOPIC
    updateTopicSuccess(state, action) {
      const index = state.topics.findIndex(topic => topic.id === action.payload.id);
      if (index !== -1) {
        state.topics[index] = action.payload;
      }
      if (state.selectedTopic && state.selectedTopic.id === action.payload.id) {
        state.selectedTopic = action.payload;
      }
      state.loading = false;
      state.error = null;
    },

    // DELETE TOPIC
    deleteTopicSuccess(state, action) {
      state.topics = state.topics.filter(topic => topic.id !== action.payload);
      if (state.selectedTopic && state.selectedTopic.id === action.payload) {
        state.selectedTopic = null;
      }
      state.loading = false;
      state.error = null;
    },

    // RESET
    resetTopics(state) {
      state.topics = [];
      state.selectedTopic = null;
      state.error = null;
      state.loading = false;
    }
  }
});

// Reducer
export default slice.reducer;

// ==============================|| ACTIONS ||============================== //

// Get all topics
export function getTopics() {
  return async (dispatch) => {
    dispatch(slice.actions.setLoading(true));
    try {
      const response = await axios.get('/api/topics');
      dispatch(slice.actions.getTopicsSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error.message));
    }
  };
}

// Get single topic
export function getTopic(topicId) {
  return async (dispatch) => {
    dispatch(slice.actions.setLoading(true));
    try {
      const response = await axios.get(`/api/topics/${topicId}`);
      dispatch(slice.actions.getTopicSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error.message));
    }
  };
}

// Create topic
export function createTopic(topicData) {
  return async (dispatch) => {
    dispatch(slice.actions.setLoading(true));
    try {
      const response = await axios.post('/api/topics', topicData);
      dispatch(slice.actions.createTopicSuccess(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error.response?.data?.error || error.message));
      throw error;
    }
  };
}

// Update topic
export function updateTopic(topicId, topicData) {
  return async (dispatch) => {
    dispatch(slice.actions.setLoading(true));
    try {
      const response = await axios.put(`/api/topics/${topicId}`, topicData);
      dispatch(slice.actions.updateTopicSuccess(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error.response?.data?.error || error.message));
      throw error;
    }
  };
}

// Delete topic
export function deleteTopic(topicId) {
  return async (dispatch) => {
    dispatch(slice.actions.setLoading(true));
    try {
      await axios.delete(`/api/topics/${topicId}`);
      dispatch(slice.actions.deleteTopicSuccess(topicId));
      return true;
    } catch (error) {
      dispatch(slice.actions.hasError(error.response?.data?.error || error.message));
      throw error;
    }
  };
}

// Reset topics state
export function resetTopicsState() {
  return (dispatch) => {
    dispatch(slice.actions.resetTopics());
  };
}