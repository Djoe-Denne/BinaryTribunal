/* Production v19 exports and actual host E9/E8 execution, isolated PE32 host
 * deliberately relocated to 0x500000. No installed AF3DN.P or game process.
 * All import seams are in this candidate only; PIN is real except case D.
 */
#define GFXPT_EXTRA_NO_MAIN
#include "harness_lot25_v18_extra.c"

typedef int (__cdecl *BootFn)(void*);
typedef int (__cdecl *QueryFn)(DWORD*,DWORD);
typedef HANDLE (WINAPI *OpenThreadFn)(DWORD,BOOL,DWORD);
typedef BOOL (WINAPI *ContextFn)(HANDLE,LPCONTEXT);
typedef HANDLE (WINAPI *SnapshotFn)(DWORD,DWORD);
typedef DWORD (WINAPI *ResumeFn)(HANDLE);
static BootFn v_boot;
static StageFn v_stop;
static QueryFn v_query;
static BYTE *v_present,*v_ods;
static BYTE v_presentWindow[16],v_odsWindow[17];
static DWORD v_status[32],v_second[2],v_pinCalls,v_genericFaults;
static DWORD *v_openSlot,*v_contextSlot,*v_snapshotSlot;
static DWORD v_openOriginal,v_contextOriginal,v_snapshotOriginal;
static OpenThreadFn v_open;
static ContextFn v_context;
static SnapshotFn v_snapshot;
static DWORD *v_resumeSlot,v_resumeOriginal;
static ResumeFn v_resume;
static int v_resumeFault;
static volatile LONG v_run,v_calls,v_errors;
static int v_failProtect,v_failFlush,v_mutation;
static const DWORD v_sentinel=0x191901;

static int GenericOriginal(void)
{
    return memcmp(v_present-4,v_presentWindow,16)==0 && memcmp(v_ods-4,v_odsWindow,17)==0;
}

static void Query(const char* phase)
{
    unsigned i;
    memset(v_status,0xCC,sizeof(v_status));
    Check("query_size",v_query(v_status,sizeof(v_status))==128);
    Check("query_identity",v_status[0]==0x39314744&&v_status[1]==128&&v_status[2]==0x5648&&
          v_status[3]==GetCurrentProcessId()&&v_status[4]==(DWORD)g_dll);
    Check("diagnostic_no_proxy_native_capture",v_status[22]==0&&v_status[23]==0&&
          v_status[24]==0&&v_status[25]==0&&v_status[26]==0);
    printf("{\"event\":\"DG19\",\"phase\":\"%s\",\"words\":[",phase);
    for(i=0;i<32;++i)printf("%s%lu",i?",":"",v_status[i]);
    printf("]}\n");
}

static BOOL WINAPI GenericPin(DWORD flags,LPCSTR address,HMODULE* retained)
{
    BOOL ok;
    ++v_pinCalls;
    Check("generic_pin_before_all_host_writes",
          (g_case=='E' ? (memcmp(v_present-4,v_presentWindow,16)==0 &&
                          v_ods[0]==(BYTE)(s_ods[0]^0x80) &&
                          memcmp(v_ods+1,v_odsWindow+5,12)==0) : GenericOriginal()) &&
          Original(0)&&Original(1));
    Check("generic_pin_outside_own_DllMain",U32(g_stage0InDllMain)==0);
    Check("generic_pin_flags",flags==(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_PIN));
    if(g_case=='D'||g_case=='Y'){SetLastError(ERROR_ACCESS_DENIED);return FALSE;}
    ok=g_realPin(flags,address,retained);
    Check("generic_pin_real_confirmed",ok&&retained&&*retained==g_dll);
    return ok;
}

static BOOL WINAPI GenericProtect(LPVOID p,SIZE_T size,DWORD prot,PDWORD old)
{
    int i=p==v_present?0:(p==v_ods?1:-1);
    if(v_failProtect&&i>=0&&size==(i?9u:8u)&&++v_second[i]==2)
    {++v_genericFaults;SetLastError(ERROR_ACCESS_DENIED);return FALSE;}
    return g_realProtect(p,size,prot,old);
}

static BOOL WINAPI GenericFlush(HANDLE process,LPCVOID p,SIZE_T size)
{
    if(v_failFlush&&((p==v_present&&size==8)||(p==v_ods&&size==9)))
    {++v_genericFaults;SetLastError(ERROR_WRITE_FAULT);return FALSE;}
    return s_realFlush(process,p,size);
}

