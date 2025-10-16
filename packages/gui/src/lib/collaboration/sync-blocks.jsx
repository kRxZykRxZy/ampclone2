import { io } from 'socket.io-client';
import * as Y from 'yjs';
import ScratchBlocks from 'scratch-blocks';

const DEFAULTS = { socketUrl: 'http://localhost:3000' };

export default async function initLiveCollab({ workspace, vm, projectId, socketUrl }) {
  if (!io) throw new Error('socket.io-client not found');
  if (!ScratchBlocks) throw new Error('scratch-blocks not found');

  // --- Username ---
  const res = await fetch(`https://ampmod.vercel.app/internalapi/session`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to get session`);
  const username = (await res.json()).username;

  // --- Permission check ---
  const res2 = await fetch(`https://ampmod.vercel.app/internalapi/projects/${projectId}`);
  const projectData = await res2.json();
  if (!projectData.collaborators.includes(username)) return 'User is not a collaborator';

  // --- Yjs Setup ---
  const ydoc = new Y.Doc();
  const yBlocks = ydoc.getMap('blocks');
  const serialization = ScratchBlocks.serialization.workspaces;
  if (!serialization) throw new Error('scratch-blocks serialization API not found');

  // --- Socket.IO ---
  const socket = io(socketUrl || DEFAULTS.socketUrl);
  socket.emit('join-project', projectId);

  socket.on('init', state => Y.applyUpdate(ydoc, state));
  socket.on('update', ({ update }) => Y.applyUpdate(ydoc, update));

  ydoc.on('update', update => socket.emit('update', update));

  // --- Username bubble ---
  function showUsernameBubble(blockSvg, name) {
    if (!blockSvg) return;
    const bubble = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bubble.setAttribute("rx", 5); bubble.setAttribute("ry", 5);
    bubble.setAttribute("fill", "#ffd700"); bubble.setAttribute("stroke", "#333");
    bubble.setAttribute("stroke-width", 1);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = name; text.setAttribute("fill", "#000"); text.setAttribute("font-size", "12px");
    text.setAttribute("x", 5); text.setAttribute("y", 14);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.appendChild(bubble); group.appendChild(text);
    blockSvg.parentNode.appendChild(group);

    const bbox = text.getBBox();
    bubble.setAttribute("width", bbox.width + 10); bubble.setAttribute("height", bbox.height + 4);
    group.setAttribute("transform", `translate(${blockSvg.getBBox().x + blockSvg.getBBox().width + 5}, ${blockSvg.getBBox().y})`);

    setTimeout(() => group.remove(), 3000);
  }

  // --- Apply Yjs changes incrementally ---
  function applyYjsBlockChanges() {
    const existing = new Set(workspace.getAllBlocks().map(b => b.id));
    yBlocks.forEach((blockData, blockId) => {
      if (!workspace.getBlockById(blockId)) serialization.load(blockData.data, workspace);
      if (vm?.rebuildSprites) vm.rebuildSprites();
      const blockSvg = workspace.getBlockById(blockId)?.getSvgRoot();
      if (blockSvg && blockData.username) showUsernameBubble(blockSvg, blockData.username);
      existing.delete(blockId);
    });
    existing.forEach(blockId => { const b = workspace.getBlockById(blockId); if(b) b.dispose(false,true); });
  }
  yBlocks.observe(applyYjsBlockChanges);

  // --- Throttle local changes ---
  let updateTimeout;
  workspace.addChangeListener(event => {
    if (!event.blockIds || (event.type==='create' && !event.blockIds.length)) return;
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      event.blockIds.forEach(blockId => {
        const block = workspace.getBlockById(blockId);
        if (!block) return;
        const xml = serialization.save(block.workspace);
        yBlocks.set(blockId, { data: xml, username });
      });
    }, 50);
  });

  // --- Chat UI ---
  function createChatModal() {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-modal';
    chatContainer.style = `
      position: fixed; bottom: 20px; right: 20px;
      width: 300px; max-height: 400px; background: #fff;
      border: 2px solid #333; border-radius: 8px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000;
    `;
    const header = document.createElement('div');
    header.textContent = 'Chat'; header.style='background:#333;color:#fff;padding:5px;cursor:pointer';
    let expanded = true;
    header.onclick = () => {
      expanded = !expanded;
      messages.style.display = expanded?'block':'none';
      inputContainer.style.display = expanded?'flex':'none';
      chatContainer.style.height = expanded?'400px':'40px';
    };

    const messages = document.createElement('div');
    messages.style='flex:1;overflow-y:auto;padding:5px;font-size:14px;';

    const inputContainer = document.createElement('div');
    inputContainer.style='display:flex;';
    const input = document.createElement('input');
    input.style='flex:1;padding:5px;font-size:14px;';
    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Send'; sendBtn.style='padding:5px;';
    inputContainer.appendChild(input); inputContainer.appendChild(sendBtn);

    sendBtn.onclick = () => {
      const msg = input.value.trim(); if(!msg) return;
      socket.emit('chat-message',{projectId, username, message: msg});
      addMessage(username,msg);
      input.value='';
    };
    function addMessage(user,msg){
      const div = document.createElement('div');
      div.textContent = `${user}: ${msg}`;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    chatContainer.appendChild(header);
    chatContainer.appendChild(messages);
    chatContainer.appendChild(inputContainer);
    document.body.appendChild(chatContainer);

    // Receive messages
    socket.on('chat-message', ({ projectId: pid, username: user, message }) => {
      if(pid !== projectId) return;
      addMessage(user,message);
    });
  }
  createChatModal();

  return function stop() { socket.disconnect(); ydoc.destroy(); console.log('[liveCollab] stopped'); };
}
