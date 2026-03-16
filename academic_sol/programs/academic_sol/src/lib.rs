use anchor_lang::prelude::*;

pub mod error;
pub mod state;

use state::*;

declare_id!("7992aXQLFQBb3MpGJG1tZPq9Ed4owWUK2D4bUiWXsBqQ");

#[program]
pub mod academic_sol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.program_config;
        let (_, bump) = Pubkey::find_program_address(&[b"config"], &ctx.program_id);
        config.authority = ctx.accounts.authority.key();
        config.bump = bump;
        config.initialized = true;
        msg!("Program initialized by: {:?}", config.authority);
        Ok(())
    }

    pub fn register_institution(
        ctx: Context<RegisterInstitution>,
        name: String,
        location: String,
        public_key: String,
    ) -> Result<()> {
        require!(
            name.len() <= Institution::NAME_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );
        require!(
            location.len() <= Institution::LOCATION_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );
        require!(
            public_key.len() <= Institution::PUBLIC_KEY_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );

        let clock = Clock::get()?;
        let institution_address = ctx.accounts.institution_address.key();
        let institution = &mut ctx.accounts.institution;
        let (_, bump) = Pubkey::find_program_address(
            &[b"institution", institution_address.as_ref()],
            ctx.program_id,
        );

        institution.address = institution_address;
        institution.name = name;
        institution.location = location;
        institution.public_key = public_key;
        institution.is_verified = true;
        institution.created_at = clock.unix_timestamp;
        institution.bump = bump;

        // Initialize credential counter for this institution
        let counter = &mut ctx.accounts.credential_counter;
        let (_, counter_bump) = Pubkey::find_program_address(
            &[b"credential_counter", institution.address.as_ref()],
            ctx.program_id,
        );
        counter.institution = institution.address;
        counter.next_id = 1;
        counter.bump = counter_bump;

        // Initialize revocation list
        let revocation_list = &mut ctx.accounts.revocation_list;
        let (_, rl_bump) = Pubkey::find_program_address(
            &[b"revocation_list", institution.address.as_ref()],
            ctx.program_id,
        );
        revocation_list.id = 1;
        revocation_list.institution = institution.address;
        revocation_list.revoked_credential_ids = vec![];
        revocation_list.last_updated = clock.unix_timestamp;
        revocation_list.bump = rl_bump;

        msg!("Institution registered: {:?}", institution.address);
        Ok(())
    }

    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        credential_type: String,
        program_name: String,
        document_hash: String,
        ipfs_cid: String,
        expiry_date: i64,
        cert_date: i64,
    ) -> Result<()> {
        require!(
            credential_type.len() <= Credential::CREDENTIAL_TYPE_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );
        require!(
            program_name.len() <= Credential::PROGRAM_NAME_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );
        require!(
            document_hash.len() <= Credential::DOCUMENT_HASH_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );
        require!(
            ipfs_cid.len() <= Credential::IPFS_CID_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );
        require!(
            ctx.accounts.institution.public_key.len() <= Credential::PUBLIC_KEY_ISSUER_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );

        let clock = Clock::get()?;
        let credential_id = ctx.accounts.credential_counter.next_id;
        ctx.accounts.credential_counter.next_id = credential_id
            .checked_add(1)
            .ok_or(error::AcademicSolError::InvalidCredentialStatus)?;

        let credential = &mut ctx.accounts.credential;
        let (_, bump) = Pubkey::find_program_address(
            &[
                b"credential",
                ctx.accounts.institution.key().as_ref(),
                &credential_id.to_le_bytes(),
            ],
            ctx.program_id,
        );

        credential.id = credential_id;
        credential.issuer = ctx.accounts.institution.key();
        credential.recipient = ctx.accounts.recipient.key();
        credential.credential_type = credential_type;
        credential.program_name = program_name;
        credential.issue_date = clock.unix_timestamp;
        credential.expiry_date = expiry_date;
        credential.cert_date = cert_date;
        credential.document_hash = document_hash;
        credential.ipfs_cid = ipfs_cid;
        credential.status = CredentialStatus::Valid;
        credential.public_key_issuer = ctx.accounts.institution.public_key.clone();
        credential.bump = bump;

        emit!(CredentialIssued {
            credential_id,
            issuer: credential.issuer,
            recipient: credential.recipient,
            program_name: credential.program_name.clone(),
            issue_date: credential.issue_date,
            document_hash: credential.document_hash.clone(),
        });

        msg!("Credential issued: id={}", credential_id);
        Ok(())
    }

    pub fn revoke_credential(ctx: Context<RevokeCredential>, reason: String) -> Result<()> {
        let credential = &mut ctx.accounts.credential;
        require!(
            credential.status == CredentialStatus::Valid,
            error::AcademicSolError::CredentialAlreadyRevoked
        );

        let clock = Clock::get()?;
        credential.status = CredentialStatus::Revoked;

        let revocation_list = &mut ctx.accounts.revocation_list;
        require!(
            revocation_list.revoked_credential_ids.len() < RevocationList::REVOKED_IDS_MAX,
            error::AcademicSolError::RevocationListFull
        );
        revocation_list.revoked_credential_ids.push(credential.id);
        revocation_list.last_updated = clock.unix_timestamp;

        emit!(CredentialRevoked {
            credential_id: credential.id,
            issuer: credential.issuer,
            reason: reason.clone(),
            timestamp: clock.unix_timestamp,
        });

        msg!("Credential revoked: id={}", credential.id);
        Ok(())
    }

    pub fn reissue_credential(
        ctx: Context<ReissueCredential>,
        credential_type: String,
        program_name: String,
        document_hash: String,
        ipfs_cid: String,
        expiry_date: i64,
        cert_date: i64,
    ) -> Result<()> {
        require!(
            credential_type.len() <= Credential::CREDENTIAL_TYPE_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );
        require!(
            program_name.len() <= Credential::PROGRAM_NAME_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );
        require!(
            document_hash.len() <= Credential::DOCUMENT_HASH_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );
        require!(
            ipfs_cid.len() <= Credential::IPFS_CID_MAX_LEN,
            error::AcademicSolError::StringTooLong
        );

        let old_credential = &ctx.accounts.old_credential;
        require!(
            old_credential.recipient == ctx.accounts.recipient.key(),
            error::AcademicSolError::CredentialNotFound
        );

        let clock = Clock::get()?;
        let credential_id = ctx.accounts.credential_counter.next_id;
        ctx.accounts.credential_counter.next_id = credential_id
            .checked_add(1)
            .ok_or(error::AcademicSolError::InvalidCredentialStatus)?;

        let credential = &mut ctx.accounts.credential;
        let (_, bump) = Pubkey::find_program_address(
            &[
                b"credential",
                ctx.accounts.institution.key().as_ref(),
                &credential_id.to_le_bytes(),
            ],
            ctx.program_id,
        );

        credential.id = credential_id;
        credential.issuer = ctx.accounts.institution.key();
        credential.recipient = ctx.accounts.recipient.key();
        credential.credential_type = credential_type;
        credential.program_name = program_name;
        credential.issue_date = clock.unix_timestamp;
        credential.expiry_date = expiry_date;
        credential.cert_date = cert_date;
        credential.document_hash = document_hash;
        credential.ipfs_cid = ipfs_cid;
        credential.status = CredentialStatus::Valid;
        credential.public_key_issuer = ctx.accounts.institution.public_key.clone();
        credential.bump = bump;

        emit!(CredentialIssued {
            credential_id,
            issuer: credential.issuer,
            recipient: credential.recipient,
            program_name: credential.program_name.clone(),
            issue_date: credential.issue_date,
            document_hash: credential.document_hash.clone(),
        });

        msg!("Credential reissued: new_id={}", credential_id);
        Ok(())
    }
}

