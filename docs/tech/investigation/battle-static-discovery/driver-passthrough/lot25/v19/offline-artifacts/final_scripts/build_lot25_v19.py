"""Build an isolated v19 diagnostic attempt; never load, deploy or overwrite it."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import tempfile
from build_lot25_v18 import sha, copy, VCVARS, REPO

OUT = REPO / 'docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v19'
SOURCES = ('gfx_driver_passthrough.c', 'gfx_driver_passthrough.h',
           'gfx_lifetime_v19.h', 'gfx_stage0_v19.h')


def main():
    work = Path(tempfile.mkdtemp(prefix='lot25-v19-build-', dir=Path(os.environ['LOCALAPPDATA'])/'Temp/opencode'))
    attempt = OUT / ('build-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + work.name.rsplit('-', 1)[-1])
    attempt.mkdir()
    for name in SOURCES:
        copy(OUT/name, work/name)
    script = work/'build.cmd'
    script.write_text('@echo off\ncall "'+str(VCVARS)+'" x86 >nul\n'
                      'if errorlevel 1 exit /b %errorlevel%\n'
                      'cl /nologo /W3 /Ox /MT /LD /Zi gfx_driver_passthrough.c '
                      '/Fo:gfx_driver_passthrough.obj /Fe:gfx_driver_passthrough.dll '
                      '/Fd:gfx_driver_passthrough.pdb /link /INCREMENTAL:NO /OPT:NOREF '
                      '/MAP:gfx_driver_passthrough.map\nexit /b %errorlevel%\n', encoding='ascii')
    with (attempt/'build.log').open('wb') as log:
        p = subprocess.run(['cmd.exe','/d','/c',str(script)], cwd=work, stdout=log, stderr=subprocess.STDOUT, timeout=120)
    receipt = dict(build='0x5648',workdir=str(work),exit=p.returncode,deployed=False,loaded=False,
                   hashes={x.name:sha(x) for x in work.iterdir() if x.is_file()})
    for name in (*SOURCES,'build.cmd','gfx_driver_passthrough.dll','gfx_driver_passthrough.map','gfx_driver_passthrough.pdb'):
        if (work/name).exists(): copy(work/name,attempt/name)
    receipt['log_sha256'] = sha(attempt/'build.log')
    (attempt/'receipt.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
    print(json.dumps(dict(attempt=str(attempt),workdir=str(work),exit=p.returncode)))
    return p.returncode


if __name__ == '__main__':
    raise SystemExit(main())
