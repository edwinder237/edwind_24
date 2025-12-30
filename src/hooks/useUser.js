import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'store';
import { fetchUser } from 'store/reducers/user';

/**
 * Custom hook to access WorkOS user data from Redux store
 * Automatically fetches user on first mount if not already loaded
 *
 * @returns {Object} - { user, isLoading, isAuthenticated, error }
 */
const useUser = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isAuthenticated, error, initialized } = useSelector((state) => state.user);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch once if not initialized and haven't fetched before
    if (!initialized && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchUser());
    }
  }, []); // Empty dependency array - only run on mount

  return {
    user,           // Full WorkOS user object with all attributes
    isLoading,      // true while fetching user data or during initial load
    isAuthenticated, // true if user is authenticated
    error           // Error message if fetch failed
  };
};

export default useUser;
