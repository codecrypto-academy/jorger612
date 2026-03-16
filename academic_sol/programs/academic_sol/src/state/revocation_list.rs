use anchor_lang::prelude::*;

#[account]
pub struct RevocationList {
    pub id: u64,
    pub institution: Pubkey,
    pub revoked_credential_ids: Vec<u64>,
    pub last_updated: i64,
    pub bump: u8,
}

impl RevocationList {
    pub const REVOKED_IDS_MAX: usize = 100;

    // discriminator(8) + id(8) + institution(32) + vec(4 + 8*100) + last_updated(8) + bump(1)
    pub const LEN: usize = 8 + 8 + 32 + 4 + (8 * Self::REVOKED_IDS_MAX) + 8 + 1;
}
