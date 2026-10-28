#!/usr/bin/env python3
"""Build only, never deploy/load. Each invocation preserves an isolated attempt."""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / 'docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v18'
VCVARS = Path(r'C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat')


def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def copy(source, dest):
    with source.open('rb') as src, dest.open('xb') as dst:
        shutil.copyfileobj(src, dst, 1024 * 1024)
    assert sha(source) == sha(dest)


def main():
    work = Path(tempfile.mkdtemp(prefix='lot25-v18-build-', dir=Path(os.environ['LOCALAPPDATA']) / 'Temp/opencode'))
    attempt = OUT / ('build-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + work.name.rsplit('-', 1)[-1])
    attempt.mkdir()
    for suffix in ('c', 'h'):
        copy(OUT / ('gfx_driver_passthrough.' + suffix), work / ('gfx_driver_passthrough.' + suffix))
    script = work / 'build.cmd'
    script.write_text('@echo off\ncall "' + str(VCVARS) + '" x86 >nul\n'
                      'if errorlevel 1 exit /b %errorlevel%\n'
                      'cl /nologo /W3 /Ox /MT /LD /Zi gfx_driver_passthrough.c '
                      '/Fo:gfx_driver_passthrough.obj /Fe:gfx_driver_passthrough.dll '
                      '/Fd:gfx_driver_passthrough.pdb /link /INCREMENTAL:NO /MAP:gfx_driver_passthrough.map\n'
                      'exit /b %errorlevel%\n', encoding='ascii')
    command = ['cmd.exe', '/d', '/c', str(script)]
    with (attempt / 'build.log').open('wb') as log:
        p = subprocess.run(command, cwd=work, stdout=log, stderr=subprocess.STDOUT, timeout=120)
    receipt = {'build': '0x5646', 'command': command, 'workdir': str(work), 'exit': p.returncode,
               'deployed': False, 'loaded': False, 'hashes': {}}
    for path in work.iterdir():
        if path.is_file():
            receipt['hashes'][path.name] = sha(path)
    for name in ['build.cmd', 'gfx_driver_passthrough.c', 'gfx_driver_passthrough.h',
                 'gfx_driver_passthrough.dll', 'gfx_driver_passthrough.map', 'gfx_driver_passthrough.pdb']:
        if (work / name).exists():
            copy(work / name, attempt / name)
    receipt['log_sha256'] = sha(attempt / 'build.log')
    (attempt / 'receipt.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
    print(json.dumps({'attempt': str(attempt), 'exit': p.returncode, 'hashes': receipt['hashes']}, indent=2))
    if p.returncode == 0:
        for suffix in ('dll', 'map', 'pdb'):
            name = 'gfx_driver_passthrough.' + suffix
            if not (OUT / name).exists():
                copy(work / name, OUT / name)
            else:
                print('Canonical artifact already exists; preserved:', OUT / name)
    return p.returncode


if __name__ == '__main__':
    raise SystemExit(main())
