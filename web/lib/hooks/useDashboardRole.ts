"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { getInstitutionPDA } from "@/lib/utils/pda";
import {
  ROLE_ADDRESSES,
  type RoleType,
} from "@/lib/solana/constants";

export interface DashboardRoleState {
  role: RoleType;
  loading: boolean;
  isProgramInitialized: boolean;
  isAdmin: boolean;
  isCodeCrypto: boolean;
  isEstudiante: boolean;
  isEmpleador: boolean;
  isInstitution: boolean;
  isAuthority: boolean;
  canInitialize: boolean;
  canRegisterInstitution: boolean;
  canCertify: boolean;
  canVerify: boolean;
  canSeeMyCertificates: boolean;
  canSeeCertificatesByStudent: boolean;
}

export function useDashboardRole(): DashboardRoleState {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [role, setRole] = useState<RoleType>(null);
  const [isInstitution, setIsInstitution] = useState(false);
  const [isAuthority, setIsAuthority] = useState(false);
  const [isProgramInitialized, setIsProgramInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!program || !publicKey) {
      setLoading(false);
      setRole(null);
      return;
    }

    const check = async () => {
      try {
        let authority = false;
        let initialized = false;
        try {
          const [configPDA] = (await import("@/lib/utils/pda")).getConfigPDA();
          const config = await program.account.programConfig.fetch(configPDA);
          authority = config.authority.equals(publicKey);
          initialized = true;
        } catch {
          authority = false;
          initialized = false;
        }
        setIsProgramInitialized(initialized);

        let institution = false;
        try {
          const [institutionPDA] = getInstitutionPDA(publicKey);
          await program.account.institution.fetch(institutionPDA);
          institution = true;
        } catch {
          institution = false;
        }

        setIsAuthority(authority);
        setIsInstitution(institution);

        const pkStr = publicKey.toString();
        const adminStr = ROLE_ADDRESSES.ADMIN.toString();
        const codeCryptoStr = ROLE_ADDRESSES.CODE_CRYPTO.toString();
        const estudianteStr = ROLE_ADDRESSES.ESTUDIANTE.toString();
        const empleadorStr = ROLE_ADDRESSES.EMPLEADOR.toString();

        if (pkStr === adminStr || authority) {
          setRole("admin");
        } else if (pkStr === codeCryptoStr && institution) {
          setRole("codecrypto");
        } else if (pkStr === estudianteStr) {
          setRole("estudiante");
        } else if (pkStr === empleadorStr) {
          setRole("empleador");
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [program, publicKey]);

  const isAdmin = role === "admin";
  const isCodeCrypto = role === "codecrypto";
  const isEstudiante = role === "estudiante";
  const isEmpleador = role === "empleador";

  return {
    role,
    loading,
    isProgramInitialized,
    isAdmin,
    isCodeCrypto,
    isEstudiante,
    isEmpleador,
    isInstitution,
    isAuthority,
    canInitialize: isAdmin,
    canRegisterInstitution: isAdmin,
    canCertify: isAdmin || isCodeCrypto,
    canVerify: true,
    canSeeMyCertificates: isAdmin || isCodeCrypto || isEstudiante,
    canSeeCertificatesByStudent: isAdmin || isCodeCrypto,
  };
}
