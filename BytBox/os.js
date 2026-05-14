// os.js - Window manager for BytBox OS

let zIndexCounter = 100;

function createWindow(title, contentHTML) {
  const win = document.createElement('div');
  win.className = 'window';
  win.style.zIndex = ++zIndexCounter;
  win.innerHTML = `
    <div class="window-header">
      <span>${escapeHtml(title)}</span>
      <button class="close-btn">X</button>
    </div>
    <div class="window-content">${contentHTML}</div>
  `;

  const header = win.querySelector('.window-header');
  let isDragging = false, offsetX, offsetY;

  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('close-btn')) return;
    isDragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    win.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    win.style.left = (e.clientX - offsetX) + 'px';
    win.style.top = (e.clientY - offsetY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      win.style.cursor = '';
    }
  });

  const closeBtn = win.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    if (win._sound) {
      win._sound.stop();
      win._sound = null;
    }
    win.remove();
  });

  win.addEventListener('mousedown', () => {
    win.style.zIndex = ++zIndexCounter;
  });

  win.style.left = '100px';
  win.style.top = '100px';

  document.getElementById('desktop-windows').appendChild(win);
  return win;
}

function createDesktop(title = "Windows 11 (BytBox Edition)", sound = null, customContent = null) {
  const desktopHTML = customContent || `
    <div style="display:flex; flex-wrap:wrap; padding:10px; gap:15px;">
      <div class="desktop-icon" ondblclick="launchPaint()">
        <div>🎨</div>
        <div>Paint</div>
      </div>
      <div class="desktop-icon" ondblclick="launchNotepad()">
        <div>📝</div>
        <div>Notepad</div>
      </div>
      <div class="desktop-icon" ondblclick="launchMiner()">
        <div>⛏️</div>
        <div>Miner</div>
      </div>
      <div class="desktop-icon" ondblclick="launchBenchmark()">
        <div>📊</div>
        <div>Benchmark</div>
      </div>
    </div>
  `;
  const win = createWindow(title, desktopHTML);
  if (sound) {
    win._sound = sound;
    sound.play();
  }
  return win;
}

// стили для иконок
const style = document.createElement('style');
style.textContent = `
  .desktop-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 70px;
    text-align: center;
    color: var(--text-color);
    font-size: 11px;
    cursor: pointer;
    padding: 5px;
  }
  .desktop-icon:hover {
    background: rgba(0,255,65,0.1);
  }
`;
document.head.appendChild(style);