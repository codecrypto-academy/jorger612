"use client";

import { ChainMismatchBanner } from "@/components/ChainMismatchBanner";
import { AdminPanel } from "@/components/AdminPanel";
import { useWeb3 } from "@/context/Web3Context";
import { useAllowedTokens, useEscrowOwner } from "@/hooks/useEscrow";

export default function AdminPage() {
  const { address, isConnected, isMetaMaskAvailable } = useWeb3();
  const {
    data: allowedTokens = [],
    isLoading: loadingTokens,
    error: tokensError,
  } = useAllowedTokens();
  const {
    data: ownerAddress,
    isLoading: loadingOwner,
    error: ownerError,
  } = useEscrowOwner();

  const isOwner =
    Boolean(address) &&
    Boolean(ownerAddress) &&
    address?.toLowerCase() === ownerAddress?.toLowerCase();

  return (
    <div className="flex flex-col gap-6">
      <ChainMismatchBanner />

      <div className="card">
        <p className="pill">Oficina del owner</p>
        <h2 className="section-heading">Control de activos permitidos</h2>
        <p className="section-description">
          Supervisa los tokens autorizados para el escrow e incorpora nuevos
          activos ERC20 desplegados en tu entorno local.
        </p>
      </div>

      {ownerError && (
        <div className="badge error">
          Error al obtener la dirección del owner: {String(ownerError)}
        </div>
      )}

      {tokensError && (
        <div className="badge error">
          Error al cargar los tokens: {String(tokensError)}
        </div>
      )}

      {!isMetaMaskAvailable ? (
        <div className="card">
          Instala MetaMask para acceder a las herramientas de administración.
        </div>
      ) : !isConnected ? (
        <div className="card">
          Conecta tu billetera para acceder a las herramientas de administración.
        </div>
      ) : loadingOwner || loadingTokens ? (
        <div className="card">Cargando información del contrato…</div>
      ) : (
        <AdminPanel
          tokens={allowedTokens}
          isOwner={isOwner}
          ownerAddress={ownerAddress}
        />
      )}
    </div>
  );
}

