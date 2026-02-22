import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RolModal } from '@/components/roles/RolModal';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue(undefined),
  mode: 'crear' as const,
  rol: null,
};

describe('RolModal – Calidad', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza el modal cuando isOpen es true', () => {
    render(<RolModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Crear Nuevo Rol')).toBeInTheDocument();
  });

  it('no renderiza el modal cuando isOpen es false', () => {
    render(<RolModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('muestra error si se intenta enviar con nombre vacio', async () => {
    render(<RolModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-submit-rol'));
    await waitFor(() => expect(screen.getByTestId('rol-form-error')).toBeInTheDocument());
    expect(screen.getByTestId('rol-form-error')).toHaveTextContent('obligatorio');
  });

  it('muestra error si el nombre tiene menos de 2 caracteres', async () => {
    render(<RolModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-rol-nombre'), 'A');
    fireEvent.click(screen.getByTestId('btn-submit-rol'));
    await waitFor(() => expect(screen.getByTestId('rol-form-error')).toHaveTextContent('al menos 2'));
  });

  it('llama a onSubmit con el nombre correcto al enviar', async () => {
    render(<RolModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-rol-nombre'), 'Administrador');
    fireEvent.click(screen.getByTestId('btn-submit-rol'));
    await waitFor(() => expect(defaultProps.onSubmit).toHaveBeenCalledWith('Administrador'));
  });

  it('llama a onClose al hacer click en Cancelar', () => {
    render(<RolModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('cierra el modal con Escape', () => {
    render(<RolModal {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('prellena el nombre al modificar un rol existente', () => {
    const rol = { id: 1, nombre: 'Auditor', activo: true, timestamp: 0, ejecutor: '0x1' };
    render(<RolModal {...defaultProps} mode="modificar" rol={rol} />);
    expect(screen.getByTestId('input-rol-nombre')).toHaveValue('Auditor');
  });

  it('muestra el ID del rol en modo modificar', () => {
    const rol = { id: 5, nombre: 'Supervisor', activo: true, timestamp: 0, ejecutor: '0x1' };
    render(<RolModal {...defaultProps} mode="modificar" rol={rol} />);
    expect(screen.getByText(/#5/)).toBeInTheDocument();
  });

  it('muestra el contador de caracteres', () => {
    render(<RolModal {...defaultProps} />);
    expect(screen.getByText('0/64')).toBeInTheDocument();
  });
});

describe('RolModal – Seguridad', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rechaza nombres con caracteres especiales peligrosos (XSS)', async () => {
    render(<RolModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-rol-nombre'), '<script>alert(1)</script>');
    fireEvent.click(screen.getByTestId('btn-submit-rol'));
    await waitFor(() => expect(screen.getByTestId('rol-form-error')).toBeInTheDocument());
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('rechaza nombres con SQL injection patterns', async () => {
    render(<RolModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-rol-nombre'), "'; DROP TABLE roles;--");
    fireEvent.click(screen.getByTestId('btn-submit-rol'));
    await waitFor(() => expect(screen.getByTestId('rol-form-error')).toBeInTheDocument());
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('rechaza nombres que superen 64 caracteres', async () => {
    render(<RolModal {...defaultProps} />);
    // fireEvent.change bypasses maxLength to simulate direct value injection
    fireEvent.change(screen.getByTestId('input-rol-nombre'), {
      target: { value: 'A'.repeat(65) },
    });
    fireEvent.click(screen.getByTestId('btn-submit-rol'));
    await waitFor(() => expect(screen.getByTestId('rol-form-error')).toBeInTheDocument());
  });

  it('no llama onSubmit si la transaccion falla', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Solo el owner puede operar.'));
    render(<RolModal {...defaultProps} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByTestId('input-rol-nombre'), 'Admin');
    fireEvent.click(screen.getByTestId('btn-submit-rol'));
    await waitFor(() => expect(screen.getByTestId('rol-form-error')).toHaveTextContent('Solo el owner'));
  });
});
