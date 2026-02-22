import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsuarioModal } from '@/components/usuarios/UsuarioModal';
import { Rol } from '@/types';

const mockRoles: Rol[] = [
  { id: 1, nombre: 'Admin', activo: true,  timestamp: 0, ejecutor: '0x1' },
  { id: 2, nombre: 'Read',  activo: false, timestamp: 0, ejecutor: '0x2' },
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue(undefined),
  mode: 'crear' as const,
  usuario: null,
  roles: mockRoles,
};

describe('UsuarioModal – Calidad', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza el modal con los campos requeridos', () => {
    render(<UsuarioModal {...defaultProps} />);
    expect(screen.getByTestId('input-usuario-login')).toBeInTheDocument();
    expect(screen.getByTestId('input-usuario-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('select-usuario-rol')).toBeInTheDocument();
  });

  it('muestra solo roles activos en el select', () => {
    render(<UsuarioModal {...defaultProps} />);
    const options = screen.getByTestId('select-usuario-rol').querySelectorAll('option');
    const nombres = Array.from(options).map(o => o.textContent);
    expect(nombres.some(n => n?.includes('Admin'))).toBe(true);
    expect(nombres.some(n => n?.includes('Read'))).toBe(false);
  });

  it('valida login con formato incorrecto', async () => {
    render(<UsuarioModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-usuario-login'), 'us');
    fireEvent.click(screen.getByTestId('btn-submit-usuario'));
    await waitFor(() => expect(screen.getByTestId('usuario-form-error')).toBeInTheDocument());
  });

  it('llama onSubmit con los datos correctos', async () => {
    render(<UsuarioModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-usuario-login'), 'juan.perez');
    await userEvent.type(screen.getByTestId('input-usuario-nombre'), 'Juan Perez');
    await userEvent.selectOptions(screen.getByTestId('select-usuario-rol'), '1');
    fireEvent.click(screen.getByTestId('btn-submit-usuario'));
    await waitFor(() => expect(defaultProps.onSubmit).toHaveBeenCalledWith('juan.perez', 'Juan Perez', 1));
  });

  it('prellena datos en modo modificar', () => {
    const usuario = { id: 3, login: 'u.test', nombre: 'User Test', rolId: 1, activo: true, timestamp: 0, ejecutor: '0x1' };
    render(<UsuarioModal {...defaultProps} mode="modificar" usuario={usuario} />);
    expect(screen.getByTestId('input-usuario-login')).toHaveValue('u.test');
    expect(screen.getByTestId('input-usuario-nombre')).toHaveValue('User Test');
  });
});

describe('UsuarioModal – Seguridad', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rechaza login con caracteres especiales (inyeccion)', async () => {
    render(<UsuarioModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-usuario-login'), 'admin<script>');
    fireEvent.click(screen.getByTestId('btn-submit-usuario'));
    await waitFor(() => expect(screen.getByTestId('usuario-form-error')).toBeInTheDocument());
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('no muestra roles inactivos en el selector (previene asignacion invalida)', () => {
    render(<UsuarioModal {...defaultProps} />);
    const select = screen.getByTestId('select-usuario-rol');
    const options = Array.from(select.querySelectorAll('option'));
    expect(options.some(o => o.textContent?.includes('Read'))).toBe(false);
  });

  it('bloquea envio si no hay roles activos disponibles', async () => {
    render(<UsuarioModal {...defaultProps} roles={[{ id: 2, nombre: 'Read', activo: false, timestamp: 0, ejecutor: '0x2' }]} />);
    await userEvent.type(screen.getByTestId('input-usuario-login'), 'usr.test');
    await userEvent.type(screen.getByTestId('input-usuario-nombre'), 'Test User');
    fireEvent.click(screen.getByTestId('btn-submit-usuario'));
    await waitFor(() => expect(screen.getByTestId('usuario-form-error')).toBeInTheDocument());
  });
});
