---
layout: Conceptual
title: JOBOBJECT_BASIC_ACCOUNTING_INFORMATION (winnt.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_basic_accounting_information
adobe-target: true
breadcrumb_path: /windows/desktop/api/breadcrumb/toc.json
uhfHeaderId: MSDocsHeader-WinDevCenter
ms.service: windows-api-desktop-tech
ms.subservice: sdk-api-reference
ms.topic: reference
ms.author: jken
author: GrantMeStrength
feedback_system: Standard
feedback_product_url: https://www.microsoft.com/en-us/windowsinsider/feedbackhub/fb
feedback_help_link_url: https://learn.microsoft.com/answers/tags/224/windows-api-win32/
feedback_help_link_type: get-help-at-qna
UID: NS:winnt._JOBOBJECT_BASIC_ACCOUNTING_INFORMATION
description: Contains basic accounting information for a job object.
old-location: base\jobobject_basic_accounting_information_str.htm
tech.root: backup
ms.assetid: 84dbe191-a5bf-4f55-815f-c4f2e60da22b
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: '*PJOBOBJECT_BASIC_ACCOUNTING_INFORMATION, JOBOBJECT_BASIC_ACCOUNTING_INFORMATION, JOBOBJECT_BASIC_ACCOUNTING_INFORMATION structure, PJOBOBJECT_BASIC_ACCOUNTING_INFORMATION, PJOBOBJECT_BASIC_ACCOUNTING_INFORMATION structure pointer, _JOBOBJECT_BASIC_ACCOUNTING_INFORMATION, _win32_jobobject_basic_accounting_information_str, base.jobobject_basic_accounting_information_str, winnt/JOBOBJECT_BASIC_ACCOUNTING_INFORMATION, winnt/PJOBOBJECT_BASIC_ACCOUNTING_INFORMATION'
req.header: winnt.h
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
req.lib: 
req.dll: 
req.irql: 
targetos: Windows
req.typenames: JOBOBJECT_BASIC_ACCOUNTING_INFORMATION, *PJOBOBJECT_BASIC_ACCOUNTING_INFORMATION
req.redist: 
ms.custom: 19H1
topic_type:
- APIRef
- kbSyntax
api_type:
- HeaderDef
api_location:
- WinNT.h
api_name:
- JOBOBJECT_BASIC_ACCOUNTING_INFORMATION
locale: en-us
document_id: 0f4fb4f0-62cc-48a2-db82-50e3a378d77a
document_version_independent_id: 10551e86-eb60-f8cd-3c5c-bf8263b2cde5
updated_at: 2024-02-22T19:54:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/winnt/ns-winnt-jobobject_basic_accounting_information.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/9267262487657894a8af112d7165006fed5035a7?path=/sdk-api-src/content/winnt/ns-winnt-jobobject_basic_accounting_information.md&_a=contents
git_commit_id: 9267262487657894a8af112d7165006fed5035a7
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: ../_backup/toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 378
asset_id: winnt/ns-winnt-jobobject_basic_accounting_information
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/winnt/ns-winnt-jobobject_basic_accounting_information.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: 7e114cbb-905a-43f3-5538-983cc2c79fc2
---

# JOBOBJECT_BASIC_ACCOUNTING_INFORMATION (winnt.h) - Win32 apps | Microsoft Learn

Contains basic accounting information for a job object.

## Syntax

```cpp
typedef struct _JOBOBJECT_BASIC_ACCOUNTING_INFORMATION {
  LARGE_INTEGER TotalUserTime;
  LARGE_INTEGER TotalKernelTime;
  LARGE_INTEGER ThisPeriodTotalUserTime;
  LARGE_INTEGER ThisPeriodTotalKernelTime;
  DWORD         TotalPageFaultCount;
  DWORD         TotalProcesses;
  DWORD         ActiveProcesses;
  DWORD         TotalTerminatedProcesses;
} JOBOBJECT_BASIC_ACCOUNTING_INFORMATION, *PJOBOBJECT_BASIC_ACCOUNTING_INFORMATION;
```

## Members

`TotalUserTime`

The total amount of user-mode execution time for all active processes associated with the job, as well as all terminated processes no longer associated with the job, in 100-nanosecond ticks.

`TotalKernelTime`

The total amount of kernel-mode execution time for all active processes associated with the job, as well as all terminated processes no longer associated with the job, in 100-nanosecond ticks.

`ThisPeriodTotalUserTime`

The total amount of user-mode execution time for all active processes associated with the job (as well as all terminated processes no longer associated with the job) since the last call that set a per-job user-mode time limit, in 100-nanosecond ticks.

This member is set to 0 on creation of the job, and each time a per-job user-mode time limit is established.

`ThisPeriodTotalKernelTime`

The total amount of kernel-mode execution time for all active processes associated with the job (as well as all terminated processes no longer associated with the job) since the last call that set a per-job kernel-mode time limit, in 100-nanosecond ticks.

This member is set to zero on creation of the job, and each time a per-job kernel-mode time limit is established.

`TotalPageFaultCount`

The total number of page faults encountered by all active processes associated with the job, as well as all terminated processes no longer associated with the job.

`TotalProcesses`

The total number of processes associated with the job during its lifetime, including those that have terminated. For example, when a process is associated with a job, but the association fails because of a limit violation, this value is incremented.

`ActiveProcesses`

The total number of processes currently associated with the job. When a process is associated with a job, but the association fails because of a limit violation, this value is temporarily incremented. When the terminated process exits and all references to the process are released, this value is decremented.

`TotalTerminatedProcesses`

The total number of processes terminated because of a limit violation.

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps only] |
| **Minimum supported server** | Windows Server 2003 [desktop apps only] |
| **Header** | winnt.h (include Windows.h) |