static HANDLE WINAPI DenyOpen(DWORD access,BOOL inherit,DWORD id)
{
    (void)access;(void)inherit;(void)id;
    SetLastError(ERROR_ACCESS_DENIED);return NULL;
}

static BOOL WINAPI DenyContext(HANDLE h,LPCONTEXT c)
{
    (void)h;(void)c;SetLastError(ERROR_ACCESS_DENIED);return FALSE;
}

static DWORD WINAPI DenyResume(HANDLE h)
{
    if(v_resumeFault){SetLastError(ERROR_ACCESS_DENIED);return (DWORD)-1;}
    return v_resume(h);
}

static void* __cdecl NativeCtor(void* engine)
{
    ++s_nativeCalls;
    Check("native_constructor_engine_forwarded",engine==g_engine);
    return s_native;
}

static DWORD WINAPI Waiter(LPVOID unused)
{
    (void)unused;SetEvent(s_entered);
    return WaitForSingleObject(s_release,10000);
}

static int __cdecl ODSCallee(void)
{
    if(g_case=='I'){SetEvent(s_entered);WaitForSingleObject(s_release,10000);}
    return v_sentinel;
}

static DWORD WINAPI ODSThread(LPVOID unused)
{
    (void)unused;
    __try {s_threadResult=((int (__cdecl *)(void*))v_ods)(NULL);}
    __except(EXCEPTION_EXECUTE_HANDLER){s_threadException=GetExceptionCode();}
    return s_threadException;
}

static DWORD WINAPI PresentThread(LPVOID unused)
{
    (void)unused;SetEvent(s_entered);
    __try {
        while(InterlockedCompareExchange(&v_run,0,0))
        {
            if(((PresentFn)v_present)(g_engine)!=(int)v_sentinel)InterlockedIncrement(&v_errors);
            InterlockedIncrement(&v_calls);
        }
    } __except(EXCEPTION_EXECUTE_HANDLER){InterlockedIncrement(&v_errors);s_threadException=GetExceptionCode();}
    return s_threadException;
}

static DWORD WINAPI NeighborThread(LPVOID unused)
{
    BYTE changed;
    (void)unused;
    if(WaitForSingleObject(s_entered,10000)==WAIT_OBJECT_0)
    {
        changed=g_original[0][11]^0x5A;
        HostWrite(g_site[0]+7,&changed,1);
        SetEvent(s_release);
    }
    return 0;
}

static HANDLE WINAPI SnapshotAfterMutation(DWORD flags,DWORD pid)
{
    if(!v_mutation++)
    {
        SetEvent(s_entered);
        Check("concurrent_neighbor_mutation_completed",WaitForSingleObject(s_release,5000)==WAIT_OBJECT_0);
    }
    return v_snapshot(flags,pid);
}

static void PrepareGeneric(void)
{
    BYTE* host=(BYTE*)GetModuleHandleA(NULL);
    BYTE presentEnd[]={0x58,0x8B,0xE5,0x5D,0xB8,1,0x19,0x19,0,0xC3};
    BYTE odsEnd[]={0x8B,0xE5,0x5D,0xC3};
    BYTE jump[]={0xE9,0,0,0,0};
    v_present=host+0x1DF0C;v_ods=host+0x3D99;
    HostWrite(v_present,s_present,8);HostWrite(v_present+8,presentEnd,sizeof(presentEnd));
    HostWrite(v_ods,s_ods,9);HostWrite(v_ods+9,odsEnd,sizeof(odsEnd));
    *(DWORD*)(jump+1)=(DWORD)&ODSCallee-(DWORD)(v_ods+9+0x62A8+5);
    HostWrite(v_ods+9+0x62A8,jump,sizeof(jump));
    memcpy(v_presentWindow,v_present-4,16);memcpy(v_odsWindow,v_ods-4,17);
}

