export const COINS = {
  XMR: { name: 'Monero', network: 'Monero mainnet', symbol: 'XMR' },
  BTC: { name: 'Bitcoin', network: 'Bitcoin mainnet', symbol: 'BTC' },
  LTC: { name: 'Litecoin', network: 'Litecoin mainnet', symbol: 'LTC' },
};

const MONERO_BASE58 = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
const BITCOIN_BECH32 = /^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7]+$/;
const LITECOIN_BECH32 = /^ltc1[qpzry9x8gf2tvdw0s3jn54khce6mua7]+$/;
const BASE58 = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

export function validateWalletAddress(coin, rawAddress) {
  const address = String(rawAddress ?? '').trim();
  if (!address) return { valid: false, message: 'Enter a public wallet address.' };

  if (coin === 'XMR') {
    const shapeLooksValid = MONERO_BASE58.test(address)
      && ((address.length === 95 && /^[48]/.test(address))
        || (address.length === 106 && address.startsWith('4')));
    return shapeLooksValid
      ? { valid: true, message: 'Address shape looks valid. This does not verify ownership or network acceptance.' }
      : { valid: false, message: 'That does not look like a Monero mainnet address (95-character standard/subaddress or 106-character integrated address).' };
  }

  if (coin === 'BTC') {
    const isBech32 = BITCOIN_BECH32.test(address.toLowerCase())
      && address.length >= 14 && address.length <= 74
      && !(address !== address.toLowerCase() && address !== address.toUpperCase());
    const isLegacy = BASE58.test(address) && /^[13]/.test(address)
      && address.length >= 26 && address.length <= 35;
    return isBech32 || isLegacy
      ? { valid: true, message: 'Address shape looks valid. This does not verify ownership or network acceptance.' }
      : { valid: false, message: 'That does not look like a Bitcoin mainnet address.' };
  }

  if (coin === 'LTC') {
    const lower = address.toLowerCase();
    const isBech32 = LITECOIN_BECH32.test(lower)
      && address.length >= 14 && address.length <= 74
      && !(address !== address.toLowerCase() && address !== address.toUpperCase());
    const isLegacy = BASE58.test(address) && /^[LM3]/.test(address)
      && address.length >= 26 && address.length <= 35;
    return isBech32 || isLegacy
      ? { valid: true, message: 'Address shape looks valid. This does not verify ownership or network acceptance.' }
      : { valid: false, message: 'That does not look like a Litecoin mainnet address.' };
  }

  return { valid: false, message: 'Choose a supported cryptocurrency.' };
}

export function maskAddress(address) {
  if (!address || address.length < 16) return '••••••••';
  return `${address.slice(0, 7)}…${address.slice(-6)}`;
}
