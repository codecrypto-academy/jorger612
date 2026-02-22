import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RolTable } from '@/components/roles/RolTable';
import { Rol } from '@/types';

const mockRoles: Rol[] = [
  { id: 1, nombre: 'Administrador', activo: true,  timestamp: 1000, ejecutor: '0xOwner0000000000000000000000000000000000' },
  { id: 2, nombre: 'Auditor',       activo: false, timestamp: 2000, ejecutor: '0xOwner0000000000000000000000000000000001' },
];

describe('RolTable – Calidad', () => {
  it('renderiza la tabla con roles', () => {
    render(<RolTable roles={mockRoles} loading={false} isOwner={true} onModificar={jest.fn()} onInhabilitar={jest.fn()} />);
    expect(screen.getByTestId('rol-table')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Auditor')).toBeInTheDocument();
  });

  it('muestra estado de carga (skeleton) cuando loading es true', () => {
    render(<RolTable roles={[]} loading={true} isOwner={true} onModificar={jest.fn()} onInhabilitar={jest.fn()} />);
    expect(screen.getByTestId('rol-table-loading')).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay roles', () => {
    render(<RolTable roles={[]} loading={false} isOwner={true} onModificar={jest.fn()} onInhabilitar={jest.fn()} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('muestra badge Activo/Inactivo segun estado', () => {
    render(<RolTable roles={mockRoles} loading={false} isOwner={true} onModificar={jest.fn()} onInhabilitar={jest.fn()} />);
    expect(screen.getByTestId('badge-active')).toBeInTheDocument();
    expect(screen.getByTestId('badge-inactive')).toBeInTheDocument();
  });

  it('llama a onModificar con el rol correcto', () => {
    const onModificar = jest.fn();
    render(<RolTable roles={mockRoles} loading={false} isOwner={true} onModificar={onModificar} onInhabilitar={jest.fn()} />);
    fireEvent.click(screen.getByTestId('btn-modificar-rol-1'));
    expect(onModificar).toHaveBeenCalledWith(mockRoles[0]);
  });

  it('llama a onInhabilitar con el rol correcto', () => {
    const onInhabilitar = jest.fn();
    render(<RolTable roles={mockRoles} loading={false} isOwner={true} onModificar={jest.fn()} onInhabilitar={onInhabilitar} />);
    fireEvent.click(screen.getByTestId('btn-inhabilitar-rol-1'));
    expect(onInhabilitar).toHaveBeenCalledWith(mockRoles[0]);
  });

  it('deshabilita botones de accion para roles inactivos', () => {
    render(<RolTable roles={mockRoles} loading={false} isOwner={true} onModificar={jest.fn()} onInhabilitar={jest.fn()} />);
    expect(screen.getByTestId('btn-modificar-rol-2')).toBeDisabled();
    expect(screen.getByTestId('btn-inhabilitar-rol-2')).toBeDisabled();
  });

  it('no muestra botones de accion si no es owner', () => {
    render(<RolTable roles={mockRoles} loading={false} isOwner={false} onModificar={jest.fn()} onInhabilitar={jest.fn()} />);
    expect(screen.queryByTestId('btn-modificar-rol-1')).toBeNull();
    expect(screen.queryByTestId('btn-inhabilitar-rol-1')).toBeNull();
  });

  it('muestra IDs con formato #N', () => {
    render(<RolTable roles={mockRoles} loading={false} isOwner={true} onModificar={jest.fn()} onInhabilitar={jest.fn()} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });
});

describe('RolTable – Seguridad', () => {
  it('oculta la direccion ejecutor completa (truncada)', () => {
    render(<RolTable roles={mockRoles} loading={false} isOwner={true} onModificar={jest.fn()} onInhabilitar={jest.fn()} />);
    expect(screen.queryByText('0xOwner0000000000000000000000000000000000')).toBeNull();
  });

  it('no muestra acciones sensibles a usuarios no-owner', () => {
    render(<RolTable roles={mockRoles} loading={false} isOwner={false} onModificar={jest.fn()} onInhabilitar={jest.fn()} />);
    expect(screen.queryByText('Inhabilitar')).toBeNull();
    expect(screen.queryByText('Modificar')).toBeNull();
  });
});
