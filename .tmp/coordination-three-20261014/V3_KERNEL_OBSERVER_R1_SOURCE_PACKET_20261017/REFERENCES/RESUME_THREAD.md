---
layout: Conceptual
title: ResumeThread function (processthreadsapi.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-resumethread
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
UID: NF:processthreadsapi.ResumeThread
description: Decrements a thread's suspend count. When the suspend count is decremented to zero, the execution of the thread is resumed.
old-location: base\resumethread.htm
tech.root: processthreadsapi
ms.assetid: ffc4e474-635b-4bf7-a68f-073899fb3fde
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: ResumeThread, ResumeThread function, _win32_resumethread, base.resumethread, processthreadsapi/ResumeThread, winbase/ResumeThread
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
req.lib: Kernel32.lib; WindowsPhoneCore.lib on Windows Phone 8.1
req.dll: Kernel32.dll; KernelBase.dll on Windows Phone 8.1
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
- KernelBase.dll
- API-MS-Win-Core-ProcessThreads-l1-1-0.dll
- MinKernelBase.dll
- API-MS-Win-Core-ProcessThreads-l1-1-1.dll
- API-MS-Win-Core-ProcessThreads-l1-1-2.dll
- api-ms-win-downlevel-kernel32-l1-1-0.dll
- API-MS-Win-Core-ProcessThreads-L1-1-3.dll
api_name:
- ResumeThread
locale: en-us
document_id: 4e968fca-3b5d-fbd8-8911-3bc469f1fdde
document_version_independent_id: 4c20150b-2a13-d1f5-b92b-1edc15fe20f6
updated_at: 2025-07-01T18:41:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/processthreadsapi/nf-processthreadsapi-resumethread.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/fa53641576e3603fa7b66d3a4ad969d3ce49d6f3?path=/sdk-api-src/content/processthreadsapi/nf-processthreadsapi-resumethread.md&_a=contents
git_commit_id: fa53641576e3603fa7b66d3a4ad969d3ce49d6f3
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: ../_processthreadsapi/toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 347
asset_id: processthreadsapi/nf-processthreadsapi-resumethread
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/processthreadsapi/nf-processthreadsapi-resumethread.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
platformId: 2cd591e3-5a61-be5b-e6b3-7f14573fe88f
---

# ResumeThread function (processthreadsapi.h) - Win32 apps | Microsoft Learn

Decrements a thread's suspend count. When the suspend count is decremented to zero, the execution of the thread is resumed.

## Syntax

```cpp
DWORD ResumeThread(
  [in] HANDLE hThread
);
```

## Parameters

`[in] hThread`

A handle to the thread to be restarted.

This handle must have the THREAD\_SUSPEND\_RESUME access right. For more information, see [Thread Security and Access Rights](/en-us/windows/desktop/ProcThread/thread-security-and-access-rights).

## Return value

If the function succeeds, the return value is the thread's previous suspend count.

If the function fails, the return value is (DWORD) -1. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

## Remarks

The **ResumeThread** function checks the suspend count of the subject thread. If the suspend count is zero, the thread is not currently suspended. Otherwise, the subject thread's suspend count is decremented. If the resulting value is zero, then the execution of the subject thread is resumed.

If the return value is zero, the specified thread was not suspended. If the return value is 1, the specified thread was suspended but was restarted. If the return value is greater than 1, the specified thread is still suspended.

Note that while reporting debug events, all threads within the reporting process are frozen. Debuggers are expected to use the [SuspendThread](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-suspendthread) and **ResumeThread** functions to limit the set of threads that can execute within a process. By suspending all threads in a process except for the one reporting a debug event, it is possible to "single step" a single thread. The other threads are not released by a continue operation if they are suspended.

**Windows Phone 8.1: **This function is supported for Windows Phone Store apps on Windows Phone 8.1 and later.

**Windows 8.1** and **Windows Server 2012 R2**: This function is supported for Windows Store apps on Windows 8.1, Windows Server 2012 R2, and later.

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps | UWP apps] |
| **Minimum supported server** | Windows Server 2003 [desktop apps | UWP apps] |
| **Target Platform** | Windows |
| **Header** | processthreadsapi.h (include Windows.h on Windows Server 2003, Windows Vista, Windows 7, Windows Server 2008 Windows Server 2008 R2) |
| **Library** | Kernel32.lib; WindowsPhoneCore.lib on Windows Phone 8.1 |
| **DLL** | Kernel32.dll; KernelBase.dll on Windows Phone 8.1 |