// Menjalankan website Next.js (port 3000) dan panel admin (port 3001) bersama-sama.
const path = require('node:path');
const { spawn } = require('node:child_process');

const mode = process.argv[2] === 'dev' ? 'dev' : 'start';
const root = path.join(__dirname, '..');
const web = path.join(root, 'web');
const nextBin = path.join(web, 'node_modules', 'next', 'dist', 'bin', 'next');
const { NODE_ENV: _ignored, ...baseEnv } = process.env;

const children = [
  spawn(process.execPath, [...(mode === 'dev' ? ['--watch'] : []), 'src/server.js'], { cwd: root, env: baseEnv, stdio: 'inherit' }),
  spawn(process.execPath, [nextBin, mode, '-p', '3000', '-H', '127.0.0.1'], {
    cwd: web,
    env: { ...baseEnv, NODE_ENV: mode === 'dev' ? 'development' : 'production' },
    stdio: 'inherit',
  }),
];

let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  children.forEach((c) => { if (c.exitCode === null) c.kill(); });
  process.exitCode = code;
}
children.forEach((c) => c.on('exit', (code) => stop(code ?? 1)));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
