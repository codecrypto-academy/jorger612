export interface Rol {
  id: number;
  nombre: string;
  activo: boolean;
  timestamp: number;
  ejecutor: string;
}

export interface Usuario {
  id: number;
  login: string;
  nombre: string;
  rolId: number;
  activo: boolean;
  timestamp: number;
  ejecutor: string;
}

export interface Menu {
  id: number;
  nombre: string;
  activo: boolean;
  timestamp: number;
  ejecutor: string;
}

export interface MenuRol {
  menuId: number;
  rolId: number;
  activo: boolean;
}

export interface CuentaAutorizada {
  wallet: string;
  nombre: string;
  fechaHora: number;
  activa: boolean;
}

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
