/* Isolated native adversarial cases extending the frozen v18 harness.
 * Never loads installed AF3DN.P. See gate_lot25_v18_extra.py for exact hashes.
 * J: failed restoration of page protection and retry; K: I-cache failure;
 * L: denied lifecycle IO; M: production slot 1; N: in-flight site return;
 * O: changed neighbor readback; P: simultaneous activation; Q: relocated
 * generic trampoline; R: actual attach hooks followed by pre-PIN unload.
 * Red results are failures, never waived successes. No game process involved.
 */
#define main FrozenLifecycleMain
#include "harness_lot25_v18_lifecycle.c"
#undef main

typedef BOOL (WINAPI *FlushFn)(HANDLE, LPCVOID, SIZE_T);
typedef int (__cdecl *HookFn)(unsigned long,const BYTE*,int,int,void*,void* volatile*);
static DWORD *s_flushSlot, s_flushOriginal, s_protectPhase[2];
static FlushFn s_realFlush;
static int s_fault, s_pausePin;
static HANDLE s_entered, s_release;
static DWORD s_nativeCalls, s_threadException, s_threadResult, s_threadInstall;
static DWORD s_deviceVT[40], s_device[1], s_native[66];
static const BYTE s_present[8]={0x55,0x8B,0xEC,0x51,0x8B,0x45,0x08,0x50};
static const BYTE s_ods[9]={0x55,0x8B,0xEC,0x51,0xE8,0xA8,0x62,0,0};

static DWORD Protection(void* p)
{
    MEMORY_BASIC_INFORMATION m;
    return VirtualQuery(p,&m,sizeof(m))==sizeof(m) ? m.Protect : 0;
}

static void HostWrite(BYTE* p,const BYTE* bytes,DWORD n)
{
    DWORD old,ignored;
    Check("owned_host_write_bounds",p>=g_pad && p+n<=g_pad+sizeof(g_pad));
    if(g_fails)return;
    Check("owned_host_write_protect",VirtualProtect(p,n,PAGE_EXECUTE_READWRITE,&old)!=0);
    memcpy(p,bytes,n);
    Check("owned_host_write_restore",VirtualProtect(p,n,old,&ignored)!=0);
    Check("owned_host_write_flush",FlushInstructionCache(GetCurrentProcess(),p,n)!=0);
}

static BOOL WINAPI FaultProtect(LPVOID p,SIZE_T n,DWORD prot,PDWORD old)
{
    int i;
    for(i=0;i<2;++i)if(s_fault && n==6 && p==g_site[i])
    {
        ++s_protectPhase[i];
        if(s_protectPhase[i]==2)
        {
            ++g_protectFaults;
            printf("{\"event\":\"protect_return_fault\",\"site\":%d,\"requested\":%lu}\n",i,prot);
            SetLastError(ERROR_ACCESS_DENIED);return FALSE;
        }
    }
    return g_realProtect(p,n,prot,old);
}

static BOOL WINAPI FaultFlush(HANDLE h,LPCVOID p,SIZE_T n)
{
    if(s_fault && n==6 && (p==g_site[0] || p==g_site[1]))
    {
        printf("{\"event\":\"flush_fault\",\"address\":%lu}\n",(DWORD)p);
        SetLastError(ERROR_WRITE_FAULT);return FALSE;
    }
    return s_realFlush(h,p,n);
}

static BOOL WINAPI PausePin(DWORD flags,LPCSTR addr,HMODULE* result)
{
    if(s_pausePin){SetEvent(s_entered);WaitForSingleObject(s_release,10000);}
    return ObservePin(flags,addr,result);
}

static DWORD WINAPI InstallThread(LPVOID ignored)
{
    (void)ignored;s_threadInstall=(DWORD)g_install();return s_threadInstall;
}

static int __cdecl FakeUninit(void* engine)
{
    ++s_nativeCalls;
    Check("slot1_native_forward_engine",engine==g_engine);
    Check("slot1_restore_precedes_native",Original(0)&&Original(1)&&U32(g_stage0Armed)==0);
    return 0x181801;
}

