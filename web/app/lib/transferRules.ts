// Transfer Rules Library
// Manages the business logic for token transfers between roles

export interface TransferRule {
  fromRole: string;
  toRole: string;
  description: string;
}

export interface RoleInfo {
  id: string;
  name: string;
  account: string;
  icon: string;
  description: string;
}

// Transfer rules configuration
export const TRANSFER_RULES: TransferRule[] = [
  {
    fromRole: 'producer',
    toRole: 'factory',
    description: 'Send raw materials to factories for processing'
  },
  {
    fromRole: 'factory',
    toRole: 'retailer',
    description: 'Send processed products to retailers for distribution'
  },
  {
    fromRole: 'retailer',
    toRole: 'consumer',
    description: 'Send products to consumers for final consumption'
  }
];

// Get the allowed destination role for a given source role
export function getAllowedDestinationRole(fromRole: string): string | null {
  const rule = TRANSFER_RULES.find(rule => rule.fromRole === fromRole);
  return rule ? rule.toRole : null;
}

// Get transfer rule for a given source role
export function getTransferRule(fromRole: string): TransferRule | null {
  return TRANSFER_RULES.find(rule => rule.fromRole === fromRole) || null;
}

// Check if a transfer is allowed between two roles
export function isTransferAllowed(fromRole: string, toRole: string): boolean {
  const rule = TRANSFER_RULES.find(rule => 
    rule.fromRole === fromRole && rule.toRole === toRole
  );
  return !!rule;
}

// Get the description for a transfer rule
export function getTransferDescription(fromRole: string): string {
  const rule = getTransferRule(fromRole);
  return rule ? rule.description : '';
}

// Get the destination role name for display
export function getDestinationRoleName(fromRole: string): string {
  const toRole = getAllowedDestinationRole(fromRole);
  if (!toRole) return '';
  
  // Capitalize first letter
  return toRole.charAt(0).toUpperCase() + toRole.slice(1);
}

// Get the source role name for display
export function getSourceRoleName(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
