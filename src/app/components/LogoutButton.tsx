'use client';

import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/app/store/slices/authSlice';

export default function LogoutButton() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call the logout API endpoint to clear the cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear the auth state in Redux
      dispatch(logout());

      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
    >
      Logout
    </button>
  );
}