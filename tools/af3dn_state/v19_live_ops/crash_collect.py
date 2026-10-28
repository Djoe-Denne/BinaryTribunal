"""Copy native crash dump + read Application WER events; no WER registry changes.

Crash collection is NOT first-chance capture. Events are time-filtered candidates,
not automatically attributed to FF8. A native dump without PID/create-time proof
is retained as INCONCLUSIVE. Original files are never removed or truncated.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import struct
import subprocess
import quiet_process as Q
import winread as R

def dump_identity(path):
    with path.open('rb') as f:
        header=f.read(32)
        if len(header)!=32 or header[:4]!=b'MDMP':return {'status':'INVALID_HEADER'}
        _,_,count,directory,_,_,_=struct.unpack('<IIIIIIQ',header)
        if count>4096:return {'status':'INVALID_STREAM_COUNT'}
        f.seek(directory);streams=f.read(count*12)
        if len(streams)!=count*12:return {'status':'SHORT_DIRECTORY'}
        for i in range(count):
            kind,size,rva=struct.unpack_from('<III',streams,i*12)
            if kind==15 and size>=24:
                f.seek(rva);data=f.read(24)
                if len(data)!=24:return {'status':'SHORT_MISC'}
                _,flags,pid,born,_,_=struct.unpack('<6I',data)
                return {'status':'MISC_INFO','pid':pid if flags&1 else None,'creation_unix_seconds':born if flags&2 else None,'flags':flags}
        return {'status':'MISSING_MISC_IDENTITY'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--run',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
    a=p.parse_args();a.out.mkdir(exist_ok=False)
    bound=json.loads((a.run/'observation/bound.json').read_text());R.require(bound.get('mode')=='LIVE','LIVE observer identity required')
    manifest=json.loads((a.run/'prep-manifest.json').read_text())
    native=Path.home()/'Documents/Square Enix/FINAL FANTASY VIII Steam/crash.dmp'
    receipt={'mode':'LIVE','scope':'post-crash native dump + WER, not first-chance capture','pid':bound['pid'],'creation':bound['creation'],'utc':R.utc(),'artifacts':[],'status':'INCONCLUSIVE'}
    try:
        old=next((x for x in manifest['entries'] if x['source'].lower()==str(native).lower()),None)
        if native.is_file():
            before=R.sha(native);size=native.stat().st_size
            new=old is None or before!=old['sha256']
            if new:
                dst=a.out/'native-crash.dmp'
                with native.open('rb') as src,dst.open('xb') as dest:
                    while data:=src.read(1024*1024):dest.write(data)
                stable=before==R.sha(dst)==R.sha(native) and size==dst.stat().st_size==native.stat().st_size
                ident=dump_identity(dst);expected_seconds=int(bound['creation'])//10000000-11644473600
                matched=(ident.get('pid')==bound['pid'] and ident.get('creation_unix_seconds')==expected_seconds)
                receipt['artifacts'].append({'source':str(native),'copy':str(dst),'sha256':R.sha(dst),'bytes':dst.stat().st_size,'new_hash':new,'stable_copy':stable,'dump_identity':ident,'identity_match_seconds_resolution':matched})
                if stable and matched:receipt['status']='NATIVE_DUMP_BOUND_SECONDS_RESOLUTION'
            else:receipt['native_dump']='unchanged preexisting dump; not this session evidence'
        else:receipt['native_dump']='absent'
        stamp=datetime.fromisoformat(bound['utc']).astimezone(timezone.utc).isoformat()
        command="$ErrorActionPreference='Stop'; $start=[datetime]::Parse('"+stamp+"'); @(Get-WinEvent -FilterHashtable @{LogName='Application'; Id=1000,1001,1002; StartTime=$start} -ErrorAction SilentlyContinue | Select-Object TimeCreated,Id,ProviderName,RecordId,Message) | ConvertTo-Json -Depth 5"
        r=Q.run(Q.powershell_args(command),capture_output=True,text=True,timeout=30)
        # Preserve bytes/errors even when event access is unavailable.
        for name,content in [('wer.stdout.json',r.stdout),('wer.stderr.log',r.stderr)]:
            with (a.out/name).open('x',encoding='utf8') as f:f.write(content)
            receipt['artifacts'].append({'copy':str(a.out/name),'bytes':(a.out/name).stat().st_size,'sha256':R.sha(a.out/name)})
        receipt['wer_query_returncode']=r.returncode
        receipt['wer_attribution']='time-filtered IDs 1000/1001/1002; parent must inspect executable/PID/signature/module+offset'
    except Exception as e:receipt['error']=repr(e)
    finally:R.exclusive_json(a.out/'receipt.json',receipt)
    print(json.dumps({'status':receipt['status'],'artifacts':len(receipt['artifacts']),'error':receipt.get('error')}))
    return 0 if 'error' not in receipt else 2
if __name__=='__main__':raise SystemExit(main())
