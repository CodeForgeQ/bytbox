// terminal.js - Core terminal with editor, rain, train, and global sounds

const SOUNDS = {
  keystroke: [
    new Howl({ src: ['assets/sounds/keystroke1.wav'], volume: 0.3 }),
    new Howl({ src: ['assets/sounds/keystroke2.wav'], volume: 0.3 }),
    new Howl({ src: ['assets/sounds/keystroke3.wav'], volume: 0.3 })
  ],
  return: new Howl({ src: ['assets/sounds/return.wav'], volume: 0.4 }),
  space: new Howl({ src: ['assets/sounds/space.wav'], volume: 0.3 }),
  backspace: new Howl({ src: ['assets/sounds/backspace.wav'], volume: 0.3 }),
  startup: new Howl({ src: ['assets/sounds/startup.wav'], volume: 0.5 }),
  hdd: new Howl({ src: ['assets/sounds/hdd.wav'], volume: 0.4, loop: true }),
  hddSpinup: new Howl({ src: ['assets/sounds/hdd_spinup.wav'], volume: 0.5 }),
  modem: new Howl({ src: ['assets/sounds/modem.wav'], volume: 0.6 }),
  error: new Howl({ src: ['assets/sounds/error.wav'], volume: 0.5 }),
  success: new Howl({ src: ['assets/sounds/success.wav'], volume: 0.5 }),
  click: new Howl({ src: ['assets/sounds/click.wav'], volume: 0.4 }),
  overheat: new Howl({ src: ['assets/sounds/overheat.wav'], volume: 0.7 }),
  ambient: new Howl({ src: ['assets/sounds/ambient_noise.wav'], volume: 0.08, loop: true }),
  linux: new Howl({ src: ['assets/sounds/linux.wav'], volume: 0.5, loop: true }),
  macos: new Howl({ src: ['assets/sounds/macos.wav'], volume: 0.6 }),
  fart: new Howl({ src: ['assets/sounds/fart.wav'], volume: 0.7, loop: true }),
  npm: new Howl({ src: ['assets/sounds/npm.wav'], volume: 0.6 }),
  explosion: new Howl({ src: ['assets/sounds/npm.wav'], volume: 0.8, loop: true }) // endless explosion
};

// Start ambient background noise
SOUNDS.ambient.play();

// Pick a random keystroke sound
function playRandomKeystroke() {
  const s = SOUNDS.keystroke[Math.floor(Math.random() * SOUNDS.keystroke.length)];
  s.play();
}

const terminal = document.getElementById('terminal');
let commandHistory = [];
let historyIndex = -1;

// ----- Editor state -----
let editorMode = false;
let editorNode = null;
let editorFileName = '';
let editorTextLines = [];
let editorCursorX = 0;
let editorCursorY = 0;
let editorKeyHandler = null;

// ----- Rain state -----
let rainActive = false;
let rainCanvas = null;
let rainCtx = null;
let rainAnimationId = null;
const rainChars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const rainFontSize = 16;

// ----- Counter for consecutive get/npm install (triggers BSOD) -----
let consecutiveGetNpmCount = 0;

