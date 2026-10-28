---
layout: Conceptual
title: CreateJobObjectW function (jobapi2.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-createjobobjectw
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
UID: NF:jobapi2.CreateJobObjectW
description: Creates or opens a job object. (CreateJobObjectW)
old-location: base\createjobobject.htm
tech.root: backup
ms.assetid: ca6a044f-67ed-4a9c-9aeb-69dd77652854
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: CreateJobObject, CreateJobObject function, CreateJobObjectA, CreateJobObjectW, _win32_createjobobject, base.createjobobject, winbase/CreateJobObject, winbase/CreateJobObjectA, winbase/CreateJobObjectW
req.header: jobapi2.h
req.include-header: Windows.h, Jobapi2.h
req.target-type: Windows
req.target-min-winverclnt: Windows XP [desktop apps only]
req.target-min-winversvr: Windows Server 2003 [desktop apps only]
req.kmdf-ver: 
req.umdf-ver: 
req.ddi-compliance: 
req.unicode-ansi: CreateJobObjectW (Unicode) and CreateJobObjectA (ANSI)
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
- API-Ms-Win-Core-Kernel32-Legacy-Ansi-L1-1-0.dll
- API-MS-Win-Core-Job-L2-1-1.dll
api_name:
- CreateJobObject
- CreateJobObjectA
- CreateJobObjectW
locale: en-us
document_id: 05cd8efb-985d-7f4e-3d29-386f17b02045
document_version_independent_id: 1f3e855c-93d8-e04d-a818-a886c65b1501
updated_at: 2024-11-20T01:20:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/jobapi2/nf-jobapi2-createjobobjectw.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/adea022c86382b9cef5d28bccca8b9b719e57d6b?path=/sdk-api-src/content/jobapi2/nf-jobapi2-createjobobjectw.md&_a=contents
git_commit_id: adea022c86382b9cef5d28bccca8b9b719e57d6b
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 485
asset_id: jobapi2/nf-jobapi2-createjobobjectw
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/jobapi2/nf-jobapi2-createjobobjectw.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: 16bbe909-0d1f-9833-d333-61ad854a7a21
---

# CreateJobObjectW function (jobapi2.h) - Win32 apps | Microsoft Learn

Creates or opens a job object.

## Syntax

```cpp
HANDLE CreateJobObjectW(
  [in, optional] LPSECURITY_ATTRIBUTES lpJobAttributes,
  [in, optional] LPCWSTR               lpName
);
```

## Parameters

`[in, optional] lpJobAttributes`

A pointer to a [SECURITY_ATTRIBUTES](/en-us/windows/win32/api/wtypesbase/ns-wtypesbase-security_attributes) structure that specifies the security descriptor for the job object and determines whether child processes can inherit the returned handle. If *lpJobAttributes* is **NULL**, the job object gets a default security descriptor and the handle cannot be inherited. The ACLs in the default security descriptor for a job object come from the primary or impersonation token of the creator.

`[in, optional] lpName`

The name of the job. The name is limited to **MAX\_PATH** characters. Name comparison is case-sensitive.

If *lpName* is **NULL**, the job is created without a name.

If *lpName* matches the name of an existing event, semaphore, mutex, waitable timer, or file-mapping object, the function fails and the [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror) function returns **ERROR\_INVALID\_HANDLE**. This occurs because these objects share the same namespace.

The object can be created in a private namespace. For more information, see [Object Namespaces](/en-us/windows/desktop/Sync/object-namespaces).

**Terminal Services: **The name can have a "Global\" or "Local\" prefix to explicitly create the object in the global or session namespace. The remainder of the name can contain any character except the backslash character (\). For more information, see [Kernel Object Namespaces](/en-us/windows/desktop/TermServ/kernel-object-namespaces).

## Return value

If the function succeeds, the return value is a handle to the job object. The handle has the **JOB\_OBJECT\_ALL\_ACCESS** access right. If the object existed before the function call, the function returns a handle to the existing job object and [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror) returns **ERROR\_ALREADY\_EXISTS**.

If the function fails, the return value is NULL. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

## Remarks

When a job is created, its accounting information is initialized to zero, all limits are inactive, and there are no associated processes. To assign a process to a job object, use the [AssignProcessToJobObject](/en-us/windows/desktop/api/jobapi2/nf-jobapi2-assignprocesstojobobject) function. To set limits for a job, use the [SetInformationJobObject](/en-us/windows/desktop/api/jobapi2/nf-jobapi2-setinformationjobobject) function. To query accounting information, use the [QueryInformationJobObject](/en-us/windows/desktop/api/jobapi2/nf-jobapi2-queryinformationjobobject) function.

All processes associated with a job must run in the same session. A job is associated with the session of the first process to be assigned to the job.

**Windows Server 2003 and Windows XP: **A job is associated with the session of the process that created it.

To close a job object handle, use the [CloseHandle](/en-us/windows/desktop/api/handleapi/nf-handleapi-closehandle) function. The job is destroyed when its last handle has been closed and all associated processes have exited. However, if the job has the **JOB\_OBJECT\_LIMIT\_KILL\_ON\_JOB\_CLOSE** flag specified, closing the last job object handle terminates all associated processes and then destroys the job object itself.

To compile an application that uses this function, define **\_WIN32\_WINNT** as 0x0500 or later. For more information, see [Using the Windows Headers](/en-us/windows/desktop/WinProg/using-the-windows-headers).

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps only] |
| **Minimum supported server** | Windows Server 2003 [desktop apps only] |
| **Target Platform** | Windows |
| **Header** | jobapi2.h (include Windows.h, Jobapi2.h) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |