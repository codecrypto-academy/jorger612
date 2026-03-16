use anchor_lang::prelude::*;

#[error_code]
pub enum AcademicSolError {
    #[msg("Only the program authority can perform this action")]
    UnauthorizedAuthority,

    #[msg("Institution already registered")]
    InstitutionAlreadyExists,

    #[msg("Institution not found")]
    InstitutionNotFound,

    #[msg("Credential not found")]
    CredentialNotFound,

    #[msg("Credential already revoked")]
    CredentialAlreadyRevoked,

    #[msg("Credential has expired")]
    CredentialExpired,

    #[msg("String exceeds maximum length")]
    StringTooLong,

    #[msg("Revocation list is full")]
    RevocationListFull,

    #[msg("Invalid credential status")]
    InvalidCredentialStatus,
}