// Start Matrix rain effect
function startRain() {
  if (rainActive) return;
  rainActive = true;

  rainCanvas = document.createElement('canvas');
  rainCanvas.id = 'rainCanvas';
  rainCanvas.style.position = 'absolute';
  rainCanvas.style.top = '0';
  rainCanvas.style.left = '0';
  rainCanvas.style.width = '100%';
  rainCanvas.style.height = '100%';
  rainCanvas.style.zIndex = '10';
  rainCanvas.style.pointerEvents = 'none';
  terminal.appendChild(rainCanvas);

  rainCanvas.width = terminal.clientWidth;
  rainCanvas.height = terminal.clientHeight;
  rainCtx = rainCanvas.getContext('2d');

  const columns = Math.floor(rainCanvas.width / rainFontSize) + 1;
  const drops = new Array(columns).fill(1);

  function draw() {
    if (!rainActive) return;
    rainCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    rainCtx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
    rainCtx.fillStyle = '#0F0';
    rainCtx.font = rainFontSize + 'px monospace';
    for (let i = 0; i < drops.length; i++) {
      const text = rainChars[Math.floor(Math.random() * rainChars.length)];
      rainCtx.fillText(text, i * rainFontSize, drops[i] * rainFontSize);
      if (drops[i] * rainFontSize > rainCanvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    rainCtx.fillStyle = '#0F0';
    rainCtx.font = '10px monospace';
    rainCtx.fillText('Press any key to exit', 10, rainCanvas.height - 10);
    rainAnimationId = requestAnimationFrame(draw);
  }

  draw();

  function stopRainHandler(e) {
    if (rainActive) {
      stopRain();
      document.removeEventListener('keydown', stopRainHandler);
      e.preventDefault();
    }
  }
  document.addEventListener('keydown', stopRainHandler);
}

function stopRain() {
  if (!rainActive) return;
  rainActive = false;
  if (rainAnimationId) cancelAnimationFrame(rainAnimationId);
  if (rainCanvas && rainCanvas.parentNode) {
    rainCanvas.parentNode.removeChild(rainCanvas);
  }
  rainCanvas = null;
  rainCtx = null;
  document.getElementById('command-input').focus();
}

// ----- Train animation (sl command) -----
let slActive = false;
let slCanvas = null;
let slCtx = null;
let slPos = 0;
let slInterval = null;

function startSlAnimation() {
  if (slActive) return;
  slActive = true;

  slCanvas = document.createElement('canvas');
  slCanvas.id = 'slCanvas';
  slCanvas.style.position = 'absolute';
  slCanvas.style.top = '0';
  slCanvas.style.left = '0';
  slCanvas.style.width = '100%';
  slCanvas.style.height = '100%';
  slCanvas.style.zIndex = '15';
  slCanvas.style.pointerEvents = 'none';
  terminal.appendChild(slCanvas);

  slCanvas.width = terminal.clientWidth;
  slCanvas.height = terminal.clientHeight;
  slCtx = slCanvas.getContext('2d');

  const trainASCII = [
    "                        (@@@)",
    "        ____  __________@@@@@",
    "      _/___\\/__________@@@@@@",
    "     [_______]=======@@@@@@@",
    "      |  _  |        @@@@@",
    "      | | | |        @@@",
    "     ===================",
    "      |  ___  |",
    "      |_|___|_|",
    "      |_______|",
  ];
  const fontSize = 14;
  slCtx.font = fontSize + 'px monospace';
  slCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || '#00ff41';

  slPos = slCanvas.width; // start from right edge

  function drawTrain() {
    if (!slActive) return;
    slCtx.clearRect(0, 0, slCanvas.width, slCanvas.height);
    const yStart = slCanvas.height / 2 - (trainASCII.length * fontSize) / 2;
    for (let i = 0; i < trainASCII.length; i++) {
      slCtx.fillText(trainASCII[i], slPos, yStart + i * fontSize);
    }
    slPos -= 2;
    if (slPos < -300) {
      stopSl();
      document.getElementById('command-input').focus();
      return;
    }
    slInterval = requestAnimationFrame(drawTrain);
  }

  drawTrain();

  function stopSlHandler(e) {
    if (slActive) {
      stopSl();
      document.removeEventListener('keydown', stopSlHandler);
      e.preventDefault();
    }
  }
  document.addEventListener('keydown', stopSlHandler);
}

function stopSl() {
  if (!slActive) return;
  slActive = false;
  if (slInterval) cancelAnimationFrame(slInterval);
  if (slCanvas && slCanvas.parentNode) {
    slCanvas.parentNode.removeChild(slCanvas);
  }
  slCanvas = null;
  slCtx = null;
  document.getElementById('command-input').focus();
}

// ----- Terminal initialization -----
function initTerminal() {
  const outputDiv = document.createElement('div');
  outputDiv.className = 'output';
  outputDiv.id = 'output';
  terminal.appendChild(outputDiv);

  const inputLine = document.createElement('div');
  inputLine.className = 'input-line';

  const prompt = document.createElement('span');
  prompt.className = 'prompt';
  prompt.innerHTML = getPrompt();

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'command-input';
  input.autofocus = true;
  input.autocomplete = 'off';
  input.spellcheck = false;

  inputLine.appendChild(prompt);
  inputLine.appendChild(input);
  terminal.appendChild(inputLine);

  input.addEventListener('keydown', handleKeyDown);
  input.addEventListener('keydown', handleKeySounds);

  terminal.addEventListener('click', () => {
    if (!editorMode && !rainActive && !slActive) input.focus();
  });

  writeOutput('BytBox OS v1.0.1 (tty1)');
  writeOutput('Type "info" for available commands.');
  writeOutput('');

  input.focus();
  if (typeof applyTheme === 'function') applyTheme();
}

function handleKeySounds(e) {
  if (editorMode || rainActive || slActive) return;
  if (e.key === 'Enter') SOUNDS.return.play();
  else if (e.key === 'Backspace') SOUNDS.backspace.play();
  else if (e.key === ' ') SOUNDS.space.play();
  else if (e.key.length === 1) playRandomKeystroke();
}

function handleKeyDown(e) {
  if (editorMode || rainActive || slActive) return;

  const input = e.target;
  if (e.key === 'Tab') {
    e.preventDefault();
    const inputText = input.value.trim().split(' ')[0];
    if (!inputText) return;
    const avail = Object.keys(window.commands);
    const matches = avail.filter(cmd => cmd.startsWith(inputText));
    if (matches.length === 1) {
      const rest = input.value.trim().slice(inputText.length);
      input.value = matches[0] + rest;
      setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
    } else if (matches.length > 1) {
      writeOutput('Possible commands: ' + matches.join(', '));
      scrollToBottom();
    }
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const text = input.value.trim();
    input.value = '';
    if (!text) return;
    commandHistory.push(text);
    historyIndex = commandHistory.length;
    writeOutput(getPrompt() + text);
    const result = processCommand(text);
    if (result && typeof result === 'string' && result !== '') writeOutput(result);
    if (result instanceof Promise) {
      result.then(res => { if (res) writeOutput(res); });
    }
    updatePromptDisplay();
    scrollToBottom();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      input.value = commandHistory[historyIndex];
      setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      input.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      input.value = '';
    }
  }
}

// ----- Editor mode (tiny) -----
function startEditorMode(node, fileName) {
  editorMode = true;
  editorNode = node;
  editorFileName = fileName;
  editorTextLines = (node.content || '').split('\n');
  editorCursorX = 0;
  editorCursorY = 0;

  const input = document.getElementById('command-input');
  input.style.display = 'none';
  document.querySelector('.input-line .prompt').style.display = 'none';

  const editorDiv = document.createElement('div');
  editorDiv.id = 'editor-overlay';
  editorDiv.tabIndex = -1;
  editorDiv.style.cssText = `white-space: pre; padding: 10px; background: var(--bg-color); color: var(--text-color); font-family: inherit; height: calc(100% - 70px); overflow-y: auto; outline: none;`;
  terminal.appendChild(editorDiv);

  const helpBar = document.createElement('div');
  helpBar.id = 'nano-helpbar';
  helpBar.style.cssText = `position: absolute; bottom: 0; left: 20px; right: 20px; height: 30px; background: var(--bg-color); border-top: 1px solid var(--text-color); color: var(--text-color); font-size: 10px; display: flex; align-items: center; justify-content: center; gap: 20px; font-family: inherit;`;
  helpBar.innerHTML = `<span>^S Save</span> <span>^X Exit</span> <span>Arrows: Move</span>`;
  terminal.appendChild(helpBar);

  renderEditor(editorDiv);
  editorDiv.focus();

  editorKeyHandler = (e) => handleGlobalEditorKeys(e);
  document.addEventListener('keydown', editorKeyHandler);
}

function handleGlobalEditorKeys(e) {
  if (!editorMode) return;
  e.preventDefault();

  if (e.ctrlKey && e.key === 's') {
    editorNode.content = editorTextLines.join('\n');
    SOUNDS.success.play();
    writeOutput(`[ Saved ${editorFileName} ]`);
    return;
  }
  if (e.ctrlKey && e.key === 'x') {
    exitEditor();
    return;
  }
  if (e.key === 'ArrowUp') { if (editorCursorY > 0) editorCursorY--; }
  else if (e.key === 'ArrowDown') { if (editorCursorY < editorTextLines.length - 1) editorCursorY++; }
  else if (e.key === 'ArrowLeft') { if (editorCursorX > 0) editorCursorX--; }
  else if (e.key === 'ArrowRight') { if (editorCursorX < (editorTextLines[editorCursorY] || '').length) editorCursorX++; }
  else if (e.key === 'Backspace') {
    const line = editorTextLines[editorCursorY];
    if (editorCursorX > 0) {
      editorTextLines[editorCursorY] = line.slice(0, editorCursorX-1) + line.slice(editorCursorX);
      editorCursorX--;
    } else if (editorCursorY > 0) {
      const prevLine = editorTextLines[editorCursorY-1];
      editorCursorX = prevLine.length;
      editorTextLines[editorCursorY-1] = prevLine + line;
      editorTextLines.splice(editorCursorY, 1);
      editorCursorY--;
    }
  }
  else if (e.key === 'Enter') {
    const line = editorTextLines[editorCursorY];
    const before = line.slice(0, editorCursorX);
    const after = line.slice(editorCursorX);
    editorTextLines[editorCursorY] = before;
    editorTextLines.splice(editorCursorY+1, 0, after);
    editorCursorY++;
    editorCursorX = 0;
  }
  else if (e.key.length === 1) {
    const line = editorTextLines[editorCursorY] || '';
    editorTextLines[editorCursorY] = line.slice(0, editorCursorX) + e.key + line.slice(editorCursorX);
    editorCursorX++;
  }
  renderEditor(document.getElementById('editor-overlay'));
}

function renderEditor(container) {
  if (!container) return;
  let html = '';
  for (let i = 0; i < editorTextLines.length; i++) {
    if (i === editorCursorY) {
      const before = escapeHtml(editorTextLines[i].slice(0, editorCursorX));
      const cursor = editorCursorX < editorTextLines[i].length ? escapeHtml(editorTextLines[i][editorCursorX]) : ' ';
      const after = escapeHtml(editorTextLines[i].slice(editorCursorX+1));
      html += `<div>${before}<span class="blink" style="background:var(--text-color);color:var(--bg-color)">${cursor}</span>${after}</div>`;
    } else {
      html += `<div>${escapeHtml(editorTextLines[i])}</div>`;
    }
  }
  container.innerHTML = html;
}

function exitEditor() {
  editorNode.content = editorTextLines.join('\n');
  editorMode = false;
  editorNode = null;
  editorFileName = '';
  document.removeEventListener('keydown', editorKeyHandler);
  editorKeyHandler = null;

  const input = document.getElementById('command-input');
  input.style.display = '';
  document.querySelector('.input-line .prompt').style.display = '';

  const overlay = document.getElementById('editor-overlay');
  if (overlay) overlay.remove();
  const helpBar = document.getElementById('nano-helpbar');
  if (helpBar) helpBar.remove();

  input.focus();
  updatePromptDisplay();
}

// ----- Command processor -----
function processCommand(input) {
  const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const cmdName = parts[0].toLowerCase();
  const args = parts.slice(1).map(arg => arg.replace(/^"|"$/g, ''));

  // BSOD easter egg: if get or npm install is called 3 times consecutively
  if (cmdName === 'get' || cmdName === 'npm') {
    consecutiveGetNpmCount++;
    if (consecutiveGetNpmCount >= 3) {
      consecutiveGetNpmCount = 0;
      if (typeof window.commands.bsod === 'function') {
        window.commands.bsod();
      }
      return 'Kernel panic: too many installations.';
    }
  } else {
    consecutiveGetNpmCount = 0;
  }

  if (typeof window.commands !== 'undefined' && cmdName in window.commands) {
    try {
      const result = window.commands[cmdName](args);
      if (result instanceof Promise) {
        result.then(res => {
          if (typeof res === 'string' && res !== '') writeOutput(res);
        }).catch(err => {
          writeOutput(`Error: ${err}`);
          SOUNDS.error.play();
        });
        return '';
      } else {
        return result || '';
      }
    } catch (e) {
      SOUNDS.error.play();
      return `Error: ${e.message}`;
    }
  } else {
    SOUNDS.error.play();
    return `command not found: ${cmdName}`;
  }
}

function writeOutput(text) {
  const output = document.getElementById('output');
  if (!output) return;
  const line = document.createElement('div');
  line.textContent = text;
  output.appendChild(line);
}

function writeHTML(html) {
  const output = document.getElementById('output');
  if (!output) return;
  const div = document.createElement('div');
  div.innerHTML = html;
  output.appendChild(div);
}

function scrollToBottom() {
  terminal.scrollTop = terminal.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.commands === 'undefined') window.commands = {};
  if (!window.commands.info) {
    window.commands.info = () => 'Available: info, wipe, say';
  }
  if (!window.commands.wipe) {
    window.commands.wipe = () => { document.getElementById('output').innerHTML = ''; return ''; };
  }
  initTerminal();
});