static DWORD WINAPI FakeSetTexture(void* device,DWORD stage,void* texture)
{
    ++s_nativeCalls;
    Check("inflight_native_arguments",device==s_device && stage==0 && texture==(void*)0x12345678);
    SetEvent(s_entered);
    if(WaitForSingleObject(s_release,10000)!=WAIT_OBJECT_0)return 0xDEAD;
    return 0x1234ABCD;
}

static __declspec(naked) DWORD CallSite(void)
{
    __asm {
        push ebx
        push esi
        push edi
        push ebp
        push offset site_return
        push 12345678h
        push 0
        push offset s_device
        mov eax,offset s_deviceVT
        jmp DWORD PTR [g_site]
site_return:
        pop ebp
        pop edi
        pop esi
        pop ebx
        ret
    }
}

static DWORD WINAPI SiteThread(LPVOID ignored)
{
    (void)ignored;
    __try {s_threadResult=CallSite();}
    __except(EXCEPTION_EXECUTE_HANDLER) {s_threadException=GetExceptionCode();}
    return s_threadException;
}

static void ResetExtraImports(void)
{
    if(g_protectSlot && *g_protectSlot==(DWORD)&FaultProtect)
        ExchangeImport(g_protectSlot,(DWORD)&FaultProtect,g_protectOriginal);
    if(s_flushSlot && *s_flushSlot==(DWORD)&FaultFlush)
        ExchangeImport(s_flushSlot,(DWORD)&FaultFlush,s_flushOriginal);
    if(g_pinSlot && *g_pinSlot==(DWORD)&PausePin)
        ExchangeImport(g_pinSlot,(DWORD)&PausePin,g_pinOriginal);
}

