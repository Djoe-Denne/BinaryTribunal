---
layout: Conceptual
title: TerminateJobObject function (jobapi2.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-terminatejobobject
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
UID: NF:jobapi2.TerminateJobObject
description: Terminates all processes currently associated with the job.
old-location: base\terminatejobobject.htm
tech.root: backup
ms.assetid: ff8eb4a8-26d0-4f01-ab56-3c51fb16e87c
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: TerminateJobObject, TerminateJobObject function, _win32_terminatejobobject, base.terminatejobobject, winbase/TerminateJobObject
req.header: jobapi2.h
req.include-header: Windows.h, Jobapi2.h
req.target-type: Windows
req.target-min-winverclnt: Windows XP [desktop apps only]
req.target-min-winversvr: Windows Server 2003 [desktop apps only]
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
- API-MS-Win-Core-job-l2-1-0.dll
- kernel32legacy.dll
- API-MS-Win-Core-Job-L2-1-1.dll
api_name:
- TerminateJobObject
locale: en-us
document_id: f4799fb2-3c14-ef51-aa99-1898ce627e2f
document_version_independent_id: e69df010-eac2-54ef-778f-266558ba853f
updated_at: 2024-02-22T19:54:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/jobapi2/nf-jobapi2-terminatejobobject.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/9267262487657894a8af112d7165006fed5035a7?path=/sdk-api-src/content/jobapi2/nf-jobapi2-terminatejobobject.md&_a=contents
git_commit_id: 9267262487657894a8af112d7165006fed5035a7
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 291
asset_id: jobapi2/nf-jobapi2-terminatejobobject
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/jobapi2/nf-jobapi2-terminatejobobject.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: de430bb8-6508-b885-2c10-a4e5d22cdbed
---

# TerminateJobObject function (jobapi2.h) - Win32 apps | Microsoft Learn

Terminates all processes currently associated with the job. If the job is nested, this function terminates all processes currently associated with the job and all of its child jobs in the hierarchy.

## Syntax

```cpp
BOOL TerminateJobObject(
  [in] HANDLE hJob,
  [in] UINT   uExitCode
);
```

## Parameters

`[in] hJob`

A handle to the job whose processes will be terminated. The [CreateJobObject](/en-us/windows/desktop/api/winbase/nf-winbase-createjobobjecta) or [OpenJobObject](/en-us/windows/desktop/api/winbase/nf-winbase-openjobobjecta) function returns this handle. This handle must have the JOB\_OBJECT\_TERMINATE access right. For more information, see [Job Object Security and Access Rights](/en-us/windows/desktop/ProcThread/job-object-security-and-access-rights).

The handle for each process in the job object must have the PROCESS\_TERMINATE access right. For more information, see [Process Security and Access Rights](/en-us/windows/desktop/ProcThread/process-security-and-access-rights).

`[in] uExitCode`

The exit code to be used by all processes and threads in the job object. Use the [GetExitCodeProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-getexitcodeprocess) function to retrieve each process's exit value. Use the [GetExitCodeThread](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-getexitcodethread) function to retrieve each thread's exit value.

## Return value

If the function succeeds, the return value is nonzero.

If the function fails, the return value is zero. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

## Remarks

It is not possible for any of the processes associated with the job to postpone or handle the termination. It is as if [TerminateProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-terminateprocess) were called for each process associated with the job.

Terminating a nested job additionally terminates all child job objects. Resources used by the terminated jobs are charged up the parent job chain in the hierarchy.

To compile an application that uses this function, define \_WIN32\_WINNT as 0x0500 or later. For more information, see [Using the Windows Headers](/en-us/windows/desktop/WinProg/using-the-windows-headers).

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps only] |
| **Minimum supported server** | Windows Server 2003 [desktop apps only] |
| **Target Platform** | Windows |
| **Header** | jobapi2.h (include Windows.h, Jobapi2.h) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |