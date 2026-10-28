---
layout: Conceptual
title: AssignProcessToJobObject function (jobapi2.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-assignprocesstojobobject
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
UID: NF:jobapi2.AssignProcessToJobObject
description: Assigns a process to an existing job object.
old-location: base\assignprocesstojobobject.htm
tech.root: backup
ms.assetid: f5d7a39f-6afe-4e4a-a802-e7f875ea6e5b
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: AssignProcessToJobObject, AssignProcessToJobObject function, _win32_assignprocesstojobobject, base.assignprocesstojobobject, jobapi2/AssignProcessToJobObject
req.header: jobapi2.h
req.include-header: Windows.h
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
- AssignProcessToJobObject
locale: en-us
document_id: b39a872d-951e-6df8-1c0f-c7543fbea764
document_version_independent_id: de25e4eb-cf0e-7b52-e40e-a28b522d44ac
updated_at: 2024-02-22T19:54:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/jobapi2/nf-jobapi2-assignprocesstojobobject.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/9267262487657894a8af112d7165006fed5035a7?path=/sdk-api-src/content/jobapi2/nf-jobapi2-assignprocesstojobobject.md&_a=contents
git_commit_id: 9267262487657894a8af112d7165006fed5035a7
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 878
asset_id: jobapi2/nf-jobapi2-assignprocesstojobobject
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/jobapi2/nf-jobapi2-assignprocesstojobobject.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/fc3f72c2-fb6f-4cea-95ee-b444e52254ee
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/f12cf087-582d-48ac-a085-0c19adf1e391
platformId: f6d1af89-d27a-783a-18dc-01a1487c7f6a
---

# AssignProcessToJobObject function (jobapi2.h) - Win32 apps | Microsoft Learn

Assigns a process to an existing job object.

## Syntax

```cpp
BOOL AssignProcessToJobObject(
  [in] HANDLE hJob,
  [in] HANDLE hProcess
);
```

## Parameters

`[in] hJob`

A handle to the job object to which the process will be associated. The [CreateJobObject](/en-us/windows/desktop/api/winbase/nf-winbase-createjobobjecta) or [OpenJobObject](/en-us/windows/desktop/api/winbase/nf-winbase-openjobobjecta) function returns this handle. The handle must have the JOB\_OBJECT\_ASSIGN\_PROCESS access right. For more information, see [Job Object Security and Access Rights](/en-us/windows/desktop/ProcThread/job-object-security-and-access-rights).

`[in] hProcess`

A handle to the process to associate with the job object. The handle must have the PROCESS\_SET\_QUOTA and PROCESS\_TERMINATE access rights. For more information, see [Process Security and Access Rights](/en-us/windows/desktop/ProcThread/process-security-and-access-rights).

If the process is already associated with a job, the job specified by *hJob* must be empty or it must be in the hierarchy of nested jobs to which the process already belongs, and it cannot have UI limits set ([SetInformationJobObject](/en-us/windows/desktop/api/jobapi2/nf-jobapi2-setinformationjobobject) with **JobObjectBasicUIRestrictions**). For more information, see Remarks.

**Windows 7, Windows Server 2008 R2, Windows XP with SP3, Windows Server 2008, Windows Vista and Windows Server 2003: **The process must not already be assigned to a job; if it is, the function fails with ERROR\_ACCESS\_DENIED. This behavior changed starting in Windows 8 and Windows Server 2012.

**Terminal Services: **All processes within a job must run within the same session as the job.

## Return value

If the function succeeds, the return value is nonzero.

If the function fails, the return value is zero. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

## Remarks

After you associate a process with a job object using **AssignProcessToJobObject**, the process is subject to the limits set for the job. To set limits for a job, use the [SetInformationJobObject](/en-us/windows/desktop/api/jobapi2/nf-jobapi2-setinformationjobobject) function.

If the job has a user-mode time limit, and the time limit has been exhausted, **AssignProcessToJobObject** fails and the specified process is terminated. If the time limit would be exceeded by associating the process, **AssignProcessToJobObject** still succeeds. However, the time limit violation will be reported. If the job has an active process limit, and the limit would be exceeded by associating this process, **AssignProcessToJobObject** fails, and the specified process is terminated.

Memory operations performed by a process associated with a job that has a memory limit are subject to the memory limit. Memory operations performed by the process before it was associated with the job are not examined by **AssignProcessToJobObject**.

If the process is already running and the job has security limitations, **AssignProcessToJobObject** may fail. For example, if the primary token of the process contains the local administrators group, but the job object has the security limitation JOB\_OBJECT\_SECURITY\_NO\_ADMIN, the function fails. If the job has the security limitation JOB\_OBJECT\_SECURITY\_ONLY\_TOKEN, the process must be created suspended. To create a suspended process, call the [CreateProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-createprocessa) function with the CREATE\_SUSPENDED flag.

A process can be associated with more than one job in a hierarchy of nested jobs. For priority class, affinity, commit charge, per-process execution time limit, scheduling class limit, and working set minimum and maximum, the process inherits an effective limit which is the most restrictive limit of all the jobs in its parent job chain. For other resource limits, the process inherits limits from its immediate job in the hierarchy. Accounting information is added to the immediate job and aggregated in each parent job in the job chain. By default, all child processes are associated with the immediate job and every job in the parent job chain. To create a child process that is not part of the same job chain, call the [CreateProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-createprocessa) function with the CREATE\_BREAKAWAY\_FROM\_JOB flag. The child process breaks away from every job in the job chain unless a job in the chain does not allow breakaway. In this case, the child process does not break away from that job or any job above it in the job chain. For more information, see [Nested Jobs](/en-us/windows/desktop/ProcThread/nested-jobs).

**Windows 7, Windows Server 2008 R2, Windows XP with SP3, Windows Server 2008, Windows Vista and Windows Server 2003: **A process can be associated only with a single job. A process inherits limits from the job it is associated with and adds its accounting information to the job. If a process is associated with a job, all child processes it creates are associated with that job by default. To create a child process that is not part of the same job, call the [CreateProcess](/en-us/windows/desktop/api/processthreadsapi/nf-processthreadsapi-createprocessa) function with the CREATE\_BREAKAWAY\_FROM\_JOB flag. A process can be associated with more than one job starting in Windows 8 and Windows Server 2012.

**Windows 7, Windows Server 2008 R2, Windows Server 2008 and Windows Vista: **If the process is being monitored by the Program Compatibility Assistant (PCA), it is placed into a compatibility job. Therefore, the process must be created using CREATE\_BREAKAWAY\_FROM\_JOB before it can be placed in another job. Alternatively, you can embed an application manifest that specifies a User Account Control (UAC) level in your application and PCA will not add the process to the compatibility job. For more information, see [Application Development Requirements for User Account Control Compatibility](/en-us/previous-versions/dotnet/articles/bb530410%28v=msdn.10%29).

If the job or any of its parent jobs in the job chain is terminating when **AssignProcessToJob** is called, the function fails.

To compile an application that uses this function, define \_WIN32\_WINNT as 0x0500 or later. For more information, see [Using the Windows Headers](/en-us/windows/desktop/WinProg/using-the-windows-headers).

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps only] |
| **Minimum supported server** | Windows Server 2003 [desktop apps only] |
| **Target Platform** | Windows |
| **Header** | jobapi2.h (include Windows.h) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |