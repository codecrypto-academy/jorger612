'use client';

import { useState, useEffect } from 'react';
import { contractService } from '../lib/contract';

interface User {
  id: number;
  userAddress: string;
  role: string;
  status: number;
}

interface UserManagementProps {
  onBackToDashboard?: () => void;
}

const STATUS_MAP = {
  0: { label: 'Pending', color: 'bg-yellow-500' },
  1: { label: 'Approved', color: 'bg-green-500' },
  2: { label: 'Rejected', color: 'bg-red-500' },
  3: { label: 'Canceled', color: 'bg-gray-800' }
};

const ROLE_MAP = {
  'Admin': 'bg-blue-500',
  'Producer': 'bg-blue-500',
  'Factory': 'bg-blue-500',
  'Retailer': 'bg-blue-500',
  'Consumer': 'bg-blue-500'
};

// Lista de direcciones de usuarios registrados
const REGISTERED_USERS = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Admin
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Producer
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Factory
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Retailer
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'  // Consumer
];

export default function UserManagement({ onBackToDashboard }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<{ [key: number]: number | undefined }>({});
  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({});

  // Obtener información de usuarios desde blockchain
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userPromises = REGISTERED_USERS.map(async (address, index) => {
        try {
          // Verificar si es administrador
          const isAdmin = await contractService.isAdmin(address);
          if (isAdmin) {
            return null; // Excluir administradores
          }

          const userInfo = await contractService.getUserInfo(address);
          
          // Verificar que userInfo no sea null y tenga la estructura correcta
          if (!userInfo || userInfo.length < 4) {
            return null;
          }
          
          // getUserInfo retorna [id, userAddress, role, status] como array
          const [id, userAddress, roleName, status] = userInfo;
          
          return {
            id: index + 1,
            userAddress: address,
            role: roleName,
            status: Number(status)
          };
        } catch (error) {
          console.error(`Error fetching user ${address}:`, error);
          // Retornar null para usuarios no registrados
          return null;
        }
      });

      const usersData = await Promise.all(userPromises);
      // Filtrar usuarios no registrados (null values) y administradores
      const registeredUsers = usersData.filter(user => user !== null) as User[];
      setUsers(registeredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar status de usuario
  const changeUserStatus = async (userIndex: number, newStatus: number) => {
    const user = users[userIndex];
    if (!user) return;

    setUpdating(prev => ({ ...prev, [userIndex]: true }));

    try {
      await contractService.changeStatusUser(user.userAddress, newStatus);
      
      // Actualizar estado local
      setUsers(prev => prev.map((u, index) => 
        index === userIndex ? { ...u, status: newStatus } : u
      ));
      
      // Limpiar selección
      setSelectedStatus(prev => ({ ...prev, [userIndex]: undefined }));
    } catch (error) {
      console.error('Error changing user status:', error);
      alert('Error changing user status. Please try again.');
    } finally {
      setUpdating(prev => ({ ...prev, [userIndex]: false }));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Calcular estadísticas
  const stats = users.reduce((acc, user) => {
    acc.total++;
    acc[user.status] = (acc[user.status] || 0) + 1;
    return acc;
  }, { total: 0, 0: 0, 1: 0, 2: 0, 3: 0 } as { total: number; [key: number]: number });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-800">Manage user registrations and status changes</p>
          </div>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.total}</div>
            <div className="text-sm text-gray-800">Total Users</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{stats[0] || 0}</div>
            <div className="text-sm text-gray-800">Pending</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats[1] || 0}</div>
            <div className="text-sm text-gray-800">Approved</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{stats[2] || 0}</div>
            <div className="text-sm text-gray-800">Rejected</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">{stats[3] || 0}</div>
            <div className="text-sm text-gray-800">Canceled</div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">User Management</h3>
              <p className="text-sm text-gray-800">Manage user registrations and status changes</p>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {users.map((user, index) => (
              <div key={user.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {user.status === 0 ? (
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="font-bold text-gray-900">User #{user.id}</div>
                  <div className="text-sm text-gray-900 font-mono">{user.userAddress}</div>
                </div>

                {/* Status Button */}
                <div className="flex items-center gap-2">
                  <button
                    className={`px-4 py-2 rounded-lg text-white font-medium ${STATUS_MAP[user.status as keyof typeof STATUS_MAP]?.color || 'bg-gray-500'}`}
                    onClick={() => setSelectedStatus(prev => ({ ...prev, [index]: user.status }))}
                    disabled={updating[index]}
                  >
                    {updating[index] ? 'Updating...' : STATUS_MAP[user.status as keyof typeof STATUS_MAP]?.label || 'Unknown'}
                  </button>

                  {/* Status Dropdown */}
                  <select
                    value={selectedStatus[index] || user.status}
                    onChange={(e) => setSelectedStatus(prev => ({ ...prev, [index]: Number(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0} className="text-gray-900">Pending</option>
                    <option value={1} className="text-gray-900">Approved</option>
                    <option value={2} className="text-gray-900">Rejected</option>
                    <option value={3} className="text-gray-900">Canceled</option>
                  </select>

                  {/* Update Button */}
                  {selectedStatus[index] !== undefined && selectedStatus[index] !== user.status && (
                    <button
                      onClick={() => changeUserStatus(index, selectedStatus[index]!)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Update
                    </button>
                  )}
                </div>

                {/* Role Badge */}
                <div className={`px-3 py-1 rounded-lg text-white text-sm font-medium ${ROLE_MAP[user.role as keyof typeof ROLE_MAP] || 'bg-gray-500'}`}>
                  {user.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
