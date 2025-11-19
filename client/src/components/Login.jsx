import React from 'react';
import { MessageSquare } from 'lucide-react';
import { API_URL } from '../utils/constants';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Google Reviews Manager</h1>
        <p className="text-gray-500 mb-6">Sign in to manage your business reviews and replies.</p>

        <a
          href={`${API_URL}/auth/google`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
          Sign in with Google
        </a>
      </div>
    </div>
  );
}

