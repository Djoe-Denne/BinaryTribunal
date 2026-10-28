---
layout: Conceptual
title: GetExitCodeProcess function (processthreadsapi.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getexitcodeprocess
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
UID: NF:processthreadsapi.GetExitCodeProcess
description: Retrieves the termination status of the specified process.
old-location: base\getexitcodeprocess.htm
tech.root: processthreadsapi
ms.assetid: 210f7595-ac12-4bb2-bd77-819649ebec10
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: GetExitCodeProcess, GetExitCodeProcess function, _win32_getexitcodeprocess, base.getexitcodeprocess, processthreadsapi/GetExitCodeProcess, winbase/GetExitCodeProcess
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
api_name:
- GetExitCodeProcess
locale: en-us
document_id: 02e158a4-b105-1b23-be5f-776c710a620b
document_version_independent_id: 5e5335b3-3f0e-ff73-0cdc-caba24f1ff68
updated_at: 2025-07-01T18:41:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/processthreadsapi/nf-processthreadsapi-getexitcodeprocess.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/fa53641576e3603fa7b66d3a4ad969d3ce49d6f3?path=/sdk-api-src/content/processthreadsapi/nf-processthreadsapi-getexitcodeprocess.md&_a=contents
git_commit_id: fa53641576e3603fa7b66d3a4ad969d3ce49d6f3
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: ../_processthreadsapi/toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 324
asset_id: processthreadsapi/nf-processthreadsapi-getexitcodeprocess
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/processthreadsapi/nf-processthreadsapi-getexitcodeprocess.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: d0b207b1-a9bd-5f20-449e-645a3497c621
---

# GetExitCodeProcess function (processthreadsapi.h) - Win32 apps | Microsoft Learn

Retrieves the termination status of the specified process.

## Syntax

```cpp
BOOL GetExitCodeProcess(
  [in]  HANDLE  hProcess,
  [out] LPDWORD lpExitCode
);
```

## Parameters

`[in] hProcess`

A handle to the process.

The handle must have the **PROCESS\_QUERY\_INFORMATION** or **PROCESS\_QUERY\_LIMITED\_INFORMATION** access right. For more information, see [Process Security and Access Rights](/en-us/windows/desktop/ProcThread/process-security-and-access-rights).

**Windows Server 2003 and Windows XP: **The handle must have the **PROCESS\_QUERY\_INFORMATION** access right.

`[out] lpExitCode`

A pointer to a variable to receive the process termination status. For more information, see Remarks.

## Return value

If the function succeeds, the return value is nonzero.

If the function fails, the return value is zero. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

## Remarks

This function returns immediately. If the process has not terminated and the function succeeds, the status returned is **STILL\_ACTIVE** (a macro for **STATUS\_PENDING** (minwinbase.h)). If the process has terminated and the function succeeds, the status returned is one of the following values:

- The exit value specified in the [ExitProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-exitprocess) or [TerminateProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-terminateprocess) function.
- The return value from the [main](/en-us/cpp/cpp/main-function-command-line-args) or [WinMain](/en-us/windows/win32/api/winbase/nf-winbase-winmain) function of the process.
- The exception value for an unhandled exception that caused the process to terminate.

Important

The **GetExitCodeProcess** function returns a valid error code defined by the application only after the thread terminates. Therefore, an application should not use **STILL\_ACTIVE** (259) as an error code (**STILL\_ACTIVE** is a macro for **STATUS\_PENDING** (minwinbase.h)). If a thread returns **STILL\_ACTIVE** (259) as an error code, then applications that test for that value could interpret it to mean that the thread is still running, and continue to test for the completion of the thread after the thread has terminated, which could put the application into an infinite loop.

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps | UWP apps] |
| **Minimum supported server** | Windows Server 2003 [desktop apps | UWP apps] |
| **Target Platform** | Windows |
| **Header** | processthreadsapi.h (include Windows.h on Windows Server 2003, Windows Vista, Windows 7, Windows Server 2008 Windows Server 2008 R2) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |