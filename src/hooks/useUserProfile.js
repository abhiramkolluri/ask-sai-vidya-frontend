import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export const useUserProfile = () => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      
      const response = await fetch(
        `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/users/${user.sub}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = await response.json();
      setUserProfile(profile);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  return {
    userProfile,
    loading,
    error,
    refetch: fetchUserProfile
  };
}; 