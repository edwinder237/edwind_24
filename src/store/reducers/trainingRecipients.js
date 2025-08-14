// third-party
import { createSlice } from "@reduxjs/toolkit";

// project imports
import axios from "utils/axios";
import { dispatch } from "../index";

// Utility function to extract error message
const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  // Handle network-specific errors
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Request timed out. Please check your connection and try again.';
  }
  if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNRESET') {
    return 'Network connection failed. Please check your internet connection.';
  }
  if (error?.response?.status === 500) {
    return 'Server error. Please try again in a few moments.';
  }
  if (error?.response?.status === 404) {
    return 'Requested resource not found.';
  }
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return error?.response?.data?.error || error?.response?.data?.message || 'Request failed. Please try again.';
  }
  
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || defaultMessage;
};

const dataRoutes = {
  fetchAll: "/api/training-recipients/fetchAll",
  create: "/api/training-recipients/create",
  update: "/api/training-recipients/update",
  delete: "/api/training-recipients/delete",
};

const initialState = {
  error: null,
  success: false,
  loading: false,
  submitting: false,
  trainingRecipients: [],
  response: null,
};

const slice = createSlice({
  name: "trainingRecipients",
  initialState,
  reducers: {
    // ERROR HANDLING
    hasError(state, action) {
      state.error = action.payload;
      state.loading = false;
      state.submitting = false;
    },

    // SUCCESS
    hasSuccess(state, action) {
      state.success = true;
      state.response = action.payload;
      state.error = null;
      state.submitting = false;
    },

    // LOADING STATES
    setLoading(state, action) {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setSubmitting(state, action) {
      state.submitting = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    // CLEAR ERROR
    clearError(state) {
      state.error = null;
    },

    // CLEAR SUCCESS
    clearSuccess(state) {
      state.success = false;
      state.response = null;
    },

    // GET TRAINING RECIPIENTS
    getTrainingRecipientsSuccess(state, action) {
      if (Array.isArray(action.payload)) {
        state.trainingRecipients = action.payload;
        state.error = null;
        state.loading = false;
      } else {
        state.error = 'Invalid training recipients data received';
        state.trainingRecipients = [];
        state.loading = false;
      }
    },

    // CREATE TRAINING RECIPIENT
    createTrainingRecipientSuccess(state, action) {
      if (action.payload?.trainingRecipient) {
        state.trainingRecipients.unshift(action.payload.trainingRecipient);
        state.success = true;
        state.response = action.payload;
        state.error = null;
        state.submitting = false;
      }
    },

    // UPDATE TRAINING RECIPIENT
    updateTrainingRecipientSuccess(state, action) {
      if (action.payload?.trainingRecipient) {
        const index = state.trainingRecipients.findIndex(
          recipient => recipient.id === action.payload.trainingRecipient.id
        );
        if (index !== -1) {
          state.trainingRecipients[index] = action.payload.trainingRecipient;
        }
        state.success = true;
        state.response = action.payload;
        state.error = null;
        state.submitting = false;
      }
    },

    // DELETE TRAINING RECIPIENT
    deleteTrainingRecipientSuccess(state, action) {
      const recipientId = action.payload.recipientId;
      state.trainingRecipients = state.trainingRecipients.filter(
        recipient => recipient.id !== recipientId
      );
      state.success = true;
      state.response = { message: 'Training recipient deleted successfully' };
      state.error = null;
    },
  },
});

// Reducer
export default slice.reducer;

// Actions
export const {
  hasError,
  hasSuccess,
  setLoading,
  setSubmitting,
  clearError,
  clearSuccess,
  getTrainingRecipientsSuccess,
  createTrainingRecipientSuccess,
  updateTrainingRecipientSuccess,
  deleteTrainingRecipientSuccess,
} = slice.actions;

// ----------------------------------------------------------------------

// GET ALL TRAINING RECIPIENTS
export function getTrainingRecipients() {
  return async () => {
    dispatch(setLoading(true));
    try {
      const response = await axios.get(dataRoutes.fetchAll);
      dispatch(getTrainingRecipientsSuccess(response.data));
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch training recipients');
      console.error('Error fetching training recipients:', error);
      dispatch(hasError(errorMessage));
    }
  };
}

// CREATE TRAINING RECIPIENT
export function createTrainingRecipient(recipientData) {
  return async () => {
    dispatch(setSubmitting(true));
    try {
      const response = await axios.post(dataRoutes.create, recipientData);
      dispatch(createTrainingRecipientSuccess(response.data));
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to create training recipient');
      console.error('Error creating training recipient:', error);
      dispatch(hasError(errorMessage));
      throw error;
    }
  };
}

// UPDATE TRAINING RECIPIENT
export function updateTrainingRecipient(recipientData) {
  return async () => {
    dispatch(setSubmitting(true));
    try {
      const response = await axios.put(dataRoutes.update, recipientData);
      dispatch(updateTrainingRecipientSuccess(response.data));
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to update training recipient');
      console.error('Error updating training recipient:', error);
      dispatch(hasError(errorMessage));
      throw error;
    }
  };
}

// DELETE TRAINING RECIPIENT
export function deleteTrainingRecipient(recipientId) {
  return async () => {
    try {
      const response = await axios.delete(dataRoutes.delete, {
        data: { id: recipientId }
      });
      dispatch(deleteTrainingRecipientSuccess({ recipientId, response: response.data }));
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to delete training recipient');
      console.error('Error deleting training recipient:', error);
      dispatch(hasError(errorMessage));
      throw error;
    }
  };
}