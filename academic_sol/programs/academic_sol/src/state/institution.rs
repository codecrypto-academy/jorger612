use anchor_lang::prelude::*;

#[account]
pub struct Institution {
    pub address: Pubkey,
    pub name: String,
    pub location: String,
    pub public_key: String,
    pub is_verified: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl Institution {
    pub const NAME_MAX_LEN: usize = 64;
    pub const LOCATION_MAX_LEN: usize = 64;
    pub const PUBLIC_KEY_MAX_LEN: usize = 88;

    // discriminator(8) + address(32) + name(4+64) + location(4+64) + public_key(4+88) + is_verified(1) + created_at(8) + bump(1)
    pub const LEN: usize = 8 + 32 + 4 + Self::NAME_MAX_LEN + 4 + Self::LOCATION_MAX_LEN
        + 4 + Self::PUBLIC_KEY_MAX_LEN
        + 1 + 8 + 1;
}
