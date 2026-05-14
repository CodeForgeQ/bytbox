// apps.js - Desktop applications

function launchPaint() {
    const win = createWindow('Paint', `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div>
          <button onclick="paintColor='var(--text-color)'">Pen</button>
          <button onclick="paintColor='var(--bg-color)'">Eraser</button>
        </div>
        <canvas id="paint-canvas" width="500" height="300" style="border:1px solid var(--text-color); flex:1;"></canvas>
      </div>
    `);
    const canvas = win.querySelector('#paint-canvas');
    const ctx = canvas.getContext('2d');
    let painting = false;
    window.paintColor = 'var(--text-color)';
  
    canvas.addEventListener('mousedown', (e) => {
      painting = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!painting) return;
      ctx.strokeStyle = window.paintColor;
      ctx.lineWidth = 2;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    });
    canvas.addEventListener('mouseup', () => painting = false);
  }
  
  function launchNotepad() {
    createWindow('Notepad', `
      <textarea style="width:100%; height:100%; background:var(--bg-color); color:var(--text-color); border:none; resize:none; font-family:inherit; padding:10px;"></textarea>
    `);
  }
  
  function launchMiner() {
    const win = createWindow('Bytcoin Miner', `
      <div style="padding:10px;">
        <p>Mining Bytcoins... <span id="hashrate">0</span> H/s</p>
        <div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>
        <p id="mined">Mined: 0.00000000 BTC</p>
        <button onclick="window._minerStop=1">Stop</button>
      </div>
    `);
    let progress = 0;
    window._minerStop = 0;
    const fill = win.querySelector('.progress-fill');
    const hrSpan = win.querySelector('#hashrate');
    const minedSpan = win.querySelector('#mined');
    const interval = setInterval(() => {
      if (window._minerStop || !document.contains(win)) {
        clearInterval(interval);
        return;
      }
      progress += Math.random() * 2;
      if (progress > 100) progress = 100;
      fill.style.width = progress + '%';
      hrSpan.textContent = Math.floor(Math.random() * 1000);
      minedSpan.textContent = 'Mined: ' + (progress * 0.00000042).toFixed(8) + ' BTC';
      if (progress === 100) {
        clearInterval(interval);
        minedSpan.textContent += ' (BLOCK MINED!)';
      }
    }, 500);
  }
  
  function launchBenchmark() {
    createWindow('Performance Test', `
      <div style="padding:10px; text-align:center;">
        <p>Running benchmark...</p>
        <div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>
        <p id="bench-result"></p>
      </div>
    `);
    const fill = document.querySelector('#desktop-windows .window:last-child .progress-fill');
    const result = document.querySelector('#desktop-windows .window:last-child #bench-result');
    let percent = 0;
    const timer = setInterval(() => {
      percent += 5;
      if (fill) fill.style.width = percent + '%';
      if (percent >= 100) {
        clearInterval(timer);
        if (result) result.textContent = 'Score: 42069 (better than 99% of toasters)';
      }
    }, 100);
  }