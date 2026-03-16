# academic_sol - Certificación Académica Digital en Solana

Programa Anchor para emisión y verificación de certificados académicos en Solana.

## Instrucciones

- **initialize**: Inicializar el programa (authority)
- **register_institution**: Registrar una universidad/institución
- **issue_credential**: Emitir un certificado (diploma, badge, etc.)
- **revoke_credential**: Revocar un certificado
- **reissue_credential**: Re-emitir certificado (nueva versión)

## PDAs

| PDA | Seeds |
|-----|-------|
| ProgramConfig | `["config"]` |
| Institution | `["institution", institution_signer]` |
| Credential | `["credential", institution_pda, id]` |
| CredentialCounter | `["credential_counter", institution_signer]` |
| RevocationList | `["revocation_list", institution_signer]` |

## Build y Deploy

```bash
anchor build
anchor deploy
```

## Tests

```bash
anchor test
```

## Referencia

Ver `60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md` para la especificación completa.
