import crypto from "node:crypto";
import { SignJWT, importJWK } from "jose";

interface PowerSyncKeys {
  privateKey: {
    alg: string;
    kid: string;
    // biome-ignore lint/suspicious/noExplicitAny: code from powersync. don't want to deal with it
    key: any;
  } | null;
  publicKey: string | null;
}

const keys: PowerSyncKeys = {
  privateKey: null,
  publicKey: null,
};

export async function ensureKeys(config: {
  privateKey?: string;
  publicKey?: string;
}) {
  // Keys are loaded already
  if (keys.privateKey) {
    return keys;
  }

  if (!config.privateKey || !config.publicKey) {
    throw new Error("Private and public keys are not provided");
  }

  const base64Keys = {
    private: config.privateKey,
    public: config.publicKey,
  };

  if (!base64Keys.private) {
    const generated = generateKeyPair();
    base64Keys.private = generated.privateBase64;
    base64Keys.public = generated.publicBase64;
  }

  const decodedPrivateKey = Buffer.from(base64Keys.private, "base64");
  const powerSyncPrivateKey = JSON.parse(
    new TextDecoder().decode(decodedPrivateKey),
  );
  keys.privateKey = {
    alg: powerSyncPrivateKey.alg,
    kid: powerSyncPrivateKey.kid,
    key: await importJWK(powerSyncPrivateKey),
  };

  const decodedPublicKey = Buffer.from(base64Keys.public, "base64");
  keys.publicKey = JSON.parse(new TextDecoder().decode(decodedPublicKey));

  return keys;
}

export function getPowerSyncPublicKey() {
  return keys.publicKey;
}

export async function generatePowerSyncToken(
  userId: string,
  config: {
    audience: string;
    url: string;
  },
) {
  const powerSyncKey = keys.privateKey;
  if (!powerSyncKey) {
    throw new Error("PowerSync keys not initialized");
  }

  const token = await new SignJWT({})
    .setProtectedHeader({
      alg: powerSyncKey.alg,
      kid: powerSyncKey.kid,
    })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(config.audience)
    .setAudience(config.audience)
    .setExpirationTime("5m")
    .sign(powerSyncKey.key);

  return {
    token,
    powersyncUrl: config.url,
    userId,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

function generateKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  const privateBase64 = Buffer.from(privateKey).toString("base64");
  const publicBase64 = Buffer.from(publicKey).toString("base64");

  return {
    privateBase64,
    publicBase64,
  };
}