#ifndef GFXPT_EXTRA_NO_MAIN
int main(int argc,char** argv)
{
    DWORD protectionBefore,ignored,threadExit;
    HANDLE deny=INVALID_HANDLE_VALUE,thread=NULL;
    BYTE* host=(BYTE*)GetModuleHandleA(NULL);
    BYTE* generic=host+0x21000;
    BYTE changed;
    void* volatile trampoline=NULL;
    int result;
    FILETIME exited,kernel,user;
    setvbuf(stdout,NULL,_IONBF,0);
    SetErrorMode(SEM_FAILCRITICALERRORS|SEM_NOGPFAULTERRORBOX|SEM_NOOPENFILEERRORBOX);
    if(argc!=3 || strlen(argv[1])!=1 || argv[1][0]<'J' || argv[1][0]>'R')return 64;
    g_case=argv[1][0];
    SetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK",g_case=='R' ? "1" : "0");
    Check("process_identity",GetProcessTimes(GetCurrentProcess(),&g_creation,&exited,&kernel,&user)!=0);
    printf("{\"event\":\"identity\",\"case\":\"%c\",\"pid\":%lu,\"tid\":%lu,\"creation_lo\":%lu,\"creation_hi\":%lu,\"build\":%lu,\"dll_sha256\":\"%s\",\"host_base\":%lu}\n",
        g_case,GetCurrentProcessId(),GetCurrentThreadId(),g_creation.dwLowDateTime,g_creation.dwHighDateTime,(DWORD)CANDIDATE_BUILD_ID,CANDIDATE_DLL_SHA256,(DWORD)host);
    if(!PrepareHost())return Summary();
    if(g_case=='N')
    {
        BYTE continuation[4]={0xC3,0xCC,0xCC,0xCC};
        HostWrite(g_site[0]+6,continuation,4);memcpy(g_original[0]+10,continuation,4);
    }
    if(g_case=='R'){HostWrite(host+0x1DF0C,s_present,8);HostWrite(host+0x3D99,s_ods,9);}
    if(g_case=='L')
    {
        deny=CreateFileA("gfx_passthrough_lifecycle.bin",GENERIC_READ|GENERIC_WRITE,0,NULL,CREATE_NEW,FILE_ATTRIBUTE_NORMAL,NULL);
        Check("exclusive_lifecycle_file_open",deny!=INVALID_HANDLE_VALUE);
    }
    if(g_fails)return Summary();
    ++g_loadCalls;g_dll=LoadLibraryA(argv[2]);Check("candidate_loaded",g_dll!=NULL);
    if(!g_dll)return Summary();
    g_install=(StageFn)GetProcAddress(g_dll,"Passthrough_InstallStage0Hooks");
    g_restore=(StageFn)GetProcAddress(g_dll,"Passthrough_RestoreStage0Hooks");
    g_stub=GetProcAddress(g_dll,"Passthrough_Stage0Stub");
    Check("exports",g_install&&g_restore&&g_stub);
    Snapshot("attached");
    if(g_case=='R')
    {
        Check("real_attach_hooks_installed",host[0x1DF0C]==0xE9&&host[0x3D99]==0xE9);
        Check("before_first_PIN",U32(g_stage0Pinned)==0&&U32(g_stage0PinAttempts)==0);
        ReleaseOnlyReference(argv[2],0);
        printf("{\"event\":\"prepin_unload\",\"present_first_byte\":%u,\"ods_first_byte\":%u}\n",host[0x1DF0C],host[0x3D99]);
        Check("unload_has_no_dangling_Present_E9",memcmp(host+0x1DF0C,s_present,8)==0);
        Check("unload_has_no_dangling_ODS_E9",memcmp(host+0x3D99,s_ods,9)==0);
        return Summary();
    }
    if(g_case=='Q')
    {
        HookFn hook=(HookFn)((BYTE*)g_dll+RVA_GFXPT_PlaceHook);
        DWORD back,callTarget;
        HostWrite(generic,s_ods,9);
        if(g_fails)return Summary();
        result=hook(0x421000,s_ods,9,4,(void*)&SyntheticPresentReturn,&trampoline);
        Check("generic_hook_installed",result==1&&trampoline!=NULL);
        if(trampoline)
        {
            back=(DWORD)trampoline+14+*(DWORD*)((BYTE*)trampoline+10);
            callTarget=(DWORD)trampoline+9+*(DWORD*)((BYTE*)trampoline+5);
            printf("{\"event\":\"trampoline_targets\",\"host_base\":%lu,\"back\":%lu,\"expected_back\":%lu,\"call\":%lu,\"expected_call\":%lu}\n",(DWORD)host,back,(DWORD)generic+9,callTarget,(DWORD)generic+9+0x62A8);
            Check("generic_jump_relocated_to_actual_host",back==(DWORD)generic+9);
            Check("generic_call_relocated_to_actual_host",callTarget==(DWORD)generic+9+0x62A8);
        }
        return Summary();
    }
    if(!InstallPinObserver())return Summary();
    s_entered=CreateEventA(NULL,TRUE,FALSE,NULL);s_release=CreateEventA(NULL,TRUE,FALSE,NULL);
    Check("test_events_created",s_entered&&s_release);
    if(g_case=='P')
    {
        ExchangeImport(g_pinSlot,(DWORD)&ObservePin,(DWORD)&PausePin);s_pausePin=1;
        thread=CreateThread(NULL,0,InstallThread,NULL,0,NULL);
        Check("first_activation_blocked_before_PIN",thread&&WaitForSingleObject(s_entered,5000)==WAIT_OBJECT_0);
        Install("concurrent_activation_refused",0);
        Check("no_writes_while_activation_busy",Original(0)&&Original(1)&&U32(g_stage0PatchWrites)==0);
        SetEvent(s_release);Check("activation_thread_joined",WaitForSingleObject(thread,5000)==WAIT_OBJECT_0);
        Check("single_successful_activation",s_threadInstall==1&&g_pinCalls==1&&U32(g_stage0PatchWrites)==2);
        ResetExtraImports();Restore("serialized_restore",1);Windows("final",0);
        ReleaseOnlyReference(argv[2],1);CloseHandle(thread);return Summary();
    }
    Install("arm",1);Windows("armed",1);protectionBefore=Protection(g_site[0]);
    Check("native_text_protection_not_RWX",protectionBefore==PAGE_EXECUTE_READ);
    if(g_fails)return Summary();
    if(g_case=='J')
    {
        g_protectSlot=ImportSlot("VirtualProtect");g_protectOriginal=*g_protectSlot;g_realProtect=(ProtectFn)g_protectOriginal;
        ExchangeImport(g_protectSlot,g_protectOriginal,(DWORD)&FaultProtect);s_fault=1;
        Restore("return_protection_failure",0);Check("both_second_protects_failed",g_protectFaults==2);
        Check("ownership_retained_on_protection_failure",OwnedMask()==3&&U32(g_stage0Pinned)==1);
        s_fault=0;Restore("retry",1);Windows("retry",0);
        printf("{\"event\":\"protection_retry\",\"before\":%lu,\"after\":%lu}\n",protectionBefore,Protection(g_site[0]));
        Check("retry_restores_original_page_protection",Protection(g_site[0])==protectionBefore);
    }
    else if(g_case=='K')
    {
        s_flushSlot=ImportSlot("FlushInstructionCache");s_flushOriginal=*s_flushSlot;s_realFlush=(FlushFn)s_flushOriginal;
        ExchangeImport(s_flushSlot,s_flushOriginal,(DWORD)&FaultFlush);s_fault=1;
        Restore("cache_failure",0);Check("cache_failure_retains_ownership",OwnedMask()==3&&U32(g_stage0Pinned)==1);
        s_fault=0;Restore("cache_retry",1);Windows("retry",0);
    }
    else if(g_case=='M')
    {
        PresentFn detour=(PresentFn)((BYTE*)g_dll+RVA_GFXPT_PresentDetour);
        StageFn unused=NULL; (void)unused;
        s_native[1]=(DWORD)&FakeUninit;g_engine[0xA74/4]=(DWORD)s_native;
        U32(g_pdTrampoline)=(DWORD)&SyntheticPresentReturn;
        Check("production_present_with_native",detour(g_engine)==PRESENT_SENTINEL);U32(g_pdTrampoline)=0;
        Check("production_proxy_published",g_engine[0xA74/4]==U32(g_proxy)&&U32(g_proxy)!=0);
        result=((int (__cdecl *)(void*))((DWORD*)U32(g_proxy))[1])(g_engine);
        Check("slot1_forward_result",result==0x181801&&s_nativeCalls==1);
        Check("slot1_native_no_longer_alive",U32(g_nativeAlive)==0);Windows("slot1_restored",0);
        result=((int (__cdecl *)(void*))((DWORD*)U32(g_proxy))[1])(g_engine);
        Check("slot1_duplicate_no_native_forward",result==0&&s_nativeCalls==1);
    }
    else if(g_case=='N')
    {
        s_deviceVT[0x98/4]=(DWORD)&FakeSetTexture;s_device[0]=(DWORD)s_deviceVT;
        thread=CreateThread(NULL,0,SiteThread,NULL,0,NULL);
        Check("stub_inside_native_callee",thread&&WaitForSingleObject(s_entered,5000)==WAIT_OBJECT_0);
        Restore("restore_while_stub_inflight",1);Windows("restored_while_inflight",0);
        SetEvent(s_release);Check("inflight_thread_joined",WaitForSingleObject(thread,5000)==WAIT_OBJECT_0);
        GetExitCodeThread(thread,&threadExit);
        printf("{\"event\":\"inflight_return\",\"exception\":%lu,\"thread_exit\":%lu,\"result\":%lu}\n",s_threadException,threadExit,s_threadResult);
        Check("inflight_stub_return_transparent_after_restore",s_threadException==0&&s_threadResult==0x1234ABCD);
        CloseHandle(thread);
    }
    else if(g_case=='O')
    {
        changed=g_original[0][11]^0x55;HostWrite(g_site[0]+7,&changed,1);
        Restore("neighbor_changed",0);Check("neighbor_not_overwritten",g_site[0][7]==changed);
        Check("neighbor_failure_retains_site",(OwnedMask()&1)!=0);
        HostWrite(g_site[0]+7,g_original[0]+11,1);Restore("neighbor_repaired_by_host",1);Windows("retry",0);
    }
    else Restore("normal_restore",1);
    ResetExtraImports();ReleaseOnlyReference(argv[2],1);
    if(deny!=INVALID_HANDLE_VALUE)CloseHandle(deny);
    VirtualProtect(g_site[0],6,protectionBefore,&ignored); /* harness-owned cleanup after observation */
    return Summary();
}
#endif
