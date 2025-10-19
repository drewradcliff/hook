import crypto from "crypto";

export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = "sha256"
): boolean {
  try {
    // TODO: Support different signature formats
    const parts = signature.split("=");
    const actualSignature = parts.length > 1 ? parts[1] : signature;
    const actualAlgorithm = parts.length > 1 ? parts[0] : algorithm;

    const expectedSignature = crypto
      .createHmac(actualAlgorithm, secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(actualSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    return false;
  }
}
