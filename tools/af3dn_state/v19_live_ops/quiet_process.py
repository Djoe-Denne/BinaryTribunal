"""Console-free owned subprocesses; no shell, injection, or target-process actions."""
import os
import subprocess

def hidden_kwargs(**kwargs):
    if kwargs.get('shell',False):raise ValueError('shell execution is not allowed')
    if kwargs.get('stdin') not in (None,subprocess.DEVNULL):raise ValueError('owned tools require stdin DEVNULL')
    kwargs['shell']=False;kwargs['stdin']=subprocess.DEVNULL
    if os.name=='nt':
        flags=kwargs.get('creationflags',0)
        if flags & (subprocess.CREATE_NEW_CONSOLE|subprocess.DETACHED_PROCESS):
            raise ValueError('CREATE_NO_WINDOW is ignored with NEW_CONSOLE/DETACHED; refuse conflicting flags')
        kwargs['creationflags']=flags|subprocess.CREATE_NO_WINDOW
        si=kwargs.get('startupinfo') or subprocess.STARTUPINFO()
        si.dwFlags|=subprocess.STARTF_USESHOWWINDOW;si.wShowWindow=0
        kwargs['startupinfo']=si
    return kwargs

def popen(args,**kwargs):return subprocess.Popen(args,**hidden_kwargs(**kwargs))
def run(args,**kwargs):return subprocess.run(args,**hidden_kwargs(**kwargs))
def powershell_args(code,exe='powershell.exe'):
    return [str(exe),'-NoLogo','-NoProfile','-NonInteractive','-Command',code]
