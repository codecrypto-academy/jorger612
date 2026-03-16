use anchor_lang::prelude::*;

#[account]
pub struct CredentialCounter {
    pub institution: Pubkey,
    pub next_id: u64,
    pub bump: u8,
}

impl CredentialCounter {
    pub const LEN: usize = 8 + 32 + 8 + 1;
}
