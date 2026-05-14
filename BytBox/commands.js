// commands.js - BytBox command definitions with easter eggs

// ========== THEME ==========
const defaultTheme = {
  text: '#00ff41',
  background: '#0a0a0a',
  cow: '#00ff41',
  progress: '#00ff41'
};

let currentTheme = JSON.parse(localStorage.getItem('bytbox-theme')) || { ...defaultTheme };

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty('--text-color', currentTheme.text);
  root.style.setProperty('--bg-color', currentTheme.background);
  root.style.setProperty('--cow-color', currentTheme.cow);
  root.style.setProperty('--progress-color', currentTheme.progress);
  const input = document.getElementById('command-input');
  if (input) {
    input.style.color = currentTheme.text;
    input.style.caretColor = currentTheme.text;
  }
  document.querySelectorAll('#terminal .prompt').forEach(p => p.style.color = currentTheme.text);
}

applyTheme();

function saveTheme() {
  localStorage.setItem('bytbox-theme', JSON.stringify(currentTheme));
  applyTheme();
}

// ========== VIRTUAL FILESYSTEM ==========
const FS = {
  '~': {
    type: 'dir',
    children: {
      'home': {
        type: 'dir',
        children: {
          'user': {
            type: 'dir',
            children: {}
          }
        }
      },
      'etc': {
        type: 'dir',
        children: {
          'sumoers': {
            type: 'file',
            content: 'root ALL=(ALL) ALL\nuser ALL=(ALL) ALL\n'
          }
        }
      },
      'tmp': {
        type: 'dir',
        children: {}
      }
    }
  }
};

const ROOT_NODE = FS['~'];
let currentDir = ['~', 'home', 'user'];

function getCurrentNode() {
  return getNodeAtPath(ROOT_NODE, currentDir);
}

function getFullPathString() {
  return pathToString(currentDir);
}

function listDir(node) {
  if (node.type !== 'dir') return '';
  const names = Object.keys(node.children).sort();
  if (names.length === 0) return '(empty)';
  return names.map(name => {
    const child = node.children[name];
    return child.type === 'dir' ? name + '/' : name;
  }).join('  ');
}

// ========== USERS & SUMO ==========
let currentUser = 'user';
let sandwichCount = 0;

function isSumoer(user) {
  const sumoersNode = getNodeAtPath(ROOT_NODE, ['~', 'etc', 'sumoers']);
  if (!sumoersNode || sumoersNode.type !== 'file') return false;
  const lines = sumoersNode.content.split('\n');
  return lines.some(line => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return false;
    if (!trimmed.startsWith(user + ' ')) return false;
    const rest = trimmed.substring(user.length).trim();
    return rest === 'ALL=(ALL) ALL';
  });
}

function getPrompt() {
  return `${currentUser}@bytbox:${getFullPathString()}$ `;
}

function updatePromptDisplay() {
  const promptSpan = document.querySelector('#terminal .prompt');
  if (promptSpan) {
    promptSpan.innerHTML = getPrompt();
  }
}

const users = {
  root: { password: '' },
  user: { password: '' }
};