static void RestoreGenericImports(void)
{
    if(g_protectSlot&&*g_protectSlot==(DWORD)&GenericProtect)ExchangeImport(g_protectSlot,(DWORD)&GenericProtect,g_protectOriginal);
    if(s_flushSlot&&*s_flushSlot==(DWORD)&GenericFlush)ExchangeImport(s_flushSlot,(DWORD)&GenericFlush,s_flushOriginal);
    if(v_openSlot)ExchangeImport(v_openSlot,(DWORD)&DenyOpen,v_openOriginal);
    if(v_contextSlot)ExchangeImport(v_contextSlot,(DWORD)&DenyContext,v_contextOriginal);
    if(v_snapshotSlot)ExchangeImport(v_snapshotSlot,(DWORD)&SnapshotAfterMutation,v_snapshotOriginal);
    if(v_resumeSlot)ExchangeImport(v_resumeSlot,(DWORD)&DenyResume,v_resumeOriginal);
}

#ifndef GFXPT_V19_NO_MAIN
int main(int argc,char** argv)
{
    HANDLE thread=NULL;
    DWORD tid=0,beforeProtect,odsProtect;
    BYTE foreign=0;
    int ok,i;
    FILETIME exit,kernel,user;
    setvbuf(stdout,NULL,_IONBF,0);
    SetErrorMode(SEM_FAILCRITICALERRORS|SEM_NOGPFAULTERRORBOX|SEM_NOOPENFILEERRORBOX);
    if(argc!=3||strlen(argv[1])!=1||!strchr("ABCDEFGHIJKMUVWXYZ12",argv[1][0]))return 64;
    g_case=argv[1][0];
    SetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK","1");
    GetProcessTimes(GetCurrentProcess(),&g_creation,&exit,&kernel,&user);
    printf("{\"event\":\"identity\",\"case\":\"%c\",\"pid\":%lu,\"tid\":%lu,\"creation_lo\":%lu,\"creation_hi\":%lu,\"build\":%lu,\"dll_sha256\":\"%s\"}\n",
           g_case,GetCurrentProcessId(),GetCurrentThreadId(),g_creation.dwLowDateTime,g_creation.dwHighDateTime,(DWORD)CANDIDATE_BUILD_ID,CANDIDATE_DLL_SHA256);
    if(!PrepareHost())return Summary();PrepareGeneric();if(g_fails)return Summary();
    beforeProtect=Protection(v_present);odsProtect=Protection(v_ods);
    if(g_case=='C')
    {
        HANDLE f=CreateFileA("gfx_passthrough.nohook",GENERIC_WRITE,0,NULL,CREATE_NEW,FILE_ATTRIBUTE_NORMAL,NULL);
        Check("nohook_created",f!=INVALID_HANDLE_VALUE);if(f!=INVALID_HANDLE_VALUE)CloseHandle(f);
    }
    ++g_loadCalls;g_dll=LoadLibraryA(argv[2]);Check("loaded",g_dll!=NULL);if(!g_dll)return Summary();
    g_install=(StageFn)GetProcAddress(g_dll,"Passthrough_InstallStage0Hooks");
    g_restore=(StageFn)GetProcAddress(g_dll,"Passthrough_RestoreStage0Hooks");
    g_stub=GetProcAddress(g_dll,"Passthrough_Stage0Stub");
    v_boot=(BootFn)GetProcAddress(g_dll,"Passthrough_InstallBootHook");
    v_stop=(StageFn)GetProcAddress(g_dll,"Passthrough_StopDiagnostic");
    v_query=(QueryFn)GetProcAddress(g_dll,"Passthrough_QueryDiagnostic");
    Check("diagnostic_exports",g_install&&g_restore&&g_stub&&v_boot&&v_stop&&v_query);
    if(g_fails)return Summary();
    Query("attached");Check("attach_has_no_code_writes",GenericOriginal()&&Original(0)&&Original(1)&&v_status[5]==0);
    if(g_case=='X')
    {
        BYTE jump[]={0xE9,0,0,0,0};
        BYTE* ctor=(BYTE*)GetModuleHandleA(NULL)+0x257D0;
        void* (__cdecl *factory)(void*)=(void* (__cdecl *)(void*))GetProcAddress(g_dll,"new_dll_graphics_driver");
        *(DWORD*)(jump+1)=(DWORD)&NativeCtor-(DWORD)(ctor+5);HostWrite(ctor,jump,5);
        Check("native_constructor_result_identity",factory(g_engine)==s_native&&s_nativeCalls==1);
        Query("native_only");Check("factory_does_not_publish_DLL_callbacks",v_status[5]==0&&GenericOriginal());
        ReleaseOnlyReference(argv[2],0);return Summary();
    }
    if(g_case=='A')
    {
        ReleaseOnlyReference(argv[2],0);
        Check("prepin_unload_has_no_dangling_hooks",GenericOriginal()&&Original(0)&&Original(1));return Summary();
    }
    g_pinSlot=ImportSlot("GetModuleHandleExA");g_pinOriginal=*g_pinSlot;g_realPin=(PinFn)g_pinOriginal;
    ExchangeImport(g_pinSlot,g_pinOriginal,(DWORD)&GenericPin);
    s_entered=CreateEventA(NULL,TRUE,FALSE,NULL);s_release=CreateEventA(NULL,TRUE,FALSE,NULL);
    Check("events",s_entered&&s_release);
    if(g_case=='Y')
    {
        Install("stage0_pin_refused",0);Install("stage0_pin_refusal_terminal",0);
        Query("pin_refused");Check("stage0_pin_refusal_zero_writes",GenericOriginal()&&Original(0)&&Original(1)&&v_status[5]==0&&v_status[29]==0&&v_pinCalls==1);
        ReleaseOnlyReference(argv[2],0);return Summary();
    }
    if(g_case=='Z')
    {
        Install("stage0_arm",1);InstallProtectFault();g_failRestore=1;
        Restore("initial_RWX_refused",0);Check("initial_RWX_failure_retains_ownership",OwnedMask()==3);
        g_failRestore=0;Restore("initial_RWX_retry",1);Windows("retry",0);
        ResetImports();ReleaseOnlyReference(argv[2],1);return Summary();
    }
    if(g_case=='1'||g_case=='2')
    {
        DWORD stageProtection=Protection(g_site[0]);
        if(g_case=='1')
        {
            g_protectSlot=ImportSlot("VirtualProtect");g_protectOriginal=*g_protectSlot;g_realProtect=(ProtectFn)g_protectOriginal;
            ExchangeImport(g_protectSlot,g_protectOriginal,(DWORD)&FaultProtect);
        }
        else
        {
            s_flushSlot=ImportSlot("FlushInstructionCache");s_flushOriginal=*s_flushSlot;s_realFlush=(FlushFn)s_flushOriginal;
            ExchangeImport(s_flushSlot,s_flushOriginal,(DWORD)&FaultFlush);
        }
        s_fault=1;Install("write_followup_failure_refused",0);s_fault=0;
        if(g_case=='1')Check("install_protection_failure_rolled_back",g_protectFaults==2&&OwnedMask()==0);
        else {Check("failed_rollback_retains_ownership",OwnedMask()==3);Restore("rollback_cache_retry",1);}
        Windows("rollback",0);Check("rollback_page_protection",Protection(g_site[0])==stageProtection);
        ResetExtraImports();ReleaseOnlyReference(argv[2],1);return Summary();
    }
    if(g_case=='M')
    {
        v_snapshotSlot=ImportSlot("CreateToolhelp32Snapshot");v_snapshotOriginal=*v_snapshotSlot;v_snapshot=(SnapshotFn)v_snapshotOriginal;
        ExchangeImport(v_snapshotSlot,v_snapshotOriginal,(DWORD)&SnapshotAfterMutation);
        thread=CreateThread(NULL,0,NeighborThread,NULL,0,&tid);
        Install("neighbor_race_refuses_activation",0);
        Check("neighbor_preserved",g_site[0][7]==(BYTE)(g_original[0][11]^0x5A));
        Check("neighbor_race_no_owned_E8",OwnedMask()==0&&memcmp(g_site[0],g_preimage,6)==0&&Original(1));
        Check("neighbor_worker_joined",thread&&WaitForSingleObject(thread,5000)==WAIT_OBJECT_0);
        RestoreGenericImports();ReleaseOnlyReference(argv[2],1);return Summary();
    }
    if(g_case=='J'||g_case=='K'||g_case=='W')
    {
        thread=CreateThread(NULL,0,Waiter,NULL,0,&tid);
        Check("peer_waiting",thread&&WaitForSingleObject(s_entered,5000)==WAIT_OBJECT_0);
        if(g_case=='J')
        {
            v_openSlot=ImportSlot("OpenThread");v_openOriginal=*v_openSlot;v_open=(OpenThreadFn)v_openOriginal;
            ExchangeImport(v_openSlot,v_openOriginal,(DWORD)&DenyOpen);
        }
        else if(g_case=='K')
        {
            v_contextSlot=ImportSlot("GetThreadContext");v_contextOriginal=*v_contextSlot;v_context=(ContextFn)v_contextOriginal;
            ExchangeImport(v_contextSlot,v_contextOriginal,(DWORD)&DenyContext);
        }
        else
        {
            v_resumeSlot=ImportSlot("ResumeThread");v_resumeOriginal=*v_resumeSlot;v_resume=(ResumeFn)v_resumeOriginal;
            ExchangeImport(v_resumeSlot,v_resumeOriginal,(DWORD)&DenyResume);v_resumeFault=1;
        }
    }
    if(g_case=='W')
    {
        Check("resume_failure_refuses_activation",v_boot(NULL)==0);
        Query("resume_debt");Check("resume_failure_retains_debt_and_owned_hook",v_status[12]==1&&v_status[7]==1&&v_status[5]==1);
        Check("resume_debt_remains_until_recoverable",v_stop()==0);
        v_resumeFault=0;Check("resume_debt_and_hooks_recovered",v_stop()==1&&GenericOriginal());
        Query("recovered");Check("resume_debt_cleared",v_status[12]==0&&v_status[7]==0);
        SetEvent(s_release);Check("resume_retry_releases_peer",WaitForSingleObject(thread,5000)==WAIT_OBJECT_0);
        RestoreGenericImports();ReleaseOnlyReference(argv[2],1);return Summary();
    }
    if(g_case=='E'){foreign=v_ods[0]^0x80;HostWrite(v_ods,&foreign,1);}
    if(g_case=='C'||g_case=='D'||g_case=='E'||g_case=='J'||g_case=='K')
    {
        Check("activation_refused",v_boot(NULL)==0);
        if(g_case=='E'){Check("foreign_preimage_not_overwritten",v_ods[0]==foreign);HostWrite(v_ods,s_ods,9);}
        Check("refusal_no_host_hooks",GenericOriginal()&&Original(0)&&Original(1));
        Query("refused");Check("refusal_no_owned_generic",v_status[7]==0&&v_status[10]==0);
        Check("refusal_is_terminal",v_boot(NULL)==0);
        RestoreGenericImports();
        if(thread){SetEvent(s_release);Check("failed_quiescence_resumes_peer",WaitForSingleObject(thread,5000)==WAIT_OBJECT_0);}
        ReleaseOnlyReference(argv[2],g_case=='C'||g_case=='D'?0:1);return Summary();
    }
    if(g_case=='U'||g_case=='V')
    {
        Install("stage0_install",1);Query("stage0_armed");
        Check("stage0_module_retained",v_status[5]==1&&v_status[6]==1&&v_status[8]==3);
        if(g_case=='U')
        {
            foreign=g_site[0][1]^0x5A;HostWrite(g_site[0]+1,&foreign,1);
            Restore("foreign_owned_byte_refused",0);
            Check("foreign_owned_byte_preserved",g_site[0][1]==foreign&&(OwnedMask()&1));
            foreign^=0x5A;HostWrite(g_site[0]+1,&foreign,1);
            Restore("owner_repair_retry",1);
        }
        else
        {
            /* Production exported stub with a synthetic stdcall callee;
             * dedicated in-flight real-site proof is extra profile case N. */
            SetEvent(s_release);s_deviceVT[0x98/4]=(DWORD)&FakeSetTexture;s_device[0]=(DWORD)s_deviceVT;
            __asm {
                mov esi,esp
                push 12345678h
                push 0
                push offset s_device
                mov eax,offset s_deviceVT
                call DWORD PTR [g_stub]
                mov s_threadResult,eax
                mov eax,esp
                sub eax,esi
                mov s_threadException,eax
            }
            Check("direct_stub_ret12_and_hresult",s_threadException==0&&s_threadResult==0x1234ABCD);
            Restore("restore",1);
        }
        Windows("stage0_restored",0);Check("stop_after_stage0",v_stop()==1);Query("retained");
        ReleaseOnlyReference(argv[2],1);return Summary();
    }
    Check("generic_activated",v_boot(NULL)==1);Query("active");
    Check("generic_pin_and_ownership",v_pinCalls==1&&v_status[5]==1&&v_status[7]==3&&v_status[10]==1);
    Check("generic_idempotence",v_boot(NULL)==1&&v_pinCalls==1);
    if(g_fails)return Summary();
    {
        BYTE* tramp=(BYTE*)U32(g_odsTrampoline);
        DWORD callTarget=(DWORD)tramp+9+*(DWORD*)(tramp+5);
        DWORD back=(DWORD)tramp+14+*(DWORD*)(tramp+10);
        Check("relocated_call",callTarget==(DWORD)v_ods+9+0x62A8);
        Check("relocated_return",back==(DWORD)v_ods+9);
        Check("trampolines_RX",Protection(tramp)==PAGE_EXECUTE_READ&&Protection((void*)U32(g_pdTrampoline))==PAGE_EXECUTE_READ);
    }
    g_engine[0xA74/4]=(DWORD)s_native;
    Check("actual_Present_detour_and_trampoline",((PresentFn)v_present)(g_engine)==(int)v_sentinel);
    Check("engine_native_pointer_unchanged",g_engine[0xA74/4]==(DWORD)s_native);
    Check("Present_never_auto_arms_stage0",Original(0)&&Original(1)&&U32(g_stage0Activation)==0);
    if(g_case!='I')Check("actual_ODS_detour_and_trampoline",((int (__cdecl *)(void*))v_ods)(NULL)==(int)v_sentinel);
    if(g_case=='F')
    {
        g_protectSlot=ImportSlot("VirtualProtect");g_protectOriginal=*g_protectSlot;g_realProtect=(ProtectFn)g_protectOriginal;
        ExchangeImport(g_protectSlot,g_protectOriginal,(DWORD)&GenericProtect);v_failProtect=1;
        Check("generic_protection_failure",v_stop()==0&&v_genericFaults==2);v_failProtect=0;
    }
    if(g_case=='G')
    {
        s_flushSlot=ImportSlot("FlushInstructionCache");s_flushOriginal=*s_flushSlot;s_realFlush=(FlushFn)s_flushOriginal;
        ExchangeImport(s_flushSlot,s_flushOriginal,(DWORD)&GenericFlush);v_failFlush=1;
        Check("generic_flush_failure",v_stop()==0&&v_genericFaults==2);v_failFlush=0;
    }
    if(g_case=='I')
    {
        thread=CreateThread(NULL,0,ODSThread,NULL,0,&tid);
        Check("ODS_inflight_inside_original_callee",thread&&WaitForSingleObject(s_entered,5000)==WAIT_OBJECT_0);
    }
    if(g_case=='H')
    {
        v_run=1;thread=CreateThread(NULL,0,PresentThread,NULL,0,&tid);
        Check("concurrent_present_started",thread&&WaitForSingleObject(s_entered,5000)==WAIT_OBJECT_0);
        for(i=0;i<200&&v_calls<100;++i)Sleep(1);
        Check("concurrent_present_observed",v_calls>=100);
    }
    ok=0;for(i=0;i<200&&!ok;++i){ok=v_stop();if(!ok)Sleep(1);}
    Check("generic_restore_succeeded",ok==1);
    Check("generic_byte_exact_restore",GenericOriginal());
    Check("generic_original_protection",Protection(v_present)==beforeProtect&&Protection(v_ods)==odsProtect);
    if(thread)
    {
        if(g_case=='H')InterlockedExchange(&v_run,0);
        SetEvent(s_release);Check("inflight_thread_joined",WaitForSingleObject(thread,5000)==WAIT_OBJECT_0);
        Check("inflight_no_exception",s_threadException==0&&v_errors==0);
        if(g_case=='I')Check("retained_ODS_trampoline_return",s_threadResult==v_sentinel);
    }
    RestoreGenericImports();Query("restored");
    Check("restored_retained_state",v_status[5]==1&&v_status[7]==0&&v_status[8]==0&&v_status[10]==0&&v_status[12]==0);
    Check("activation_cannot_rearm",v_boot(NULL)==0&&GenericOriginal());
    Check("retained_Present_trampoline_executable",((PresentFn)U32(g_pdTrampoline))(g_engine)==(int)v_sentinel);
    Check("stop_idempotent",v_stop()==1);
    ReleaseOnlyReference(argv[2],1);return Summary();
}
#endif
