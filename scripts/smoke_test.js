import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4173;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  waitOpen() {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function runSession(debugPort, width, height, isMobileTest = false) {
  const userDataDir = `/tmp/chrome-smoke-profile-${debugPort}-${Date.now()}`;
  const chromeArgs = [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--window-size=${width},${height}`,
    'about:blank',
  ];

  const chrome = spawn(CHROME_PATH, chromeArgs, { stdio: 'pipe' });

  let cdp;
  try {
    let ready = false;
    for (let i = 0; i < 20; i++) {
      try {
        await fetchJson(`http://127.0.0.1:${debugPort}/json/version`);
        ready = true;
        break;
      } catch {
        await sleep(200);
      }
    }
    if (!ready) throw new Error(`Chrome remote debugging port ${debugPort} did not respond`);

    const pages = await fetchJson(`http://127.0.0.1:${debugPort}/json/list`);
    const pageWsUrl = pages[0]?.webSocketDebuggerUrl;
    if (!pageWsUrl) throw new Error('No debugger WebSocket URL found');

    cdp = new CDPClient(pageWsUrl);
    await cdp.waitOpen();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}` });
    await sleep(2500);

    if (!isMobileTest) {
      // Desktop assertions
      const title = await cdp.eval('document.title');
      console.log(`✓ Document title: "${title}"`);
      if (!title.includes('台北樹跡')) throw new Error('Document title mismatch');

      const brandTitle = await cdp.eval('document.querySelector(".brand-title")?.textContent');
      console.log(`✓ Brand title: "${brandTitle}"`);
      if (brandTitle !== '台北樹跡') throw new Error('Brand title mismatch');

      const layerChipsCount = await cdp.eval('document.querySelectorAll(".layer-chip").length');
      console.log(`✓ Layer toggle chips count: ${layerChipsCount} (expected 6)`);
      if (layerChipsCount !== 6) throw new Error('Expected 6 layer toggle chips');

      const selectOptionsCount = await cdp.eval(
        'document.querySelectorAll("#district-select option").length'
      );
      console.log(`✓ District selector options: ${selectOptionsCount} (All + 12 districts = 13)`);
      if (selectOptionsCount !== 13) throw new Error('Expected 13 district selector options');

      // Shade Equity Modal
      await cdp.eval(`(() => {
        const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.includes('平權論述'));
        if (btn) btn.click();
      })()`);
      await sleep(300);
      const isModalOpen = await cdp.eval('document.querySelector(".modal-dialog") !== null');
      const modalTitle = await cdp.eval('document.querySelector(".modal-title")?.textContent');
      console.log(`✓ Shade equity modal opened: ${isModalOpen}, title: "${modalTitle}"`);
      if (!isModalOpen || !modalTitle?.includes('遮蔭平權')) {
        throw new Error('Shade Equity modal did not open properly');
      }
      await cdp.eval('(() => { document.querySelector(".modal-dialog .drawer-close-btn")?.click(); })()');
      await sleep(200);

      // Data Sources Modal
      await cdp.eval(`(() => {
        const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.includes('資料來源'));
        if (btn) btn.click();
      })()`);
      await sleep(300);
      const isDataSourcesOpen = await cdp.eval('document.querySelector(".data-provenance-table") !== null');
      console.log(`✓ Data sources modal opened with provenance table: ${isDataSourcesOpen}`);
      if (!isDataSourcesOpen) throw new Error('Data sources modal did not open properly');
      await cdp.eval('(() => { document.querySelector(".modal-dialog .drawer-close-btn")?.click(); })()');
      await sleep(200);

      // District Filter Change to Zhongzheng district
      await cdp.eval(`(() => {
        const sel = document.querySelector('#district-select');
        sel.value = '中正區';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      await sleep(1500);

      const districtMetric = await cdp.eval('document.querySelector(".civic-summary-bar")?.textContent');
      console.log(`✓ Summary bar after filter: ${districtMetric}`);
      if (!districtMetric?.includes('中正區')) {
        throw new Error('District filter change did not update summary bar');
      }

      // Offline Paper Mode Toggle
      await cdp.eval(`(() => {
        const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.includes('線上圖磚') || b.textContent.includes('離線紙圖'));
        if (btn) btn.click();
      })()`);
      await sleep(500);
      const hasOfflineBanner = await cdp.eval('document.querySelector(".offline-banner") !== null');
      console.log(`✓ Offline paper banner visible: ${hasOfflineBanner}`);
      if (!hasOfflineBanner) throw new Error('Offline paper mode toggle did not show banner');
    } else {
      // Mobile 390px Viewport Assertions
      const clientWidth = await cdp.eval('window.innerWidth');
      const scrollWidth = await cdp.eval('document.documentElement.scrollWidth');
      const bodyScrollWidth = await cdp.eval('document.body.scrollWidth');
      console.log(
        `✓ Mobile 390px Viewport: innerWidth=${clientWidth}, htmlScrollWidth=${scrollWidth}, bodyScrollWidth=${bodyScrollWidth}`
      );

      if (scrollWidth > 390 || bodyScrollWidth > 390) {
        throw new Error(
          `Mobile horizontal overflow detected! htmlScrollWidth=${scrollWidth}, bodyScrollWidth=${bodyScrollWidth}, limit=390`
        );
      }
      console.log('✓ 100% zero horizontal overflow verified at 390px mobile layout!');
    }
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

async function main() {
  console.log('=== Tree Taipei Automated Browser Smoke Test ===');

  console.log('1. Launching Vite preview server...');
  const server = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--host', '127.0.0.1'], {
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => process.stdout.write(`[preview] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[preview err] ${d}`));

  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((res, rej) => {
        const req = http.get(`http://127.0.0.1:${PORT}`, (r) => {
          if (r.statusCode === 200) res(true);
          else rej(new Error(`Status ${r.statusCode}`));
        });
        req.on('error', rej);
      });
      serverReady = true;
      break;
    } catch {
      await sleep(200);
    }
  }

  if (!serverReady) {
    server.kill();
    throw new Error('Vite preview server failed to start');
  }
  console.log('✓ Vite preview server is ready on http://127.0.0.1:' + PORT);

  try {
    console.log('\n--- Phase 1: Desktop Mode Smoke Test (1280x800) ---');
    await runSession(9222, 1280, 800, false);

    console.log('\n--- Phase 2: Mobile Mode Smoke Test (390x844 iPhone Viewport) ---');
    await runSession(9223, 390, 844, true);

    console.log('\n=== ALL BROWSER SMOKE TESTS PASSED WITH ZERO ERRORS ===');
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error('Smoke test failed with error:', err);
  process.exit(1);
});