// ========== COMMAND DEFINITIONS ==========
window.commands = {
  info() {
    return `BytBox commands:
  info, wipe, say [text], now, me, specs, rain,
  moo [msg], get [opts], paint, sumo [cmd], become [user],
  where, go [dir], look [dir], mk <dir>, kick <file>, yeet <path>,
  slide <src> <dst>, dog <file>, tiny <file>, clone <src> <dst>,
  adduser <name>, setpass <user>, past, luck, restart, halt,
  rickroll, slot, rm [args], npm [install], sl, destroy, bsod, hack,
  kill, sudo make me a sandwich (just try it)`;
  },

  wipe() {
    const output = document.getElementById('output');
    if (output) output.innerHTML = '';
    return '';
  },

  say(args) { return args.join(' ') || ''; },
  now() { return new Date().toString(); },
  me() { return currentUser; },

  specs() {
    const ascii = `
    ██████╗ ██╗   ██╗████████╗██████╗  ██████╗ ██╗  ██╗
    ██╔══██╗╚██╗ ██╔╝╚══██╔══╝██╔══██╗██╔═══██╗╚██╗██╔╝
    ██████╔╝ ╚████╔╝    ██║   ██████╔╝██║   ██║ ╚███╔╝ 
    ██╔══██╗  ╚██╔╝     ██║   ██╔══██╗██║   ██║ ██╔██╗ 
    ██████╔╝   ██║      ██║   ██║  ██║╚██████╔╝██╔╝ ██╗
    ╚═════╝    ╚═╝      ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝
    `;
    return ascii + '\n' + [
      `OS: BytBox OS v1.0.1`,
      `User: ${currentUser}`,
      `Uptime: ${Math.floor(Math.random() * 100)} hours`,
      `Theme: ${currentTheme.text}`
    ].join('\n');
  },

  rain() { startRain(); return ''; },

  moo(args) {
    const message = args.join(' ') || 'Hello, BytBox!';
    const bubbleWidth = message.length + 2;
    const topLine = ' ' + '_'.repeat(bubbleWidth);
    const bottomLine = ' ' + '-'.repeat(bubbleWidth);
    const cow = `
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
    `;
    return currentTheme.cow !== defaultTheme.cow
      ? `${topLine}\n< ${message} >\n${bottomLine}\n<span style="color:${currentTheme.cow}">${cow}</span>`
      : `${topLine}\n< ${message} >\n${bottomLine}${cow}`;
  },

  // ---- File system commands ----
  where() { return getFullPathString(); },
  go(args) {
    const target = args.length > 0 ? args[0] : '~';
    const newPath = resolvePath(target, currentDir);
    const node = getNodeAtPath(ROOT_NODE, newPath);
    if (!node || node.type !== 'dir') { SOUNDS.error.play(); return `go: no such directory: ${target}`; }
    currentDir = newPath;
    updatePromptDisplay();
    return '';
  },
  look(args) {
    const target = args.length > 0 ? args[0] : '.';
    const targetPath = resolvePath(target, currentDir);
    const node = getNodeAtPath(ROOT_NODE, targetPath);
    if (!node || node.type !== 'dir') { SOUNDS.error.play(); return `look: cannot access '${target}': No such directory`; }
    return listDir(node);
  },
  mk(args) {
    if (args.length === 0) return 'mk: missing operand';
    const targetPath = resolvePath(args[0], currentDir);
    const info = getParentAndName(ROOT_NODE, targetPath);
    if (!info) { SOUNDS.error.play(); return `mk: cannot create directory '${args[0]}': Invalid path`; }
    if (info.parent.children[info.name]) { SOUNDS.error.play(); return `mk: cannot create directory '${args[0]}': File exists`; }
    info.parent.children[info.name] = { type: 'dir', children: {} };
    SOUNDS.success.play();
    return '';
  },
  kick(args) {
    if (args.length === 0) return 'kick: missing file operand';
    const targetPath = resolvePath(args[0], currentDir);
    const info = getParentAndName(ROOT_NODE, targetPath);
    if (!info) { SOUNDS.error.play(); return `kick: cannot create '${args[0]}': Invalid path`; }
    if (!info.parent.children[info.name]) {
      info.parent.children[info.name] = { type: 'file', content: '' };
    }
    SOUNDS.success.play();
    return '';
  },
  yeet(args) {
    if (args.length === 0) return 'yeet: missing operand';
    const targetPath = resolvePath(args[0], currentDir);
    const info = getParentAndName(ROOT_NODE, targetPath);
    if (!info || !info.parent.children[info.name]) { SOUNDS.error.play(); return `yeet: cannot remove '${args[0]}': No such file or directory`; }
    delete info.parent.children[info.name];
    SOUNDS.success.play();
    return '';
  },
  slide(args) {
    if (args.length < 2) return 'slide: missing operand';
    const srcPath = resolvePath(args[0], currentDir);
    const dstPath = resolvePath(args[1], currentDir);
    const srcInfo = getParentAndName(ROOT_NODE, srcPath);
    if (!srcInfo || !srcInfo.parent.children[srcInfo.name]) { SOUNDS.error.play(); return `slide: cannot move '${args[0]}': No such file or directory`; }
    const dstInfo = getParentAndName(ROOT_NODE, dstPath);
    if (!dstInfo) { SOUNDS.error.play(); return `slide: invalid destination '${args[1]}'`; }
    dstInfo.parent.children[dstInfo.name] = srcInfo.parent.children[srcInfo.name];
    delete srcInfo.parent.children[srcInfo.name];
    SOUNDS.success.play();
    return '';
  },
  clone(args) {
    if (args.length < 2) return 'clone: missing operand';
    const srcPath = resolvePath(args[0], currentDir);
    const dstPath = resolvePath(args[1], currentDir);
    const srcNode = getNodeAtPath(ROOT_NODE, srcPath);
    if (!srcNode) { SOUNDS.error.play(); return `clone: cannot copy '${args[0]}': No such file or directory`; }
    const dstInfo = getParentAndName(ROOT_NODE, dstPath);
    if (!dstInfo) { SOUNDS.error.play(); return `clone: invalid destination '${args[1]}'`; }
    dstInfo.parent.children[dstInfo.name] = JSON.parse(JSON.stringify(srcNode));
    SOUNDS.success.play();
    return '';
  },
  dog(args) {
    if (args.length === 0) return 'dog: missing file operand';
    const targetPath = resolvePath(args[0], currentDir);
    const node = getNodeAtPath(ROOT_NODE, targetPath);
    if (!node || node.type !== 'file') { SOUNDS.error.play(); return `dog: ${args[0]}: No such file`; }
    return node.content || '';
  },
  tiny(args) {
    if (args.length === 0) return 'tiny: missing filename';
    const targetPath = resolvePath(args[0], currentDir);
    const info = getParentAndName(ROOT_NODE, targetPath);
    if (!info) return 'tiny: invalid path';
    let node = info.parent.children[info.name];
    if (!node) {
      node = { type: 'file', content: '' };
      info.parent.children[info.name] = node;
    } else if (node.type !== 'file') return `tiny: ${args[0]}: Not a regular file`;
    startEditorMode(node, args[0]);
    return '';
  },

  // ---- User management ----
  become(args) {
    const targetUser = args.length > 0 ? args[0] : 'root';
    if (targetUser === 'god') {
      currentUser = 'root';
      updatePromptDisplay();
      SOUNDS.success.play();
      return 'You are already a god in this sandbox. But fine, you are root.';
    }
    if (!users[targetUser] && targetUser !== 'sandwich') { SOUNDS.error.play(); return `become: user ${targetUser} does not exist`; }
    currentUser = targetUser;
    updatePromptDisplay();
    SOUNDS.success.play();
    return '';
  },
  adduser(args) {
    if (currentUser !== 'root') { SOUNDS.error.play(); return 'adduser: Permission denied (must be root)'; }
    if (args.length === 0) return 'adduser: missing username';
    const newUser = args[0];
    if (users[newUser]) { SOUNDS.error.play(); return `adduser: user '${newUser}' already exists`; }
    users[newUser] = { password: '' };
    SOUNDS.success.play();
    return '';
  },
  setpass(args) {
    const targetUser = args.length > 0 ? args[0] : currentUser;
    if (currentUser !== 'root' && targetUser !== currentUser) { SOUNDS.error.play(); return 'setpass: Permission denied'; }
    if (!users[targetUser]) { SOUNDS.error.play(); return `setpass: user '${targetUser}' does not exist`; }
    users[targetUser].password = '';
    SOUNDS.success.play();
    return `setpass: password for '${targetUser}' changed.`;
  },

  sumo(args) { return this.sudo(args); },

  sudo(args) {
    if (args[0] === 'make' && args[1] === 'me' && args[2] === 'a' && args[3] === 'sandwich') {
      if (currentUser === 'sandwich') {
        sandwichCount++;
        if (sandwichCount >= 3) return "You're already a sandwich. Stop it.";
        return "You're already a sandwich. Did you forget?";
      }
      currentUser = 'sandwich';
      updatePromptDisplay();
      sandwichCount++;
      return 'Okay. You are now a sandwich.';
    }
    if (args[0] === 'make' && args[1] === 'me' && args[2] === 'a' && args[3] === 'human') {
      if (currentUser === 'sandwich') {
        currentUser = 'user';
        updatePromptDisplay();
        sandwichCount = 0;
        return 'You are now human again. Welcome back.';
      }
      return 'You are already human.';
    }

    if (args.length === 1 && args[0] === '--check') {
      const sumoersNode = getNodeAtPath(ROOT_NODE, ['~', 'etc', 'sumoers']);
      if (!sumoersNode || sumoersNode.type !== 'file') return 'sumoers file not found.';
      const content = sumoersNode.content;
      const lines = content.split('\n');
      const relevant = lines.filter(l => {
        const t = l.trim();
        return t !== '' && !t.startsWith('#') && t.startsWith(currentUser + ' ');
      });
      return `--- sumoers content ---\n${content}\n--- end ---\nCurrent user: ${currentUser}\nMatching lines: ${relevant.length > 0 ? relevant.join('\n') : '(none)'}\nisSumoer: ${isSumoer(currentUser)}`;
    }
    if (args.length === 0 || args[0] === 'help') {
      return `sumo/sudo - execute a command as superuser.\nUsage: sudo <command>\n  sudo -l          List allowed commands\n  sudo --check     Debug sumoers file\nRequires entry in /etc/sumoers:  user ALL=(ALL) ALL`;
    }
    if (args[0] === '-l') {
      if (currentUser === 'root') return 'root may run any command.';
      const sumoersNode = getNodeAtPath(ROOT_NODE, ['~', 'etc', 'sumoers']);
      if (!sumoersNode || sumoersNode.type !== 'file') return 'sumoers file not found.';
      const lines = sumoersNode.content.split('\n');
      const userLines = lines.filter(line => {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) return false;
        const parts = trimmed.split(/\s+/);
        return parts[0] === currentUser && parts.slice(1).join(' ') === 'ALL=(ALL) ALL';
      });
      if (userLines.length === 0) { SOUNDS.error.play(); return `${currentUser} is not in the sumoers file.`; }
      return `User ${currentUser} may run the following commands:\n` + userLines.join('\n');
    }
    if (!isSumoer(currentUser)) {
      SOUNDS.error.play();
      return `${currentUser} is not in the sumoers file. This incident will be reported.`;
    }
    const prevUser = currentUser;
    currentUser = 'root';
    const command = args.join(' ');
    let result;
    try { result = processCommand(command); }
    finally {
      currentUser = prevUser;
      updatePromptDisplay();
    }
    return result;
  },

  past() {
    return commandHistory.map((cmd, i) => `${i+1}  ${cmd}`).join('\n') || '(no commands)';
  },
  luck() {
    const fortunes = ["You will find a bug in your code.", "A closed mouth gathers no foot.", "Simplicity is the ultimate sophistication."];
    return fortunes[Math.floor(Math.random() * fortunes.length)];
  },
  restart() { return 'Restart failed: It\'s a sandbox.'; },
  halt() { return 'Halt failed: Close the browser tab.'; },

  get(args) {
    if (args[0] === 'help') return `get - Install a virtual OS.\nUsage: get "OS Name" [-version X]`;
    const osName = args.length > 0 && !args[0].startsWith('-') ? args[0] : 'Windows';
    const versionFlagIndex = args.findIndex(a => a === '-version');
    const version = versionFlagIndex !== -1 && args[versionFlagIndex + 1] ? args[versionFlagIndex + 1] : '11';
    return new Promise(async (resolve) => {
      SOUNDS.startup.play(); SOUNDS.hddSpinup.play();
      writeOutput(`Getting ${osName} -version ${version}...`);
      const progressBarId = 'get-progress-' + Date.now();
      writeHTML(`<div class="progress-bar" id="${progressBarId}"><div class="progress-fill" id="${progressBarId}-fill"></div></div>`);
      const fill = document.getElementById(progressBarId + '-fill');
      SOUNDS.hdd.play();
      for (let i = 0; i <= 20; i++) {
        await sleep(200);
        if (fill) fill.style.width = ((i / 20) * 100) + '%';
        if (i === 5) writeOutput('Configuring synthetic reality...');
        scrollToBottom();
      }
      SOUNDS.hdd.stop(); SOUNDS.success.play();
      writeOutput(`Installation complete! Starting ${osName} ${version} GUI...`);
      if (typeof createDesktop === 'function') {
        if (osName.toLowerCase() === 'linux') createDesktop("Linux Beatbox", SOUNDS.linux);
        else if (osName.toLowerCase() === 'macos') { SOUNDS.macos.play(); writeOutput("MacOS is too expensive for this sandbox. Buy a real Mac first."); resolve(''); return; }
        else if (osName.toLowerCase() === 'fart') createDesktop("FartOS", SOUNDS.fart, `<img src="assets/icons/fartos.png" style="width:100%;height:100%;object-fit:contain;">`);
        else createDesktop();
      } else writeOutput('(GUI module not loaded)');
      resolve('');
    });
  },

  paint(args) {
    if (args.length === 0 || args[0] === 'help') return `paint - Customize terminal colors.\n  paint list / set <prop> <value> / reset\n  Properties: text, background, cow, progress`;
    if (args[0] === 'list') return `Current theme:\n  text: ${currentTheme.text}\n  background: ${currentTheme.background}\n  cow: ${currentTheme.cow}\n  progress: ${currentTheme.progress}`;
    if (args[0] === 'reset') { currentTheme = { ...defaultTheme }; saveTheme(); SOUNDS.success.play(); return 'Theme reset.'; }
    if (args[0] === 'set') {
      if (args.length < 3) return 'Usage: paint set <prop> <value>';
      const prop = args[1].toLowerCase();
      const val = args[2];
      if (!/^#[0-9a-fA-F]{6}$/.test(val)) return 'Invalid color HEX.';
      if (!['text','background','cow','progress'].includes(prop)) return 'Unknown property.';
      currentTheme[prop] = val; saveTheme(); SOUNDS.success.play();
      return `Theme updated: ${prop} = ${val}`;
    }
    return 'Unknown paint command.';
  },

  // ========== EASTER EGGS ==========
  rickroll() {
    SOUNDS.success.play();
    return `   NEVER GONNA GIVE YOU UP\n   NEVER GONNA LET YOU DOWN\n   NEVER GONNA RUN AROUND AND DESERT YOU\n\n        \\o/\n         |      (dance moves intensifying)\n        / \\`;
  },
  slot() {
    const emojis = ['🍒', '🍋', '🔔', '⭐', '💎'];
    const r1 = emojis[Math.floor(Math.random() * emojis.length)];
    const r2 = emojis[Math.floor(Math.random() * emojis.length)];
    const r3 = emojis[Math.floor(Math.random() * emojis.length)];
    const result = `[ ${r1} | ${r2} | ${r3} ]`;
    if (r1 === r2 && r2 === r3) { SOUNDS.success.play(); return result + '\n🎉 JACKPOT! (not really)'; }
    else { SOUNDS.click.play(); return result + '\nNo luck... try again!'; }
  },
  rm(args) {
    if (args.includes('-rf') && args.includes('/')) {
      SOUNDS.error.play();
      return "Deleting universe... 10%... 20%... Just kidding, this is a sandbox, not a black hole.";
    }
    return this.yeet(args.filter(a => !a.startsWith('-')));
  },
  npm(args) {
    if (args[0] === 'install') {
      return new Promise(async (resolve) => {
        writeOutput('Running npm install...');
        const progressBarId = 'npm-progress-' + Date.now();
        writeHTML(`<div class="progress-bar" id="${progressBarId}"><div class="progress-fill" id="${progressBarId}-fill"></div></div>`);
        const fill = document.getElementById(progressBarId + '-fill');
        SOUNDS.hdd.play();
        for (let i = 0; i <= 20; i++) {
          await sleep(150);
          if (fill) fill.style.width = ((i / 20) * 100) + '%';
        }
        SOUNDS.hdd.stop();
        try {
          const response = await fetch('assets/npminstall.txt');
          if (!response.ok) throw new Error('File not found');
          const text = await response.text();
          SOUNDS.npm.play();
          writeOutput(text);
        } catch (e) {
          SOUNDS.error.play();
          writeOutput('npm ERR! Could not fetch package list. Maybe the node_modules are in another castle.');
        }
        resolve('');
      });
    }
    return 'npm: unknown command. Did you mean "npm install"?';
  },
  sl() { startSlAnimation(); return ''; },
  destroy() {
    SOUNDS.error.play();
    writeOutput('Initiating self-destruct sequence...');
    let count = 10;
    const interval = setInterval(() => {
      if (count > 0) writeOutput(count + '...');
      else {
        clearInterval(interval);
        writeOutput('Deleting files...');
        writeOutput('Formatting brain...');
        writeOutput('Killing all processes...');
        SOUNDS.overheat.play();
        document.getElementById('terminal').style.display = 'none';
        setTimeout(() => {
          document.getElementById('terminal').style.display = '';
          writeOutput('Just kidding. Nothing can destroy BytBox.');
          SOUNDS.success.play();
        }, 3000);
      }
      count--;
    }, 500);
    return '';
  },
  bsod() {
    const old = document.getElementById('bsod');
    if (old) old.remove();
    const bsodDiv = document.createElement('div');
    bsodDiv.id = 'bsod';
    bsodDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0000AA;color:white;font-family:monospace;z-index:10000;display:flex;align-items:center;justify-content:center;';
    bsodDiv.innerHTML = `<div style="text-align:center;background:navy;padding:20px;max-width:600px;">
      <h2>A problem has been detected and BytBox has been shut down...</h2>
      <p>DRIVER_IRQL_NOT_LESS_OR_EQUAL</p>
      <p>If this is the first time you've seen this Stop error screen, restart your computer.</p>
      <p>*** STOP: 0x000000D1 (0x0000000C,0x00000002,0x00000000,0xF86B5A89)</p>
      <p style="margin-top:20px;font-size:12px;">Press any key to continue... but it won't help.</p>
    </div>`;
    document.body.appendChild(bsodDiv);
    SOUNDS.error.play();
    const handler = (e) => {
      if (bsodDiv.parentNode) bsodDiv.parentNode.removeChild(bsodDiv);
      document.removeEventListener('keydown', handler);
      document.getElementById('command-input').focus();
    };
    document.addEventListener('keydown', handler);
    return '';
  },
  hack() {
    return new Promise(async (resolve) => {
      writeOutput('Connecting to FBI.gov...'); await sleep(800);
      writeOutput('Bypassing firewall...'); await sleep(1000);
      writeOutput('Decrypting password...'); await sleep(1200);
      writeOutput('Access granted. Downloading secret files...');
      SOUNDS.modem.play();
      const progressBarId = 'hack-progress-' + Date.now();
      writeHTML(`<div class="progress-bar" id="${progressBarId}"><div class="progress-fill" id="${progressBarId}-fill"></div></div>`);
      const fill = document.getElementById(progressBarId + '-fill');
      for (let i = 0; i <= 20; i++) { await sleep(100); if (fill) fill.style.width = ((i / 20) * 100) + '%'; }
      SOUNDS.modem.stop(); SOUNDS.error.play();
      writeOutput("Congratulations! You've just hacked yourself. Your IP is now on a watchlist. Expect a knock on the door.");
      await sleep(1000);
      writeOutput("Just kidding. But I'd still close the tab if I were you.");
      resolve('');
    });
  },

  // ===== KILL COMMAND (the ultimate easter egg) =====
  kill() {
    // Prevent multiple kills
    if (window._killActive) return 'Terminal is already dying...';
    window._killActive = true;

    // List of safe commands to execute randomly (exclude heavy or recursive ones)
    const safeCommands = Object.keys(window.commands).filter(cmd => {
      return !['kill', 'bsod', 'destroy', 'hack', 'sl', 'rain', 'sumo', 'sudo', 'get', 'npm', 'tiny', 'install'].includes(cmd);
    });

    const input = document.getElementById('command-input');
    if (input) input.disabled = true;

    let counter = 0;
    const maxTime = 10000; // 10 seconds
    const intervalTime = 150;
    const interval = setInterval(() => {
      if (counter * intervalTime >= maxTime) {
        clearInterval(interval);
        if (input) input.disabled = false;
        // Show the red screen of death
        showKillRedScreen();
        return;
      }

      const randomCmd = safeCommands[Math.floor(Math.random() * safeCommands.length)];
      // Build a simple argument if the command usually expects one
      let cmdString = randomCmd;
      const needArg = ['say','echo','moo','cowsay','go','cd','mk','mkdir','kick','touch','yeet','rm','slide','mv','clone','cp','dog','cat','tiny','nano'];
      if (needArg.includes(randomCmd)) {
        cmdString += ' random' + Math.floor(Math.random() * 100);
      }
      // Execute the command (adds to output and history)
      processCommand(cmdString);
      counter++;
    }, intervalTime);

    return '';
  }
};

// Helper function for the final red screen (used by kill)
function showKillRedScreen() {
  const killOverlay = document.createElement('div');
  killOverlay.id = 'kill-overlay';
  killOverlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: darkred;
    color: white;
    font-family: monospace;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  `;

  const message = document.createElement('h1');
  message.textContent = 'You destroyed the terminal, how dare you';
  const asciiFace = document.createElement('pre');
  asciiFace.style.fontSize = '20px';
  asciiFace.textContent = `
      ████████████████████
      ██                ██
      ██   ██████████   ██
      ██   ██      ██   ██
      ██   ██      ██   ██
      ██   ██████████   ██
      ██                ██
      ██   ██████████   ██
      ██   ██ ██ ██ ██  ██
      ██   ██ ██ ██ ██  ██
      ██                ██
      ████████████████████
  `;

  killOverlay.appendChild(message);
  killOverlay.appendChild(asciiFace);
  document.body.appendChild(killOverlay);

  // Start endless explosion after 5 seconds
  setTimeout(() => {
    SOUNDS.explosion.play();
  }, 5000);
}