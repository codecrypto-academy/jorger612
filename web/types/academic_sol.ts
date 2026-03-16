/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/academic_sol.json`.
 */
export type AcademicSol = {
  "address": "7992aXQLFQBb3MpGJG1tZPq9Ed4owWUK2D4bUiWXsBqQ",
  "metadata": {
    "name": "academicSol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Academic credentials on Solana"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "programConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "issueCredential",
      "discriminator": [
        255,
        193,
        171,
        224,
        68,
        171,
        194,
        87
      ],
      "accounts": [
        {
          "name": "credential",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "institution"
              },
              {
                "kind": "account",
                "path": "credential_counter.next_id",
                "account": "credentialCounter"
              }
            ]
          }
        },
        {
          "name": "institution",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116,
                  105,
                  116,
                  117,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "institution"
              }
            ]
          }
        },
        {
          "name": "credentialCounter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "institution"
              }
            ]
          }
        },
        {
          "name": "recipient"
        },
        {
          "name": "institutionSigner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "credentialType",
          "type": "string"
        },
        {
          "name": "programName",
          "type": "string"
        },
        {
          "name": "documentHash",
          "type": "string"
        },
        {
          "name": "expiryDate",
          "type": "i64"
        }
      ]
    },
    {
      "name": "registerInstitution",
      "discriminator": [
        77,
        234,
        193,
        118,
        107,
        20,
        106,
        52
      ],
      "accounts": [
        {
          "name": "institution",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116,
                  105,
                  116,
                  117,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "institutionSigner"
              }
            ]
          }
        },
        {
          "name": "credentialCounter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "institutionSigner"
              }
            ]
          }
        },
        {
          "name": "revocationList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "institutionSigner"
              }
            ]
          }
        },
        {
          "name": "programConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "institutionSigner",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "location",
          "type": "string"
        },
        {
          "name": "publicKey",
          "type": "string"
        }
      ]
    },
    {
      "name": "reissueCredential",
      "discriminator": [
        245,
        105,
        185,
        254,
        25,
        207,
        57,
        50
      ],
      "accounts": [
        {
          "name": "credential",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "institution"
              },
              {
                "kind": "account",
                "path": "credential_counter.next_id",
                "account": "credentialCounter"
              }
            ]
          }
        },
        {
          "name": "oldCredential",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "institution"
              },
              {
                "kind": "account",
                "path": "old_credential.id",
                "account": "credential"
              }
            ]
          }
        },
        {
          "name": "institution",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116,
                  105,
                  116,
                  117,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "institution"
              }
            ]
          }
        },
        {
          "name": "credentialCounter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "institution"
              }
            ]
          }
        },
        {
          "name": "recipient"
        },
        {
          "name": "institutionSigner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "credentialType",
          "type": "string"
        },
        {
          "name": "programName",
          "type": "string"
        },
        {
          "name": "documentHash",
          "type": "string"
        },
        {
          "name": "expiryDate",
          "type": "i64"
        }
      ]
    },
    {
      "name": "revokeCredential",
      "discriminator": [
        38,
        123,
        95,
        95,
        223,
        158,
        169,
        87
      ],
      "accounts": [
        {
          "name": "credential",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "credential.issuer",
                "account": "credential"
              },
              {
                "kind": "account",
                "path": "credential.id",
                "account": "credential"
              }
            ]
          }
        },
        {
          "name": "institution",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116,
                  105,
                  116,
                  117,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "institution"
              }
            ]
          }
        },
        {
          "name": "revocationList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "institution"
              }
            ]
          }
        },
        {
          "name": "institutionSigner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "reason",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "credential",
      "discriminator": [
        145,
        44,
        68,
        220,
        67,
        46,
        100,
        135
      ]
    },
    {
      "name": "credentialCounter",
      "discriminator": [
        6,
        5,
        210,
        166,
        106,
        63,
        102,
        86
      ]
    },
    {
      "name": "institution",
      "discriminator": [
        178,
        67,
        44,
        135,
        26,
        236,
        199,
        188
      ]
    },
    {
      "name": "programConfig",
      "discriminator": [
        196,
        210,
        90,
        231,
        144,
        149,
        140,
        63
      ]
    },
    {
      "name": "revocationList",
      "discriminator": [
        153,
        67,
        78,
        57,
        216,
        81,
        50,
        213
      ]
    }
  ],
  "events": [
    {
      "name": "credentialIssued",
      "discriminator": [
        194,
        216,
        28,
        159,
        89,
        29,
        72,
        177
      ]
    },
    {
      "name": "credentialRevoked",
      "discriminator": [
        127,
        131,
        241,
        234,
        50,
        139,
        145,
        204
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorizedAuthority",
      "msg": "Only the program authority can perform this action"
    },
    {
      "code": 6001,
      "name": "institutionAlreadyExists",
      "msg": "Institution already registered"
    },
    {
      "code": 6002,
      "name": "institutionNotFound",
      "msg": "Institution not found"
    },
    {
      "code": 6003,
      "name": "credentialNotFound",
      "msg": "Credential not found"
    },
    {
      "code": 6004,
      "name": "credentialAlreadyRevoked",
      "msg": "Credential already revoked"
    },
    {
      "code": 6005,
      "name": "credentialExpired",
      "msg": "Credential has expired"
    },
    {
      "code": 6006,
      "name": "stringTooLong",
      "msg": "String exceeds maximum length"
    },
    {
      "code": 6007,
      "name": "revocationListFull",
      "msg": "Revocation list is full"
    },
    {
      "code": 6008,
      "name": "invalidCredentialStatus",
      "msg": "Invalid credential status"
    }
  ],
  "types": [
    {
      "name": "credential",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "issuer",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "credentialType",
            "type": "string"
          },
          {
            "name": "programName",
            "type": "string"
          },
          {
            "name": "issueDate",
            "type": "i64"
          },
          {
            "name": "expiryDate",
            "type": "i64"
          },
          {
            "name": "documentHash",
            "type": "string"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "credentialStatus"
              }
            }
          },
          {
            "name": "publicKeyIssuer",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "credentialCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "institution",
            "type": "pubkey"
          },
          {
            "name": "nextId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "credentialIssued",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "credentialId",
            "type": "u64"
          },
          {
            "name": "issuer",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "programName",
            "type": "string"
          },
          {
            "name": "issueDate",
            "type": "i64"
          },
          {
            "name": "documentHash",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "credentialRevoked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "credentialId",
            "type": "u64"
          },
          {
            "name": "issuer",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "credentialStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "valid"
          },
          {
            "name": "revoked"
          },
          {
            "name": "expired"
          }
        ]
      }
    },
    {
      "name": "institution",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "location",
            "type": "string"
          },
          {
            "name": "publicKey",
            "type": "string"
          },
          {
            "name": "isVerified",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "programConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "initialized",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "revocationList",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "institution",
            "type": "pubkey"
          },
          {
            "name": "revokedCredentialIds",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
