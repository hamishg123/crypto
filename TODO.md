# TODO

## Research and recommendation
- [x] Compare cryptocurrencies suitable for the requested browser-mining experience. Explain the recommendation using algorithm, CPU/browser suitability, network/hardware competition, device/electricity impact, uncertainty, and risk; distinguish a browser-learning candidate from a claim of current profitability.
- [x] Explain the recommendation's assumptions and show current live/real profitability and market context as unavailable unless backed by a configured data source; do not invent live values.

## Browser mining workspace
- [x] Provide a browser-based mining-style workspace with explicit opt-in and visible start, pause, resume, and stop controls; mining must never begin automatically or continue without a clearly visible active state.
- [x] Use conservative resource defaults and adjustable CPU/resource-use control with safeguards to keep the interface responsive.
- [x] Show session hash rate, accepted/rejected work, elapsed time, estimated earnings, CPU load, and connection state honestly; clearly distinguish a local benchmark or simulation from network mining, pool shares, and real earnings whenever real mining is not configured.
- [x] Provide responsive error, unsupported-browser, thermal/performance-warning, disconnected, and stopped states.
- [ ] Perform actual RandomX mining and submit shares to an explicitly configured, approved pool/bridge; only show accepted/rejected shares or payout information when verified by that service. Keep this open until a compatible bridge and pool are authorized and operational.

## Wallet and payout status
- [x] Let users select cryptocurrency/network and enter a public wallet address; validate the format, confirm the destination, mask it after linking, and allow edit and unlink actions.
- [x] Never request or store private keys or seed phrases. Do not imply that linking a public address by itself enables mining or payouts.
- [x] Show payout threshold/progress, destination, history or pending status, and block-explorer links only when payout data exists; otherwise label payout data unavailable/not configured.

## Transparency and alerts
- [x] Disclose how browser mining works, device/electricity impact, uncertain payouts, fees, pool/operator details, and privacy; require a prominent consent acknowledgement before activation.
- [x] Provide opt-in browser notifications for supported mining/payout events; notifications must be requested only following a user action and degrade gracefully when unavailable or denied.

## GitHub delivery
- [x] Deliver the working website code in a new GitHub repository named `crypto` on the user's account, using the authorized repository-connection flow and preserving the Manus project checkpoint history.
- [ ] Serve the app at `https://hamishg123.github.io/crypto/` with all HTML, CSS, JavaScript, worker, and favicon paths resolving under the `/crypto/` repository subpath; the URL must render the app rather than GitHub's README.
