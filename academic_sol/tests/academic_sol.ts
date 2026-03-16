import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AcademicSol } from "../target/types/academic_sol";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("academic_sol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = (anchor.workspace as any).academic_sol as Program<AcademicSol>;

  const authority = provider.wallet;
  const institutionKeypair = Keypair.generate();
  const studentKeypair = Keypair.generate();

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const institutionPda = (address: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("institution"), address.toBuffer()],
      program.programId
    )[0];

  const credentialPda = (institution: PublicKey, id: number) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("credential"),
        institution.toBuffer(),
        Buffer.from(new BigUint64Array([BigInt(id)]).buffer),
      ],
      program.programId
    )[0];

  const credentialCounterPda = (institution: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("credential_counter"), institution.toBuffer()],
      program.programId
    )[0];

  const revocationListPda = (institution: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("revocation_list"), institution.toBuffer()],
      program.programId
    )[0];

  before(async () => {
    const sig = await provider.connection.requestAirdrop(
      institutionKeypair.publicKey,
      1e9
    );
    await provider.connection.confirmTransaction(sig);
    const sig2 = await provider.connection.requestAirdrop(
      studentKeypair.publicKey,
      1e9
    );
    await provider.connection.confirmTransaction(sig2);
  });

  it("Initialize program", async () => {
    await program.methods
      .initialize()
      .accounts({
        programConfig: configPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.programConfig.fetch(configPda);
    expect(config.authority.toString()).to.equal(authority.publicKey.toString());
    expect(config.initialized).to.be.true;
  });

  it("Register institution", async () => {
    await program.methods
      .registerInstitution(
        "Universidad Tecnológica",
        "Madrid, España",
        institutionKeypair.publicKey.toString()
      )
      .accounts({
        institution: institutionPda(institutionKeypair.publicKey),
        credentialCounter: credentialCounterPda(institutionKeypair.publicKey),
        revocationList: revocationListPda(institutionKeypair.publicKey),
        programConfig: configPda,
        authority: authority.publicKey,
        institutionAddress: institutionKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const institution = await program.account.institution.fetch(
      institutionPda(institutionKeypair.publicKey)
    );
    expect(institution.name).to.equal("Universidad Tecnológica");
    expect(institution.address.toString()).to.equal(
      institutionKeypair.publicKey.toString()
    );
    expect(institution.isVerified).to.be.true;
  });

  it("Issue credential", async () => {
    const documentHash =
      "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456";
    await program.methods
      .issueCredential(
        "Diploma",
        "Máster en Blockchain",
        documentHash,
        "", // ipfs_cid (empty for test)
        new anchor.BN(0), // no expiry
        new anchor.BN(1704067200) // cert_date: Jan 1 2024
      )
      .accounts({
        credential: credentialPda(
          institutionPda(institutionKeypair.publicKey),
          1
        ),
        institution: institutionPda(institutionKeypair.publicKey),
        credentialCounter: credentialCounterPda(institutionKeypair.publicKey),
        recipient: studentKeypair.publicKey,
        institutionSigner: institutionKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([institutionKeypair])
      .rpc();

    const credPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("credential"),
        institutionPda(institutionKeypair.publicKey).toBuffer(),
        Buffer.from(new BigUint64Array([BigInt(1)]).buffer),
      ],
      program.programId
    )[0];

    const credential = await program.account.credential.fetch(credPda);
    expect(credential.id.toNumber()).to.equal(1);
    expect(credential.recipient.toString()).to.equal(
      studentKeypair.publicKey.toString()
    );
    expect(credential.programName).to.equal("Máster en Blockchain");
    expect(credential.documentHash).to.equal(documentHash);
    expect(credential.status.valid).to.not.be.undefined;
  });

  it("Revoke credential", async () => {
    const credPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("credential"),
        institutionPda(institutionKeypair.publicKey).toBuffer(),
        Buffer.from(new BigUint64Array([BigInt(1)]).buffer),
      ],
      program.programId
    )[0];

    await program.methods
      .revokeCredential("Fraude académico")
      .accounts({
        credential: credPda,
        institution: institutionPda(institutionKeypair.publicKey),
        revocationList: revocationListPda(institutionKeypair.publicKey),
        institutionSigner: institutionKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([institutionKeypair])
      .rpc();

    const credential = await program.account.credential.fetch(credPda);
    expect(credential.status.revoked).to.not.be.undefined;

    const revocationList = await program.account.revocationList.fetch(
      revocationListPda(institutionKeypair.publicKey)
    );
    expect(revocationList.revokedCredentialIds.length).to.equal(1);
    expect(revocationList.revokedCredentialIds[0].toNumber()).to.equal(1);
  });

  it("Reissue credential", async () => {
    const oldCredPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("credential"),
        institutionPda(institutionKeypair.publicKey).toBuffer(),
        Buffer.from(new BigUint64Array([BigInt(1)]).buffer),
      ],
      program.programId
    )[0];

    const newDocumentHash =
      "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123457";
    const counter = await program.account.credentialCounter.fetch(
      credentialCounterPda(institutionKeypair.publicKey)
    );
    const nextId = counter.nextId.toNumber();

    const newCredPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("credential"),
        institutionPda(institutionKeypair.publicKey).toBuffer(),
        Buffer.from(new BigUint64Array([BigInt(nextId)]).buffer),
      ],
      program.programId
    )[0];

    await program.methods
      .reissueCredential(
        "Diploma",
        "Máster en Blockchain",
        newDocumentHash,
        "", // ipfs_cid (empty for test)
        new anchor.BN(0),
        new anchor.BN(1704067200) // cert_date: Jan 1 2024
      )
      .accounts({
        credential: newCredPda,
        oldCredential: oldCredPda,
        institution: institutionPda(institutionKeypair.publicKey),
        credentialCounter: credentialCounterPda(institutionKeypair.publicKey),
        recipient: studentKeypair.publicKey,
        institutionSigner: institutionKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([institutionKeypair])
      .rpc();

    const newCredential = await program.account.credential.fetch(newCredPda);
    expect(newCredential.id.toNumber()).to.equal(nextId);
    expect(newCredential.documentHash).to.equal(newDocumentHash);
    expect(newCredential.status.valid).to.not.be.undefined;
  });
});
