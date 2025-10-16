import { io } from 'socket.io-client';
import ScratchBlocks from 'scratch-blocks';

const DEFAULTS = {
  socketUrl: 'http://localhost:3000',
  intervalMs: 1000,
  snapCount: 10,
  snapDelayMs: 10
};

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

export default function initLiveCollab({ workspace, vm, socketUrl }) {
  if (!workspace) throw new Error('Workspace required for liveCollab');
  const cfg = { ...DEFAULTS, socketUrl };
  const serialization = ScratchBlocks.serialization.workspaces;
  if (!serialization) throw new Error('scratch-blocks serialization API not found');

  let stopped = false;
  let isLoading = false;
  let sending = false;

  const socket = io(cfg.socketUrl, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => console.log('[liveCollab] connected', socket.id));
  socket.on('disconnect', () => console.log('[liveCollab] disconnected'));

  socket.on('load-data', async (snapshots) => {
    if (stopped || !Array.isArray(snapshots)) return;
    isLoading = true;
    for (let i = 0; i < snapshots.length; i++) {
      workspace.clear();
      serialization.load(snapshots[i], workspace);
      if (vm && typeof vm.rebuildSprites === 'function') vm.rebuildSprites();
      await sleep(cfg.snapDelayMs);
    }
    isLoading = false;
  });

  async function captureAndSendOnce() {
    if (stopped || isLoading || sending) return;
    sending = true;
    const snaps = [];
    for (let i = 0; i < cfg.snapCount; i++) {
      snaps.push(serialization.save(workspace));
      await sleep(cfg.snapDelayMs);
    }
    socket.emit('save-data', snaps);
    sending = false;
  }

  const intervalHandle = setInterval(captureAndSendOnce, cfg.intervalMs);
  captureAndSendOnce(); // first immediate send

  return function stop() {
    stopped = true;
    clearInterval(intervalHandle);
    try { socket.close(); } catch(e) {}
    console.log('[liveCollab] stopped');
  };
}
