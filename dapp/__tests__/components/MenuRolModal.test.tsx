import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MenuRolModal } from '@/components/menus/MenuRolModal';
import { Menu, Rol } from '@/types';

const mockMenu: Menu = { id: 1, nombre: 'Dashboard', activo: true, timestamp: 0, ejecutor: '0x1' };
const mockRoles: Rol[] = [
  { id: 1, nombre: 'Admin',    activo: true,  timestamp: 0, ejecutor: '0x1' },
  { id: 2, nombre: 'Auditor',  activo: true,  timestamp: 0, ejecutor: '0x2' },
  { id: 3, nombre: 'Disabled', activo: false, timestamp: 0, ejecutor: '0x3' },
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  menu: mockMenu,
  roles: mockRoles,
  onVincular: jest.fn().mockResolvedValue(undefined),
  onDesvincular: jest.fn().mockResolvedValue(undefined),
  verificarAcceso: jest.fn().mockResolvedValue(false),
};

describe('MenuRolModal – Calidad', () => {
  beforeEach(() => jest.clearAllMocks());

  it('muestra el nombre del menu seleccionado', async () => {
    render(<MenuRolModal {...defaultProps} />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Asociar Roles: Dashboard/ })).toBeInTheDocument());
  });

  it('muestra solo roles activos en la lista', async () => {
    render(<MenuRolModal {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument());
    expect(screen.getByText('Auditor')).toBeInTheDocument();
    expect(screen.queryByText('Disabled')).toBeNull();
  });

  it('llama a verificarAcceso para cada rol activo', async () => {
    render(<MenuRolModal {...defaultProps} />);
    await waitFor(() => expect(defaultProps.verificarAcceso).toHaveBeenCalledWith(1, 1));
    expect(defaultProps.verificarAcceso).toHaveBeenCalledWith(2, 1);
  });

  it('llama a onVincular al hacer click en Vincular', async () => {
    render(<MenuRolModal {...defaultProps} />);
    await waitFor(() => screen.getByTestId('btn-toggle-rol-1'));
    fireEvent.click(screen.getByTestId('btn-toggle-rol-1'));
    await waitFor(() => expect(defaultProps.onVincular).toHaveBeenCalledWith(1, 1));
  });

  it('llama a onDesvincular cuando el acceso ya esta activo', async () => {
    const verificarAcceso = jest.fn().mockResolvedValue(true);
    render(<MenuRolModal {...defaultProps} verificarAcceso={verificarAcceso} />);
    await waitFor(() => screen.getByTestId('btn-toggle-rol-1'));
    fireEvent.click(screen.getByTestId('btn-toggle-rol-1'));
    await waitFor(() => expect(defaultProps.onDesvincular).toHaveBeenCalled());
  });

  it('cierra el modal al hacer click en Cerrar', async () => {
    render(<MenuRolModal {...defaultProps} />);
    await waitFor(() => screen.getByText('Cerrar'));
    fireEvent.click(screen.getByText('Cerrar'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe('MenuRolModal – Seguridad', () => {
  beforeEach(() => jest.clearAllMocks());

  it('no muestra roles inactivos (previene vinculacion invalida)', async () => {
    render(<MenuRolModal {...defaultProps} />);
    await waitFor(() => screen.getByTestId('menu-rol-list'));
    expect(screen.queryByText('Disabled')).toBeNull();
  });

  it('muestra error cuando falla la operacion de vinculacion', async () => {
    const onVincular = jest.fn().mockRejectedValue(new Error('MenuYaVinculado'));
    render(<MenuRolModal {...defaultProps} onVincular={onVincular} />);
    await waitFor(() => screen.getByTestId('btn-toggle-rol-1'));
    fireEvent.click(screen.getByTestId('btn-toggle-rol-1'));
    await waitFor(() => expect(screen.getByTestId('menu-rol-error')).toBeInTheDocument());
  });

  it('no renderiza nada critico cuando menu es null', () => {
    render(<MenuRolModal {...defaultProps} menu={null} />);
    expect(screen.queryByTestId('menu-rol-list')).toBeNull();
  });
});
