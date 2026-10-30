// Diagnostic only: environment NAMES, never values; no application imports.
if (!process.connected || typeof process.send !== 'function') {
  process.exitCode = 1;
} else {
  process.send({
    version: 'rms-owned-ipc-runtime-metadata-v1',
    environmentNames: Object.keys(process.env).sort(),
    argv: process.argv,
    execArgv: process.execArgv,
    pid: process.pid,
    parentPid: process.ppid,
    bunVersion: process.versions.bun,
    platform: process.platform,
    arch: process.arch,
    applicationImported: false
  }, error => {
    process.exitCode = error ? 1 : 0;
    if (process.connected) process.disconnect();
  });
}