#[event]
pub struct CredentialIssued {
    pub credential_id: u64,
    pub issuer: Pubkey,
    pub recipient: Pubkey,
    pub program_name: String,
    pub issue_date: i64,
    pub document_hash: String,
}

#[event]
pub struct CredentialRevoked {
    pub credential_id: u64,
    pub issuer: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + ProgramConfig::LEN, seeds = [b"config"], bump)]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterInstitution<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Institution::LEN,
        seeds = [b"institution", institution_address.key().as_ref()],
        bump
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        init,
        payer = authority,
        space = 8 + CredentialCounter::LEN,
        seeds = [b"credential_counter", institution_address.key().as_ref()],
        bump
    )]
    pub credential_counter: Account<'info, CredentialCounter>,

    #[account(
        init,
        payer = authority,
        space = 8 + RevocationList::LEN,
        seeds = [b"revocation_list", institution_address.key().as_ref()],
        bump
    )]
    pub revocation_list: Account<'info, RevocationList>,

    #[account(
        seeds = [b"config"],
        bump = program_config.bump,
        constraint = program_config.authority == authority.key() @ error::AcademicSolError::UnauthorizedAuthority
    )]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Solo se usa para pasar la dirección de la institución a registrar (no requiere firma)
    pub institution_address: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct IssueCredential<'info> {
    #[account(
        init,
        payer = institution_signer,
        space = 8 + Credential::LEN,
        seeds = [
            b"credential",
            institution.key().as_ref(),
            &credential_counter.next_id.to_le_bytes()
        ],
        bump
    )]
    pub credential: Account<'info, Credential>,

    #[account(
        seeds = [b"institution", institution_signer.key().as_ref()],
        bump = institution.bump
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        mut,
        seeds = [b"credential_counter", institution_signer.key().as_ref()],
        bump = credential_counter.bump
    )]
    pub credential_counter: Account<'info, CredentialCounter>,

    /// CHECK: Recipient (student)
    pub recipient: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = institution_signer.key() == institution.address @ error::AcademicSolError::InstitutionNotFound
    )]
    pub institution_signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeCredential<'info> {
    #[account(
        mut,
        seeds = [
            b"credential",
            credential.issuer.as_ref(),
            &credential.id.to_le_bytes()
        ],
        bump = credential.bump,
        constraint = credential.issuer == institution.key() @ error::AcademicSolError::InstitutionNotFound
    )]
    pub credential: Account<'info, Credential>,

    #[account(
        seeds = [b"institution", institution_signer.key().as_ref()],
        bump = institution.bump
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        mut,
        seeds = [b"revocation_list", institution_signer.key().as_ref()],
        bump = revocation_list.bump
    )]
    pub revocation_list: Account<'info, RevocationList>,

    #[account(
        mut,
        constraint = institution_signer.key() == institution.address @ error::AcademicSolError::InstitutionNotFound
    )]
    pub institution_signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReissueCredential<'info> {
    #[account(
        init,
        payer = institution_signer,
        space = 8 + Credential::LEN,
        seeds = [
            b"credential",
            institution.key().as_ref(),
            &credential_counter.next_id.to_le_bytes()
        ],
        bump
    )]
    pub credential: Account<'info, Credential>,

    #[account(
        seeds = [b"credential", institution.key().as_ref(), &old_credential.id.to_le_bytes()],
        bump = old_credential.bump
    )]
    pub old_credential: Account<'info, Credential>,

    #[account(
        seeds = [b"institution", institution_signer.key().as_ref()],
        bump = institution.bump
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        mut,
        seeds = [b"credential_counter", institution_signer.key().as_ref()],
        bump = credential_counter.bump
    )]
    pub credential_counter: Account<'info, CredentialCounter>,

    /// CHECK: Recipient
    pub recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub institution_signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
