---
layout: Conceptual
title: IsProcessInJob function (jobapi.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-isprocessinjob
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
UID: NF:jobapi.IsProcessInJob
description: Determines whether the process is running in the specified job.
old-location: base\isprocessinjob.htm
tech.root: backup
ms.assetid: 0253071d-a3fa-4ab0-86a7-71350d9fc24e
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: IsProcessInJob, IsProcessInJob function, _win32_isprocessinjob, base.isprocessinjob, jobapi/IsProcessInJob, winbase/IsProcessInJob
req.header: jobapi.h
req.include-header: 
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
- API-MS-Win-Core-job-l1-1-0.dll
- KernelBase.dll
- API-MS-Win-Core-misc-l1-1-0.dll
- API-MS-Win-DownLevel-Kernel32-l1-1-0.dll
- MinKernelBase.dll
api_name:
- IsProcessInJob
locale: en-us
document_id: 7b8aee6a-9d63-9cf0-f089-6870bd48ddcf
document_version_independent_id: 702582f4-8e35-c08d-7328-20755b6dd597
updated_at: 2024-02-22T19:54:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/jobapi/nf-jobapi-isprocessinjob.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/9267262487657894a8af112d7165006fed5035a7?path=/sdk-api-src/content/jobapi/nf-jobapi-isprocessinjob.md&_a=contents
git_commit_id: 9267262487657894a8af112d7165006fed5035a7
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 262
asset_id: jobapi/nf-jobapi-isprocessinjob
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/jobapi/nf-jobapi-isprocessinjob.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: 97b8e45b-80ae-6138-1bf2-742700fa1524
---

# IsProcessInJob function (jobapi.h) - Win32 apps | Microsoft Learn

Determines whether the process is running in the specified job.

## Syntax

```cpp
BOOL IsProcessInJob(
  [in]           HANDLE ProcessHandle,
  [in, optional] HANDLE JobHandle,
  [out]          PBOOL  Result
);
```

## Parameters

`[in] ProcessHandle`

A handle to the process to be tested. The handle must have the PROCESS\_QUERY\_INFORMATION or PROCESS\_QUERY\_LIMITED\_INFORMATION access right. For more information, see [Process Security and Access Rights](/en-us/windows/desktop/ProcThread/process-security-and-access-rights).

**Windows Server 2003 and Windows XP: **The handle must have the PROCESS\_QUERY\_INFORMATION access right.

`[in, optional] JobHandle`

A handle to the job. If this parameter is NULL, the function tests if the process is running under any job.

If this parameter is not NULL, the handle must have the JOB\_OBJECT\_QUERY access right. For more information, see [Job Object Security and Access Rights](/en-us/windows/desktop/ProcThread/job-object-security-and-access-rights).

`[out] Result`

A pointer to a value that receives TRUE if the process is running in the job, and FALSE otherwise.

## Return value

If the function succeeds, the return value is nonzero.

If the function fails, the return value is zero. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

## Remarks

An application cannot obtain a handle to the job object in which it is running unless it has the name of the job object. However, an application can call the [QueryInformationJobObject](/en-us/windows/desktop/api/jobapi2/nf-jobapi2-queryinformationjobobject) function with NULL to obtain information about the job object.

To compile an application that uses this function, define \_WIN32\_WINNT as 0x0501 or later. For more information, see [Using the Windows Headers](/en-us/windows/desktop/WinProg/using-the-windows-headers).

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps only] |
| **Minimum supported server** | Windows Server 2003 [desktop apps only] |
| **Target Platform** | Windows |
| **Header** | jobapi.h |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |