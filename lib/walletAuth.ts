import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

/**
 * 验证 Solana 钱包签名
 * @param message 原始消息
 * @param signature 签名（base64 编码）
 * @param publicKey 公钥（base58 编码）
 * @returns 验证结果
 */
export function verifyWalletSignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    // 将公钥从 base58 转换为 Uint8Array
    const publicKeyBytes = new PublicKey(publicKey).toBytes();
    
    // 将签名从 base64 转换为 Uint8Array
    const signatureBytes = Buffer.from(signature, 'base64');
    
    // 将消息转换为 Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // 使用 nacl 验证签名
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('签名验证失败:', error);
    return false;
  }
}

/**
 * 生成用于签名的消息
 * @param walletAddress 钱包地址
 * @param timestamp 时间戳
 * @param action 操作类型
 * @returns 签名消息
 */
export function generateSignatureMessage(
  walletAddress: string,
  timestamp: number,
  action: string = 'comment'
): string {
  return `Next Teacher - ${action} - ${walletAddress} - ${timestamp}`;
}

/**
 * 验证时间戳是否在有效范围内（5分钟内）
 * @param timestamp 时间戳
 * @returns 是否有效
 */
export function isTimestampValid(timestamp: number): boolean {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5分钟
  return Math.abs(now - timestamp) <= fiveMinutes;
}
