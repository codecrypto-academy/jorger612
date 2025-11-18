"use client";

import { useMemo } from "react";

import { BalanceCards } from "@/components/BalanceCards";
import { ChainMismatchBanner } from "@/components/ChainMismatchBanner";
import { CreateOperationForm } from "@/components/CreateOperationForm";
import { MyOperationsList } from "@/components/MyOperationsList";
import { useAllowedTokens, useOperations } from "@/hooks/useEscrow";

export default function DashboardPage() {
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

  const activeOperations = useMemo(
    () => operations.filter((operation) => operation.isActive).length,
    [operations]
  );

  const latestOperationId = useMemo(() => {
    if (operations.length === 0) return "—";
    return operations[operations.length - 1].id.toString();
  }, [operations]);

  return (
    <div className="flex flex-col gap-6">
      <ChainMismatchBanner />

      <div className="card">
        <p className="pill">Panel ejecutivo</p>
        <h2 className="section-heading">Mesa de control de Escrow</h2>
        <p className="section-description">
          Supervisa los activos habilitados y crea nuevas operaciones con la certeza
          de que el contrato custodiará los fondos hasta completar el intercambio.
        </p>
        <div className="stat-grid">
          <div className="stat-card">
            <span>Tokens habilitados</span>
            <strong>
              {loadingTokens ? "…" : allowedTokens.length}
            </strong>
          </div>
          <div className="stat-card">
            <span>Operaciones activas</span>
            <strong>
              {loadingOperations ? "…" : activeOperations}
            </strong>
          </div>
          <div className="stat-card">
            <span>Última operación ID</span>
            <strong>{loadingOperations ? "…" : latestOperationId}</strong>
          </div>
        </div>
      </div>

      {tokensError && (
        <div className="badge error">
          Error al cargar los tokens permitidos: {String(tokensError)}
        </div>
      )}

      <BalanceCards operations={operations} />

      {operationsError && (
        <div className="badge error">
          Error al cargar las operaciones: {String(operationsError)}
        </div>
      )}

      {loadingTokens ? (
        <div className="card">Cargando tokens permitidos…</div>
      ) : allowedTokens.length === 0 ? (
        <div className="card">
          <p className="pill">Sin tokens</p>
          <p className="section-description">
            Aún no hay tokens registrados. El owner puede agregarlos desde la
            sección de administración.
          </p>
        </div>
      ) : (
        <div className="grid-panels">
          <CreateOperationForm tokens={allowedTokens} />
          {loadingOperations ? (
            <div className="card">Cargando operaciones activas…</div>
          ) : (
            <MyOperationsList operations={operations} tokens={allowedTokens} />
          )}
        </div>
      )}
    </div>
  );
}
