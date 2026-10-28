/* Persistent, isolated host for the external controller's OFFLINE gate. */
#define GFXPT_V19_NO_MAIN
#include "harness_lot25_v19_lifecycle.c"

int main(int argc,char** argv)
{
    int command;
    FILETIME exit,kernel,user;
    setvbuf(stdout,NULL,_IONBF,0);
    if(argc!=2)return 64;
    g_case='B';SetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK","1");
    SetErrorMode(SEM_FAILCRITICALERRORS|SEM_NOGPFAULTERRORBOX|SEM_NOOPENFILEERRORBOX);
    if(!PrepareHost())return 2;PrepareGeneric();if(g_fails)return 2;
    g_dll=LoadLibraryA(argv[1]);if(!g_dll)return 2;
    GetProcessTimes(GetCurrentProcess(),&g_creation,&exit,&kernel,&user);
    printf("{\"event\":\"ready\",\"pid\":%lu,\"creation_lo\":%lu,\"creation_hi\":%lu}\n",
           GetCurrentProcessId(),g_creation.dwLowDateTime,g_creation.dwHighDateTime);
    while((command=getchar())!=EOF && command!='q')
    {
        if(command=='p')
        {
            Check("remote_present",((PresentFn)v_present)(g_engine)==(int)v_sentinel);
            Check("remote_ODS",((int (__cdecl *)(void*))v_ods)(NULL)==(int)v_sentinel);
            printf("{\"event\":\"frame\",\"fails\":%lu}\n",g_fails);
        }
    }
    FreeLibrary(g_dll);
    return g_fails?2:0;
}
