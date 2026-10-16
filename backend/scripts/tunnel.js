/**
 * 一键公网发布（内网穿透）
 *   npm run tunnel
 * 自动：检测/启动后端 → 建立 localtunnel 隧道 → 打印全球链接与隧道密码
 * 关闭：在此窗口按 Ctrl+C（电脑不要关机、不要关窗口，否则链接失效）
 */
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const localtunnel = require('localtunnel');

const PORT = Number(process.env.PORT) || 3000;

/* 检测某端口本机是否可连 */
function isPortOpen(port) {
  return new Promise((resolve) => {
    const sock = net.connect(port, '127.0.0.1');
    sock.on('connect', () => {
      sock.destroy();
      resolve(true);
    });
    sock.on('error', () => resolve(false));
  });
}

/* 等待后端就绪 */
async function waitForServer(port, timeout = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await isPortOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

/* 获取公网 IP（localtunnel 首次访问的隧道密码） */
async function getPublicIp() {
  try {
    const res = await fetch('https://loca.lt/mytunnelpassword', {
      signal: AbortSignal.timeout(8000)
    });
    const t = (await res.text()).trim();
    if (t) return t;
  } catch (_) {}
  try {
    const res = await fetch('https://api.ipify.org', {
      signal: AbortSignal.timeout(8000)
    });
    return (await res.text()).trim();
  } catch (_) {}
  return null;
}

async function main() {
  let serverProc = null;

  /* 1. 后端没在跑就启动它 */
  if (!(await isPortOpen(PORT))) {
    console.log('后端未运行，正在启动…');
    serverProc = spawn(process.execPath, ['--env-file=.env', 'server.js'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    if (!(await waitForServer(PORT))) {
      console.error('服务启动失败，请先在 backend 目录运行 npm start 排查。');
      process.exit(1);
    }
  }

  /* 2. 建立隧道 */
  process.stdout.write('\n正在建立公网隧道…');
  let tunnel;
  try {
    tunnel = await localtunnel({
      port: PORT,
      subdomain: process.env.SUBDOMAIN || undefined
    });
  } catch (e) {
    console.error('\n隧道建立失败：' + e.message + '（可稍后重试，或检查网络）');
    if (serverProc) serverProc.kill();
    process.exit(1);
  }

  /* 3. 打印结果 */
  const ip = await getPublicIp();
  console.log('\n==================================================');
  console.log('  网站已成功发布到公网！');
  console.log('==================================================');
  console.log('  本机访问： http://localhost:' + PORT);
  console.log('  全球链接： ' + tunnel.url);
  console.log('--------------------------------------------------');
  console.log('  首次打开全球链接，页面会要求输入隧道密码（Temporary）');
  if (ip) console.log('  密码就是你的公网 IP： ' + ip);
  else console.log('  密码是你的公网 IP，可访问 https://whatismyip.com 查看');
  console.log('--------------------------------------------------');
  console.log('  把上面的「全球链接」发给朋友即可访问。');
  console.log('  注意：电脑不要关机、不要关闭此窗口，否则链接失效。');
  console.log('==================================================\n');

  tunnel.on('close', () => {
    console.log('隧道已关闭。');
    if (serverProc) serverProc.kill();
    process.exit(0);
  });
  tunnel.on('error', (e) => console.error('隧道出错：' + e.message));

  const cleanup = () => {
    try {
      tunnel.close();
    } catch (_) {}
    if (serverProc) serverProc.kill();
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main();
