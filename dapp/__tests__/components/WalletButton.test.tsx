import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletButton } from '@/components/wallet/WalletButton';
import * as WalletContext from '@/context/WalletContext';

jest.mock('@/context/WalletContext', () => ({
  useWallet: jest.fn(),
}));
jest.mock('@/lib/contract', () => ({
  CHAIN_ID: 31337,
}));

const mockWallet = (overrides = {}) => ({
  account: null, chainId: null, isConnected: false, isOwner: false,
  provider: null, signer: null, connect: jest.fn(), disconnect: jest.fn(), error: null,
  ...overrides,
});

describe('WalletButton – Calidad', () => {
  it('muestra boton Conectar Wallet cuando no esta conectado', () => {
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet());
    render(<WalletButton />);
    expect(screen.getByTestId('btn-connect-wallet')).toBeInTheDocument();
  });

  it('llama a connect al hacer click en Conectar Wallet', () => {
    const connect = jest.fn();
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({ connect }));
    render(<WalletButton />);
    fireEvent.click(screen.getByTestId('btn-connect-wallet'));
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('muestra la direccion truncada al estar conectado', () => {
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({
      account: '0xAbCd1234567890abcdef1234567890ABCDEF1234',
      isConnected: true, chainId: 31337,
    }));
    render(<WalletButton />);
    expect(screen.getByTestId('wallet-address')).toHaveTextContent('0xAbCd...1234');
  });

  it('muestra boton Desconectar al estar conectado', () => {
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true, chainId: 31337,
    }));
    render(<WalletButton />);
    expect(screen.getByTestId('btn-disconnect-wallet')).toBeInTheDocument();
  });

  it('llama a disconnect al hacer click en Desconectar', () => {
    const disconnect = jest.fn();
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true, chainId: 31337, disconnect,
    }));
    render(<WalletButton />);
    fireEvent.click(screen.getByTestId('btn-disconnect-wallet'));
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('muestra badge Owner cuando isOwner es true', () => {
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true, chainId: 31337, isOwner: true,
    }));
    render(<WalletButton />);
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('muestra advertencia de red incorrecta cuando chainId no coincide', () => {
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true, chainId: 1,
    }));
    render(<WalletButton />);
    expect(screen.getByText(/Red incorrecta/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando existe error de conexion', () => {
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({
      error: 'MetaMask no detectado.',
    }));
    render(<WalletButton />);
    expect(screen.getByText('MetaMask no detectado.')).toBeInTheDocument();
  });
});

describe('WalletButton – Seguridad', () => {
  it('no renderiza address completa en el DOM (previene fuga de datos)', () => {
    const fullAddr = '0xAbCd1234567890abcdef1234567890ABCDEF1234';
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({
      account: fullAddr, isConnected: true, chainId: 31337,
    }));
    render(<WalletButton />);
    expect(screen.queryByText(fullAddr)).toBeNull();
  });

  it('no ejecuta connect sin interaccion del usuario', () => {
    const connect = jest.fn();
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({ connect }));
    render(<WalletButton />);
    expect(connect).not.toHaveBeenCalled();
  });

  it('no muestra acciones de owner para no-owner conectado', () => {
    (WalletContext.useWallet as jest.Mock).mockReturnValue(mockWallet({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true, chainId: 31337, isOwner: false,
    }));
    render(<WalletButton />);
    expect(screen.queryByText('Owner')).toBeNull();
  });
});
