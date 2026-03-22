import React from 'react';
import { useAllUsers } from '../../hooks/useAllUsers';

const UserList = () => {
  const { users, loading, error } = useAllUsers();

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">No users found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">All Users ({users.length})</h2>
      <div className="grid gap-4">
        {users.map((user) => (
          <div 
            key={user.user_id} 
            className="bg-white p-4 rounded-lg shadow border"
          >
            <div className="flex items-center gap-4">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold">
                  {user.name || user.nickname || 'No name'}
                </div>
                <div className="text-gray-600">{user.email}</div>
                <div className="text-sm text-gray-500">
                  User ID: {user.user_id}
                </div>
                <div className="text-sm text-gray-500">
                  Created: {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">
                  Logins: {user.logins_count || 0}
                </div>
              </div>
              <div className="text-right">
                <div className={`px-2 py-1 rounded text-xs ${
                  user.email_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.email_verified ? 'Verified' : 'Unverified'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList; 