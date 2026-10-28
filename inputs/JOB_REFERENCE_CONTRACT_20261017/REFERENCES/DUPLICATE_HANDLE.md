---
layout: Conceptual
title: DuplicateHandle function (handleapi.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-duplicatehandle
adobe-target: true
breadcrumb_path: /windows/desktop/api/breadcrumb/toc.json
uhfHeaderId: MSDocsHeader-WinDevCenter
ms.service: windows-api-desktop-tech
ms.subservice: sdk-api-reference
ms.topic: reference
ms.author: kbridge
author: karl-bridge-microsoft
feedback_system: Standard
feedback_product_url: https://www.microsoft.com/en-us/windowsinsider/feedbackhub/fb
feedback_help_link_url: https://learn.microsoft.com/answers/tags/224/windows-api-win32/
feedback_help_link_type: get-help-at-qna
UID: NF:handleapi.DuplicateHandle
description: Duplicates an object handle.
old-location: base\duplicatehandle.htm
tech.root: winprog
ms.assetid: 9c8da574-5bda-49f1-a6b6-c026639d6504
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: DUPLICATE_CLOSE_SOURCE, DUPLICATE_SAME_ACCESS, DuplicateHandle, DuplicateHandle function, _win32_duplicatehandle, base.duplicatehandle, handleapi/DuplicateHandle
req.header: handleapi.h
req.include-header: Windows.h
req.target-type: Windows
req.target-min-winverclnt: Windows 2000 Professional [desktop apps \| UWP apps]
req.target-min-winversvr: Windows 2000 Server [desktop apps \| UWP apps]
req.kmdf-ver: 
req.umdf-ver: 
req.ddi-compliance: 
req.unicode-ansi: 
req.idl: 
req.max-support: 
req.namespace: 
req.assembly: 
req.type-library: 
req.lib: Kernel32.lib
req.dll: Kernel32.dll
req.irql: 
targetos: Windows
req.typenames: 
req.redist: 
ms.custom: 19H1
topic_type:
- APIRef
- kbSyntax
api_type:
- DllExport
api_location:
- Kernel32.dll
- API-MS-Win-Core-handle-l1-1-0.dll
- KernelBase.dll
- API-MS-Win-DownLevel-Kernel32-l1-1-0.dll
- MinKernelBase.dll
api_name:
- DuplicateHandle
locale: en-us
document_id: a43c9841-b5be-55a0-8749-e7fb4d0885c3
document_version_independent_id: ae117a00-acc9-ba76-6ca5-97983d00f9e9
updated_at: 2025-05-21T02:36:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/handleapi/nf-handleapi-duplicatehandle.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/f014fff5b27fe5eb5115f15dd6762713bc73c697?path=/sdk-api-src/content/handleapi/nf-handleapi-duplicatehandle.md&_a=contents
git_commit_id: f014fff5b27fe5eb5115f15dd6762713bc73c697
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 1496
asset_id: handleapi/nf-handleapi-duplicatehandle
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/handleapi/nf-handleapi-duplicatehandle.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
platformId: 7b32b1d2-a207-d4b8-6b68-4d07a10b4ec8
---

# DuplicateHandle function (handleapi.h) - Win32 apps | Microsoft Learn

Duplicates an object handle.

## Syntax

```cpp
BOOL DuplicateHandle(
  [in]  HANDLE   hSourceProcessHandle,
  [in]  HANDLE   hSourceHandle,
  [in]  HANDLE   hTargetProcessHandle,
  [out] LPHANDLE lpTargetHandle,
  [in]  DWORD    dwDesiredAccess,
  [in]  BOOL     bInheritHandle,
  [in]  DWORD    dwOptions
);
```

## Parameters

`[in] hSourceProcessHandle`

A handle to the process with the handle to be duplicated.

The handle must have the PROCESS\_DUP\_HANDLE access right. For more information, see [Process Security and Access Rights](/en-us/windows/desktop/ProcThread/process-security-and-access-rights).

`[in] hSourceHandle`

The handle to be duplicated. This is an open object handle that is valid in the context of the source process. For a list of objects whose handles can be duplicated, see the following Remarks section.

If *hSourceHandle* is a pseudo handle returned by [GetCurrentProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-getcurrentprocess) or [GetCurrentThread](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-getcurrentthread), *hSourceProcessHandle* should be a handle to the process calling **DuplicateHandle**.

`[in] hTargetProcessHandle`

A handle to the process that is to receive the duplicated handle. The handle must have the PROCESS\_DUP\_HANDLE access right.

This parameter is optional and can be specified as NULL if the **DUPLICATE\_CLOSE\_SOURCE** flag is set in *Options*.

`[out] lpTargetHandle`

A pointer to a variable that receives the duplicate handle. This handle value is valid in the context of the target process.

If *hSourceHandle* is a pseudo handle returned by [GetCurrentProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-getcurrentprocess) or [GetCurrentThread](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-getcurrentthread), **DuplicateHandle** converts it to a real handle to a process or thread, respectively.

If *lpTargetHandle* is **NULL**, the function duplicates the handle, but does not return the duplicate handle value to the caller. This behavior exists only for backward compatibility with previous versions of this function. You should not use this feature, as you will lose system resources until the target process terminates.

This parameter is ignored if *hTargetProcessHandle* is **NULL**.

`[in] dwDesiredAccess`

The access requested for the new handle. For the flags that can be specified for each object type, see the following Remarks section.

This parameter is ignored if the *dwOptions* parameter specifies the DUPLICATE\_SAME\_ACCESS flag. Otherwise, the flags that can be specified depend on the type of object whose handle is to be duplicated.

This parameter is ignored if *hTargetProcessHandle* is **NULL**.

`[in] bInheritHandle`

A variable that indicates whether the handle is inheritable. If **TRUE**, the duplicate handle can be inherited by new processes created by the target process. If **FALSE**, the new handle cannot be inherited.

This parameter is ignored if *hTargetProcessHandle* is **NULL**.

`[in] dwOptions`

Optional actions. This parameter can be zero, or any combination of the following values.

| Value | Meaning |
| --- | --- |
| - **DUPLICATE\_CLOSE\_SOURCE**<br>- 0x00000001 | Closes the source handle. This occurs regardless of any error status returned. |
| - **DUPLICATE\_SAME\_ACCESS**<br>- 0x00000002 | Ignores the *dwDesiredAccess* parameter. The duplicate handle has the same access as the source handle. |

## Return value

If the function succeeds, the return value is nonzero.

If the function fails, the return value is zero. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

## Remarks

The duplicate handle refers to the same object as the original handle. Therefore, any changes to the object are reflected through both handles. For example, if you duplicate a file handle, the current file position is always the same for both handles. For file handles to have different file positions, use the [CreateFile](/en-us/windows/desktop/api/fileapi/nf-fileapi-createfilea) function to create file handles that share access to the same file.

**DuplicateHandle** can be called by either the source process or the target process (or a process that is both the source and target process). For example, a process can use **DuplicateHandle** to create a noninheritable duplicate of an inheritable handle, or a handle with different access than the original handle.

The source process uses the [GetCurrentProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-getcurrentprocess) function to get a handle to itself. This handle is a pseudo handle, but **DuplicateHandle** converts it to a real process handle. To get the target process handle, it may be necessary to use some form of interprocess communication (for example, a named pipe or shared memory) to communicate the process identifier to the source process. The source process can use this identifier in the [OpenProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-openprocess) function to obtain a handle to the target process.

If the process that calls **DuplicateHandle** is not also the target process, the source process must use interprocess communication to pass the value of the duplicate handle to the target process.

**DuplicateHandle** can be used to duplicate a handle between a 32-bit process and a 64-bit process. The resulting handle is appropriately sized to work in the target process. For more information, see [Process Interoperability](/en-us/windows/desktop/WinProg64/process-interoperability).

**DuplicateHandle** can duplicate handles to the following types of objects.

| Object | Description |
| --- | --- |
| Access token | The handle is returned by the [CreateRestrictedToken](/en-us/windows/desktop/api/securitybaseapi/nf-securitybaseapi-createrestrictedtoken), [DuplicateToken](/en-us/windows/desktop/api/securitybaseapi/nf-securitybaseapi-duplicatetoken), [DuplicateTokenEx](/en-us/windows/desktop/api/securitybaseapi/nf-securitybaseapi-duplicatetokenex), [OpenProcessToken](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-openprocesstoken), or [OpenThreadToken](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-openthreadtoken) function. |
| Change notification | The handle is returned by the [FindFirstChangeNotification](/en-us/windows/desktop/api/fileapi/nf-fileapi-findfirstchangenotificationa) function. |
| Communications device | The handle is returned by the [CreateFile](/en-us/windows/desktop/api/fileapi/nf-fileapi-createfilea) function. |
| Console input | The handle is returned by the [CreateFile](/en-us/windows/desktop/api/fileapi/nf-fileapi-createfilea) function when CONIN$ is specified, or by the [GetStdHandle](/en-us/windows/console/getstdhandle) function when STD\_INPUT\_HANDLE is specified. Console handles can be duplicated for use only in the same process. |
| Console screen buffer | The handle is returned by the [CreateFile](/en-us/windows/desktop/api/fileapi/nf-fileapi-createfilea) function when CONOUT$ is specified, or by the [GetStdHandle](/en-us/windows/console/getstdhandle) function when STD\_OUTPUT\_HANDLE is specified. Console handles can be duplicated for use only in the same process. |
| Desktop | The handle is returned by the [GetThreadDesktop](/en-us/windows/desktop/api/winuser/nf-winuser-getthreaddesktop) function. |
| Event | The handle is returned by the [CreateEvent](/en-us/windows/desktop/api/synchapi/nf-synchapi-createeventa) or [OpenEvent](/en-us/windows/desktop/api/synchapi/nf-synchapi-openeventa) function. |
| File | The handle is returned by the [CreateFile](/en-us/windows/desktop/api/fileapi/nf-fileapi-createfilea) function. |
| File mapping | The handle is returned by the [CreateFileMapping](/en-us/windows/desktop/api/winbase/nf-winbase-createfilemappinga) function. |
| Job | The handle is returned by the [CreateJobObject](/en-us/windows/desktop/api/winbase/nf-winbase-createjobobjecta) function. |
| Mailslot | The handle is returned by the [CreateMailslot](/en-us/windows/desktop/api/winbase/nf-winbase-createmailslota) function. |
| Mutex | The handle is returned by the [CreateMutex](/en-us/windows/desktop/api/synchapi/nf-synchapi-createmutexa) or [OpenMutex](../synchapi/nf-synchapi-openmutexw.md) function. |
| Pipe | A named pipe handle is returned by the [CreateNamedPipe](/en-us/windows/desktop/api/winbase/nf-winbase-createnamedpipea) or [CreateFile](/en-us/windows/desktop/api/fileapi/nf-fileapi-createfilea) function. An anonymous pipe handle is returned by the [CreatePipe](/en-us/windows/desktop/api/namedpipeapi/nf-namedpipeapi-createpipe) function. |
| Process | The handle is returned by the [CreateProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-createprocessa), [GetCurrentProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-getcurrentprocess), or [OpenProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-openprocess) function. |
| Registry key | The handle is returned by the [RegCreateKey](/en-us/windows/desktop/api/winreg/nf-winreg-regcreatekeya), [RegCreateKeyEx](/en-us/windows/desktop/api/winreg/nf-winreg-regcreatekeyexa), [RegOpenKey](/en-us/windows/desktop/api/winreg/nf-winreg-regopenkeya), or [RegOpenKeyEx](/en-us/windows/desktop/api/winreg/nf-winreg-regopenkeyexa) function. Note that registry key handles returned by the [RegConnectRegistry](/en-us/windows/desktop/api/winreg/nf-winreg-regconnectregistrya) function cannot be used in a call to **DuplicateHandle**. |
| Semaphore | The handle is returned by the [CreateSemaphore](/en-us/windows/desktop/api/winbase/nf-winbase-createsemaphorea) or [OpenSemaphore](/en-us/windows/win32/api/synchapi/nf-synchapi-opensemaphorew) function. |
| Thread | The handle is returned by the [CreateProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-createprocessa), [CreateThread](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-createthread), [CreateRemoteThread](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-createremotethread), or [GetCurrentThread](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-getcurrentthread) function |
| Timer | The handle is returned by the [CreateWaitableTimerW](/en-us/windows/win32/api/synchapi/nf-synchapi-createwaitabletimerw) or [OpenWaitableTimerW](/en-us/windows/win32/api/synchapi/nf-synchapi-openwaitabletimerw) function. |
| Transaction | The handle is returned by the [CreateTransaction](/en-us/windows/desktop/api/ktmw32/nf-ktmw32-createtransaction) function. |
| Window station | The handle is returned by the [GetProcessWindowStation](/en-us/windows/desktop/api/winuser/nf-winuser-getprocesswindowstation) function. |

You should not use **DuplicateHandle** to duplicate handles to the following objects:

- I/O completion ports. No error is returned, but the duplicate handle cannot be used.
- Sockets. No error is returned, but the duplicate handle may not be recognized by Winsock at the target process. Also, using **DuplicateHandle** interferes with internal reference counting on the underlying object. To duplicate a socket handle, use the [WSADuplicateSocket](/en-us/windows/desktop/api/winsock2/nf-winsock2-wsaduplicatesocketa) function.
- Pseudo-handles other than the ones returned by the [GetCurrentProcess](/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getcurrentprocess) or [GetCurrentThread](/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getcurrentthread) functions.

 The *dwDesiredAccess* parameter specifies the new handle's access rights. All objects support the [standard access rights](/en-us/windows/desktop/SecAuthZ/standard-access-rights). Objects may also support additional access rights depending on the object type. For more information, see the following topics: 
- [Desktop Security and Access Rights](/en-us/windows/desktop/winstation/desktop-security-and-access-rights)
- [File Security and Access Rights](/en-us/windows/desktop/FileIO/file-security-and-access-rights)
- [File-Mapping Security and Access Rights](/en-us/windows/desktop/Memory/file-mapping-security-and-access-rights)
- [Job Object Security and Access Rights](/en-us/windows/desktop/ProcThread/job-object-security-and-access-rights)
- [Process Security and Access Rights](/en-us/windows/desktop/ProcThread/process-security-and-access-rights)
- [Registry Key Security and Access Rights](/en-us/windows/desktop/SysInfo/registry-key-security-and-access-rights)
- [Synchronization Object Security and Access Rights](/en-us/windows/desktop/Sync/synchronization-object-security-and-access-rights)
- [Thread Security and Access Rights](/en-us/windows/desktop/ProcThread/thread-security-and-access-rights)
- [Window-Station Security and Access Rights](/en-us/windows/desktop/winstation/window-station-security-and-access-rights)

 In some cases, the new handle can have more access rights than the original handle. However, in other cases, **DuplicateHandle** cannot create a handle with more access rights than the original. For example, a file handle created with the GENERIC\_READ access right cannot be duplicated so that it has both the GENERIC\_READ and GENERIC\_WRITE access right. 
Normally the target process closes a duplicated handle when that process is finished using the handle. To close a duplicated handle from the source process, call **DuplicateHandle** with the following parameters:

- Set *hSourceProcessHandle* to the target process from the **DuplicateHandle** call that created the handle.
- Set *hSourceHandle* to the duplicated handle to close.
- Set *hTargetProcessHandle* to **NULL**.
- Set *dwOptions* to DUPLICATE\_CLOSE\_SOURCE.

#### Examples

The following example creates a mutex, duplicates a handle to the mutex, and passes it to another thread. Duplicating the handle ensures that the reference count is increased so that the mutex object will not be destroyed until both threads have closed the handle.

```cpp
#include <windows.h>

DWORD CALLBACK ThreadProc(PVOID pvParam);

int main()
{
    HANDLE hMutex = CreateMutex(NULL, FALSE, NULL);
    HANDLE hMutexDup, hThread;
    DWORD dwThreadId;

    DuplicateHandle(GetCurrentProcess(), 
                    hMutex, 
                    GetCurrentProcess(),
                    &hMutexDup, 
                    0,
                    FALSE,
                    DUPLICATE_SAME_ACCESS);

    hThread = CreateThread(NULL, 0, ThreadProc, 
        (LPVOID) hMutexDup, 0, &dwThreadId);

    // Perform work here, closing the handle when finished with the
    // mutex. If the reference count is zero, the object is destroyed.
    CloseHandle(hMutex);

    // Wait for the worker thread to terminate and clean up.
    WaitForSingleObject(hThread, INFINITE);
    CloseHandle(hThread);
    return 0;
}

DWORD CALLBACK ThreadProc(PVOID pvParam)
{
    HANDLE hMutex = (HANDLE)pvParam;

    // Perform work here, closing the handle when finished with the
    // mutex. If the reference count is zero, the object is destroyed.
    CloseHandle(hMutex);
    return 0;
}

```

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows 2000 Professional [desktop apps | UWP apps] |
| **Minimum supported server** | Windows 2000 Server [desktop apps | UWP apps] |
| **Target Platform** | Windows |
| **Header** | handleapi.h (include Windows.h) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |