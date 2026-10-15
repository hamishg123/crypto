# Fieldnote — Crypto Mining Research

A consent-first research dashboard and in-browser hashing benchmark. This project is intentionally **not a production cryptocurrency miner**: the browser worker runs local SHA-256 hashes to demonstrate a throttled workload. It does not run RandomX, connect to Monero or another blockchain, connect to a pool, submit shares, find blocks, or earn coins.

## Research finding

Among the illustrative assets compared in the interface, Monero is the most suitable **CPU-oriented proof-of-work candidate to study** because the Monero Project describes RandomX as CPU-optimized and intended to discourage specialized ASICs. This is not a profitability recommendation. A browser implementation is not equivalent to a native RandomX miner, and this app has no live market, network difficulty, electricity tariff, pool-fee, or payout data.

Bitcoin uses competitive proof-of-work and is not a practical browser-CPU mining candidate. Ethereum switched to proof-of-stake in 2022 and is no longer mined by proof-of-work. See the primary sources linked in the website and below.

## Browser benchmark

The benchmark uses a Web Worker and Web Crypto SHA-256, defaulting to a 15% duty-cycle target and allowing 10–50%. This is a scheduler target, **not a measurement of device CPU load**. The user must check a consent box and press Start. The user can pause, resume, change the duty target, or stop. It pauses automatically when the tab is hidden and terminates when the page unloads. Browser and device scheduling mean actual performance, battery draw, and heat vary.

The telemetry reports local hashes and a local rate. Network shares and earnings are deliberately reported as unavailable/not applicable. It does not fabricate accepted shares, payout progress, or pool connectivity.

## Wallet address demo

An optional manually entered public receiving address is shape-checked, shown in a confirmation dialog, and stored in `localStorage` on the current browser profile. Only Monero, Bitcoin, and Litecoin mainnet address formats are supported. Validation does not verify checksum, ownership, network acceptance, or payout compatibility. The prototype does not connect to wallet software, request wallet permissions, or send an address to a server. Never enter a private key or recovery phrase.

## Run locally

Requires Node.js 22 or newer; no package installation is needed.

```sh
npm start
```

Open `http://localhost:3000`. Run source checks and unit tests with:

```sh
npm run check
```

## Primary references

- Monero Project, [Mining Monero](https://www.getmonero.org/get-started/mining/)
- Monero Project, [RandomX](https://www.getmonero.org/resources/moneropedia/randomx.html)
- Bitcoin.org, [How does Bitcoin work?](https://bitcoin.org/en/how-it-works)
- Ethereum.org, [Proof-of-stake](https://ethereum.org/developers/docs/consensus-mechanisms/pos/)
