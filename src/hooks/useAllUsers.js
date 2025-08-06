import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export const useAllUsers = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllUsers = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      
      // Note: This should be done server-side in production
      const response = await fetch(
        `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const userList = await response.json();
      setUsers(userList);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllUsers();
    }
  }, [isAuthenticated]);

  return {
    users,
    loading,
    error,
    refetch: fetchAllUsers
  };
}; 