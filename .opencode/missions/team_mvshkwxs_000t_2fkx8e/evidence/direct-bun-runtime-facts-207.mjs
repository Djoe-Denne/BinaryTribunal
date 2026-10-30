// Stdlib-only, no product imports, environment reads, database or host access.
console.log(JSON.stringify({ version: 'rms-direct-bun-runtime-facts-207-v1', main: import.meta.main,
  platform: process.platform, arch: process.arch, bun: process.versions.bun,
  execPath: process.execPath, execArgv: process.execArgv, moduleUrlScheme: new URL(import.meta.url).protocol,
  embeddedFilesCount: Bun.embeddedFiles?.length ?? 0, hostStarted: false }));
