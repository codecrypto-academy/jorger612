export interface Role {
  id: string;
  name: string;
  account: string;
  icon: string;
  description: string;
}

export const ROLES: Record<string, Role> = {
  admin: {
    id: 'Admin',
    name: 'Admin',
    account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    icon: '👑',
    description: 'System administrator with full access',
  },
  producer: {
    id: 'Producer',
    name: 'Producer',
    account: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    icon: '🌾',
    description: 'Raw material producer',
  },
  factory: {
    id: 'Factory',
    name: 'Factory',
    account: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    icon: '🏭',
    description: 'Manufacturing facility',
  },
  retailer: {
    id: 'Retailer',
    name: 'Retailer',
    account: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    icon: '🏪',
    description: 'Retail store or distributor',
  },
  consumer: {
    id: 'Consumer',
    name: 'Consumer',
    account: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    icon: '🛒',
    description: 'End consumer',
  },
};

export const ROLE_LIST = Object.values(ROLES);

export function getRoleByAccount(account: string): Role | null {
  const normalizedAccount = account.toLowerCase();
  const role = ROLE_LIST.find(
    (r) => r.account.toLowerCase() === normalizedAccount
  );
  return role || null;
}

export function getRoleById(id: string): Role | null {
  return ROLES[id] || null;
}
