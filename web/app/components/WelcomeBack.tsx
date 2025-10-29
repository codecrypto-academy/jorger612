'use client';

interface WelcomeBackProps {
  onGoToDashboard: () => void;
  userInfo: any;
}

export default function WelcomeBack({ onGoToDashboard, userInfo }: WelcomeBackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full">
        {/* Shield Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-green-100 rounded-full p-6 border-2 border-green-200">
            <svg
              className="w-16 h-16 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        {/* Welcome Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
          Welcome Back!
        </h1>

        {/* Role Message */}
        <p className="text-gray-800 mb-8 text-center leading-relaxed">
          You are logged in as a {userInfo?.role || 'User'}
        </p>

        {/* Status Badge */}
        <div className="mb-8 flex justify-center">
          {(() => {
            const status = Number(userInfo?.status);
            const statusConfig = {
              0: { text: 'Pending', color: 'bg-orange-100 text-orange-800', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              1: { text: 'Approved', color: 'bg-green-100 text-green-800', icon: 'M5 13l4 4L19 7' },
              2: { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: 'M6 18L18 6M6 6l12 12' },
              3: { text: 'Canceled', color: 'bg-gray-100 text-gray-800', icon: 'M6 18L18 6M6 6l12 12' }
            };
            
            const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0];
            
            return (
              <div className={`${config.color} px-4 py-2 rounded-full font-medium flex items-center gap-2`}>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={config.icon}
                  />
                </svg>
                {config.text} {userInfo?.role || 'User'}
              </div>
            );
          })()}
        </div>

        {/* Go to Dashboard Button */}
        <button
          onClick={onGoToDashboard}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-xl transition-colors duration-200"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
