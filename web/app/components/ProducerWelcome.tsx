'use client';

interface ProducerWelcomeProps {
  onGoToDashboard: () => void;
  userInfo: any;
}

export default function ProducerWelcome({ onGoToDashboard, userInfo }: ProducerWelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full">
        {/* Icon */}
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
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
          You are logged in as a {userInfo?.role || 'Producer'}
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
                {config.text} {userInfo?.role || 'Producer'}
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

