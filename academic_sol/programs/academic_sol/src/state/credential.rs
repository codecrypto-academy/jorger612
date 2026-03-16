use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CredentialStatus {
    Valid,
    Revoked,
    Expired,
}

#[account]
pub struct Credential {
    pub id: u64,
    pub issuer: Pubkey,
    pub recipient: Pubkey,
    pub credential_type: String,
    pub program_name: String,
    pub issue_date: i64,
    pub expiry_date: i64,
    pub cert_date: i64,
    pub document_hash: String,
    pub ipfs_cid: String,
    pub status: CredentialStatus,
    pub public_key_issuer: String,
    pub bump: u8,
}

impl Credential {
    pub const CREDENTIAL_TYPE_MAX_LEN: usize = 32;
    pub const PROGRAM_NAME_MAX_LEN: usize = 128;
    pub const DOCUMENT_HASH_MAX_LEN: usize = 64;
    pub const IPFS_CID_MAX_LEN: usize = 128;
    pub const PUBLIC_KEY_ISSUER_MAX_LEN: usize = 88;

    // discriminator(8) + id(8) + issuer(32) + recipient(32) + credential_type(4+32) + program_name(4+128)
    // + issue_date(8) + expiry_date(8) + cert_date(8) + document_hash(4+64) + ipfs_cid(4+128) + status(4) + public_key_issuer(4+88) + bump(1)
    pub const LEN: usize = 8 + 8 + 32 + 32
        + 4 + Self::CREDENTIAL_TYPE_MAX_LEN
        + 4 + Self::PROGRAM_NAME_MAX_LEN
        + 8 + 8 + 8
        + 4 + Self::DOCUMENT_HASH_MAX_LEN
        + 4 + Self::IPFS_CID_MAX_LEN
        + 4 // CredentialStatus enum
        + 4 + Self::PUBLIC_KEY_ISSUER_MAX_LEN
        + 1;
}
