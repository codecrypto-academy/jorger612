'use client';

import { useState } from 'react';
import { ROLE_LIST, Role } from '../lib/roles';

interface RoleSelectionProps {
  onRoleSelect: (role: Role) => void;
  isLoading?: boolean;
}

export default function RoleSelection({ onRoleSelect, isLoading = false }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setIsOpen(false);
  };

  const handleSubmit = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full">
        <div className="mb-6 flex justify-center">
          <div className="bg-purple-100 rounded-full p-6">
            <svg
              className="w-12 h-12 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Register for Access
        </h1>
        <p className="text-gray-800 mb-8 text-center leading-relaxed">
          Select your role in the supply chain to request access
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Select Your Role
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex items-center justify-between"
            >
              <span className={selectedRole ? 'text-gray-900' : 'text-gray-900'}>
                {selectedRole ? (
                  <span className="flex items-center gap-2">
                    <span>{selectedRole.icon}</span>
                    <span>{selectedRole.name}</span>
                  </span>
                ) : (
                  'Choose a role...'
                )}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {ROLE_LIST.filter(role => role.id !== 'admin').map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-2xl">{role.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{role.name}</div>
                      <div className="text-xs text-gray-900">{role.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedRole && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                <span className="font-semibold">Account:</span>
                <br />
                <span className="text-xs font-mono break-all">
                  {selectedRole.account}
                </span>
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedRole || isLoading}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-4 px-6 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending to Blockchain...' : 'Request Registration'}
        </button>

        <p className="mt-4 text-xs text-gray-900 text-center">
          You will be asked to switch to the account associated with this role
        </p>
      </div>
    </div>
  );
}