let running = false;
let paused = true;
let dutyPercent = 15;
let sequence = 0;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function run() {
  while (running) {
    if (paused) {
      await sleep(80);
      continue;
    }

    const cycleStarted = performance.now();
    const budgetMs = 160 * (dutyPercent / 100);
    let batch = 0;
    while (running && !paused && performance.now() - cycleStarted < budgetMs) {
      const input = new Uint8Array(8);
      const view = new DataView(input.buffer);
      view.setUint32(0, Math.floor(sequence / 0x100000000));
      view.setUint32(4, sequence >>> 0);
      sequence += 1;
      await crypto.subtle.digest('SHA-256', input);
      batch += 1;
    }
    if (batch) self.postMessage({ type: 'hashes', count: batch });

    const remaining = 160 - (performance.now() - cycleStarted);
    if (remaining > 0 && running && !paused) await sleep(remaining);
  }
}

self.onmessage = (event) => {
  const { type, dutyPercent: requestedDuty } = event.data ?? {};
  if (type === 'start') {
    dutyPercent = Math.min(50, Math.max(10, Number(requestedDuty) || 15));
    if (!running) {
      running = true;
      paused = false;
      run().catch((error) => {
        running = false;
        paused = true;
        self.postMessage({ type: 'error', message: error?.message ?? 'Hash worker failed.' });
      });
    } else {
      paused = false;
    }
  } else if (type === 'pause') {
    paused = true;
  } else if (type === 'resume') {
    dutyPercent = Math.min(50, Math.max(10, Number(requestedDuty) || dutyPercent));
    paused = false;
  } else if (type === 'intensity') {
    dutyPercent = Math.min(50, Math.max(10, Number(requestedDuty) || dutyPercent));
  } else if (type === 'stop') {
    running = false;
    paused = true;
  }
};
