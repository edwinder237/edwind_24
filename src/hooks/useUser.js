import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'store';
import { fetchUser, fetchUserProfile, updateUserProfile } from 'store/reducers/user';

/**
 * Custom hook to access WorkOS user data from Redux store
 * Automatically fetches user on first mount if not already loaded
 *
 * @returns {Object} - { user, isLoading, isAuthenticated, error, profileLoading, profileError, fetchProfile, updateProfile }
 */
const useUser = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isAuthenticated, error, initialized, profileLoading, profileError } = useSelector((state) => state.user);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch once if not initialized and haven't fetched before
    if (!initialized && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchUser());
    }
  }, []); // Empty dependency array - only run on mount

  // Fetch full profile with subscription/usage data
  const fetchProfile = useCallback(() => {
    return dispatch(fetchUserProfile());
  }, [dispatch]);

  // Update profile data
  const updateProfile = useCallback((profileData) => {
    return dispatch(updateUserProfile(profileData));
  }, [dispatch]);

  return {
    user,            // Full user object with all attributes
    isLoading,       // true while fetching user data or during initial load
    isAuthenticated, // true if user is authenticated
    error,           // Error message if fetch failed
    profileLoading,  // true while profile operations are in progress
    profileError,    // Error message if profile operation failed
    fetchProfile,    // Function to fetch full profile with subscription data
    updateProfile    // Function to update profile data
  };
};

export default useUser;
