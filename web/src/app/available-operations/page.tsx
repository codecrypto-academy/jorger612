"use client";

import { useMemo } from "react";

import { ChainMismatchBanner } from "@/components/ChainMismatchBanner";
import { AvailableOperationsList } from "@/components/AvailableOperationsList";
import { useAllowedTokens, useOperations } from "@/hooks/useEscrow";

export default function AvailableOperationsPage() {
  const {
    data: allowedTokens = [],
    isLoading: loadingTokens,
    error: tokensError,
  } = useAllowedTokens();
  const {
    data: operations = [],
    isLoading: loadingOperations,
    error: operationsError,
  } = useOperations();

  const availableCount = useMemo(
    () =>
      operations.filter(
        (operation) => operation.isActive
      ).length,
    [operations]
  );

  return (
    <div className="flex flex-col gap-6">
      <ChainMismatchBanner />

      <div className="card">
        <p className="pill">Mesa de oportunidades</p>
        <h2 className="section-heading">Intercambios P2P disponibles</h2>
        <p className="section-description">
          Explora operaciones activas creadas por otros usuarios y completa el swap
          siguiendo el flujo ejecutivo de aprobación y ejecución.
        </p>
        <div className="stat-grid">
          <div className="stat-card">
            <span>Operaciones activas</span>
            <strong>{loadingOperations ? "…" : availableCount}</strong>
          </div>
          <div className="stat-card">
            <span>Tokens permitidos</span>
            <strong>{loadingTokens ? "…" : allowedTokens.length}</strong>
          </div>
        </div>
      </div>

      {tokensError && (
        <div className="badge error">
          Error al cargar los tokens: {String(tokensError)}
        </div>
      )}

      {operationsError && (
        <div className="badge error">
          Error al cargar las operaciones: {String(operationsError)}
        </div>
      )}

      {loadingTokens || loadingOperations ? (
        <div className="card">Cargando información de la red…</div>
      ) : (
        <AvailableOperationsList
          operations={operations}
          tokens={allowedTokens}
        />
      )}
    </div>
  );
}

