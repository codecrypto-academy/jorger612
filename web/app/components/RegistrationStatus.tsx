'use client';

import { useState } from 'react';

interface RegistrationStatusProps {
  isSuccess: boolean;
  error?: string;
  roleName?: string;
  customMessage?: string;
  onContinue: () => void;
  onRegister?: () => void;
}

export default function RegistrationStatus({ 
  isSuccess, 
  error, 
  roleName, 
  customMessage,
  onContinue,
  onRegister 
}: RegistrationStatusProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (!isClicked) {
      setIsClicked(true);
      onContinue();
    }
  };

  const handleRegisterClick = () => {
    if (onRegister) {
      onRegister();
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-yellow-100 rounded-full p-6 border-2 border-yellow-300">
              <svg
                className="w-12 h-12 text-yellow-600"
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

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Registration Status
          </h1>

          {/* Success Message */}
          <p className="text-gray-800 mb-6 text-center leading-relaxed">
            {customMessage || "Your registration is currently pending approval"}
          </p>

          {/* Status Badge */}
          <div className="mb-6 flex justify-center">
            <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-medium">
              {customMessage ? "Not Registered" : `Pending Approval - ${roleName}`}
            </div>
          </div>

          {/* Instruction */}
          <div 
            className="text-center cursor-pointer transition-all duration-200 hover:bg-gray-50 p-4 rounded-lg"
            onClick={customMessage ? handleRegisterClick : handleClick}
          >
            <p className="text-gray-900 font-medium">
              {customMessage ? "Please register to access the system." : "Please wait for admin approval to access the system."}
            </p>
            <p className="text-sm text-blue-600 mt-2 hover:text-blue-800">
              {customMessage ? "Register Here" : "Click here to continue to dashboard →"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-red-100 rounded-full p-6 border-2 border-red-300">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Registration Failed
        </h1>

        {/* Error Message */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-center leading-relaxed">
            {error || 'An unexpected error occurred during registration.'}
          </p>
        </div>

        {/* Continue Button */}
        <div 
          className="text-center cursor-pointer transition-all duration-200 hover:bg-gray-50 p-4 rounded-lg"
          onClick={onRegister ? handleRegisterClick : handleClick}
        >
          <p className="text-gray-900 font-medium">
            {onRegister ? "Please register to access the system" : "Click here to continue to dashboard"}
          </p>
          <p className="text-sm text-blue-600 mt-2 hover:text-blue-800">
            {onRegister ? "Register Here" : "You can try registering again later →"}
          </p>
        </div>
      </div>
    </div>
  );
}
