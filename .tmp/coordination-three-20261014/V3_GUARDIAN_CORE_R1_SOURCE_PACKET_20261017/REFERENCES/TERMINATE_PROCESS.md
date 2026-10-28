---
layout: Conceptual
title: TerminateProcess function (processthreadsapi.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-terminateprocess
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
UID: NF:processthreadsapi.TerminateProcess
description: Terminates the specified process and all of its threads.
old-location: base\terminateprocess.htm
tech.root: processthreadsapi
ms.assetid: 0e1a8195-4fd3-43d4-ae9e-1a1e05c2119a
ms.date: 2025-12-30T00:00:00.0000000Z
ms.keywords: TerminateProcess, TerminateProcess function, _win32_terminateprocess, base.terminateprocess, processthreadsapi/TerminateProcess, winbase/TerminateProcess
req.header: processthreadsapi.h
req.include-header: Windows.h on Windows Server 2003, Windows Vista, Windows 7, Windows Server 2008  Windows Server 2008 R2
req.target-type: Windows
req.target-min-winverclnt: Windows XP [desktop apps \| UWP apps]
req.target-min-winversvr: Windows Server 2003 [desktop apps \| UWP apps]
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
- api-ms-win-core-processthreads-l1-1-8.dll
- api-ms-win-core-processthreads-l1-1-7.dll
- api-ms-win-core-processthreads-l1-1-6.dll
- api-ms-win-core-processthreads-l1-1-5.dll
- api-ms-win-core-processthreads-l1-1-4.dll
- Kernel32.dll
- API-MS-Win-Core-ProcessThreads-l1-1-0.dll
- KernelBase.dll
- MinKernelBase.dll
- API-MS-Win-Core-ProcessThreads-l1-1-1.dll
- API-MS-Win-Core-ProcessThreads-l1-1-2.dll
- api-ms-win-downlevel-kernel32-l1-1-0.dll
- API-MS-Win-Core-ProcessThreads-L1-1-3.dll
- Vertdll.dll
api_name:
- TerminateProcess
locale: en-us
document_id: 3743b9f4-c84f-9254-3cfb-063cb46c037f
document_version_independent_id: fbd7e3fe-3529-102e-256c-e2424ee85fdc
updated_at: 2026-01-07T18:46:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/processthreadsapi/nf-processthreadsapi-terminateprocess.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/2172a3feb557a964d41dd44a8d35bac361d713c3?path=/sdk-api-src/content/processthreadsapi/nf-processthreadsapi-terminateprocess.md&_a=contents
git_commit_id: 2172a3feb557a964d41dd44a8d35bac361d713c3
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: ../_processthreadsapi/toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 337
asset_id: processthreadsapi/nf-processthreadsapi-terminateprocess
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/processthreadsapi/nf-processthreadsapi-terminateprocess.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: ab4fc9be-44ff-7a8f-4d89-0f8f32d4b140
---

# TerminateProcess function (processthreadsapi.h) - Win32 apps | Microsoft Learn

Terminates the specified process and all of its threads.

## Syntax

```cpp
BOOL TerminateProcess(
  [in] HANDLE hProcess,
  [in] UINT   uExitCode
);
```

## Parameters

`[in] hProcess`

A handle to the process to be terminated.

The handle must have the **PROCESS\_TERMINATE** access right. For more information, see [Process Security and Access Rights](/en-us/windows/win32/ProcThread/process-security-and-access-rights).

`[in] uExitCode`

The exit code to be used by the process and threads terminated as a result of this call. Use the [GetExitCodeProcess](/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getexitcodeprocess) function to retrieve a process's exit value. Use the [GetExitCodeThread](/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getexitcodethread) function to retrieve a thread's exit value.

## Return value

If the function succeeds, the return value is nonzero.

If the function fails, the return value is zero. To get extended error information, call [GetLastError](/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-getlasterror).

## Remarks

The **TerminateProcess** function is used to unconditionally cause a process to exit. The state of global data maintained by dynamic-link libraries (DLLs) may be compromised if **TerminateProcess** is used rather than [ExitProcess](/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-exitprocess).

This function stops execution of all threads within the process and requests cancellation of all pending I/O. The terminated process cannot exit until all pending I/O has been completed or canceled. When a process terminates, its kernel object is not destroyed until all processes that have open handles to the process have released those handles.

When a process terminates itself, **TerminateProcess** stops execution of the calling thread and does not return. Otherwise, **TerminateProcess** is asynchronous; it initiates termination and returns immediately. If you need to be sure the process has terminated, call the [WaitForSingleObject](/en-us/windows/win32/api/synchapi/nf-synchapi-waitforsingleobject) function with a handle to the process.

A process cannot prevent itself from being terminated.

After a process has terminated, calls to **TerminateProcess** with open handles to the process fails with **ERROR\_ACCESS\_DENIED** (5) error code.

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps | UWP apps] |
| **Minimum supported server** | Windows Server 2003 [desktop apps | UWP apps] |
| **Target Platform** | Windows |
| **Header** | processthreadsapi.h (include Windows.h on Windows Server 2003, Windows Vista, Windows 7, Windows Server 2008 Windows Server 2008 R2) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |