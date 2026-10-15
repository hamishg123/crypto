import test from 'node:test';
import assert from 'node:assert/strict';
import { maskAddress, validateWalletAddress } from '../public/core.js';

test('rejects an empty or unsupported wallet address', () => {
  assert.equal(validateWalletAddress('XMR', '').valid, false);
  assert.equal(validateWalletAddress('DOGE', 'anything').valid, false);
});

test('recognizes Monero standard and subaddress shapes without claiming ownership verification', () => {
  const standard = `4${'A'.repeat(94)}`;
  const subaddress = `8${'A'.repeat(94)}`;
  assert.match(validateWalletAddress('XMR', standard).message, /does not verify ownership/);
  assert.equal(validateWalletAddress('XMR', subaddress).valid, true);
  assert.equal(validateWalletAddress('XMR', '0'.repeat(95)).valid, false);
});

test('recognizes Bitcoin mainnet address shapes', () => {
  assert.equal(validateWalletAddress('BTC', `1${'A'.repeat(25)}`).valid, true);
  assert.equal(validateWalletAddress('BTC', `bc1${'q'.repeat(38)}`).valid, true);
  assert.equal(validateWalletAddress('BTC', 'not-a-wallet').valid, false);
});

test('recognizes Litecoin mainnet address shapes', () => {
  assert.equal(validateWalletAddress('LTC', `L${'A'.repeat(25)}`).valid, true);
  assert.equal(validateWalletAddress('LTC', `ltc1${'q'.repeat(38)}`).valid, true);
});

test('masks a linked address while preserving only a short prefix and suffix', () => {
  assert.equal(maskAddress('1234567890abcdefghijklmnop'), '1234567…klmnop');
});
