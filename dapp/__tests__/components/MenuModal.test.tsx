import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuModal } from '@/components/menus/MenuModal';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue(undefined),
  mode: 'crear' as const,
  menu: null,
};

describe('MenuModal – Calidad', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza el modal con el campo de nombre', () => {
    render(<MenuModal {...defaultProps} />);
    expect(screen.getByTestId('input-menu-nombre')).toBeInTheDocument();
  });

  it('muestra error si el nombre esta vacio', async () => {
    render(<MenuModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-submit-menu'));
    await waitFor(() => expect(screen.getByTestId('menu-form-error')).toHaveTextContent('obligatorio'));
  });

  it('llama onSubmit con el nombre correcto', async () => {
    render(<MenuModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-menu-nombre'), 'Dashboard');
    fireEvent.click(screen.getByTestId('btn-submit-menu'));
    await waitFor(() => expect(defaultProps.onSubmit).toHaveBeenCalledWith('Dashboard'));
  });

  it('prellena nombre en modo modificar', () => {
    const menu = { id: 1, nombre: 'Reportes', activo: true, timestamp: 0, ejecutor: '0x1' };
    render(<MenuModal {...defaultProps} mode="modificar" menu={menu} />);
    expect(screen.getByTestId('input-menu-nombre')).toHaveValue('Reportes');
  });

  it('acepta nombres con barra (rutas de menu)', async () => {
    render(<MenuModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-menu-nombre'), 'Reportes/Ventas');
    fireEvent.click(screen.getByTestId('btn-submit-menu'));
    await waitFor(() => expect(defaultProps.onSubmit).toHaveBeenCalledWith('Reportes/Ventas'));
  });

  it('cierra el modal al presionar Cancelar', () => {
    render(<MenuModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe('MenuModal – Seguridad', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rechaza nombres con etiquetas HTML (XSS)', async () => {
    render(<MenuModal {...defaultProps} />);
    await userEvent.type(screen.getByTestId('input-menu-nombre'), '<img src=x onerror=alert(1)>');
    fireEvent.click(screen.getByTestId('btn-submit-menu'));
    await waitFor(() => expect(screen.getByTestId('menu-form-error')).toBeInTheDocument());
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('rechaza nombres que excedan 64 caracteres', async () => {
    render(<MenuModal {...defaultProps} />);
    fireEvent.change(screen.getByTestId('input-menu-nombre'), {
      target: { value: 'M'.repeat(65) },
    });
    fireEvent.click(screen.getByTestId('btn-submit-menu'));
    await waitFor(() => expect(screen.getByTestId('menu-form-error')).toBeInTheDocument());
  });

  it('no llama onSubmit cuando falla la transaccion blockchain', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('caller is not the owner'));
    render(<MenuModal {...defaultProps} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByTestId('input-menu-nombre'), 'Dashboard');
    fireEvent.click(screen.getByTestId('btn-submit-menu'));
    await waitFor(() => expect(screen.getByTestId('menu-form-error')).toHaveTextContent('caller is not the owner'));
  });
});
