---
layout: Conceptual
title: JOBOBJECT_EXTENDED_LIMIT_INFORMATION (winnt.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_extended_limit_information
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
UID: NS:winnt._JOBOBJECT_EXTENDED_LIMIT_INFORMATION
description: Contains basic and extended limit information for a job object.
old-location: base\jobobject_extended_limit_information_str.htm
tech.root: backup
ms.assetid: 5712fd27-6489-4fdc-b69b-4fb6a7c52c02
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: '*PJOBOBJECT_EXTENDED_LIMIT_INFORMATION, JOBOBJECT_EXTENDED_LIMIT_INFORMATION, JOBOBJECT_EXTENDED_LIMIT_INFORMATION structure, PJOBOBJECT_EXTENDED_LIMIT_INFORMATION, PJOBOBJECT_EXTENDED_LIMIT_INFORMATION structure pointer, _JOBOBJECT_EXTENDED_LIMIT_INFORMATION, _win32_jobobject_extended_limit_information_str, base.jobobject_extended_limit_information_str, winnt/JOBOBJECT_EXTENDED_LIMIT_INFORMATION, winnt/PJOBOBJECT_EXTENDED_LIMIT_INFORMATION'
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
req.typenames: JOBOBJECT_EXTENDED_LIMIT_INFORMATION, *PJOBOBJECT_EXTENDED_LIMIT_INFORMATION
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
- JOBOBJECT_EXTENDED_LIMIT_INFORMATION
locale: en-us
document_id: 732de933-52a2-76ca-9b2b-ca47036f295c
document_version_independent_id: e058e51a-bb02-adf8-a68b-62c16723cb19
updated_at: 2024-02-22T19:54:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/winnt/ns-winnt-jobobject_extended_limit_information.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/9267262487657894a8af112d7165006fed5035a7?path=/sdk-api-src/content/winnt/ns-winnt-jobobject_extended_limit_information.md&_a=contents
git_commit_id: 9267262487657894a8af112d7165006fed5035a7
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: ../_backup/toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 292
asset_id: winnt/ns-winnt-jobobject_extended_limit_information
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/winnt/ns-winnt-jobobject_extended_limit_information.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: af0622b8-e24e-3ba9-dcfb-b8e211871716
---

# JOBOBJECT_EXTENDED_LIMIT_INFORMATION (winnt.h) - Win32 apps | Microsoft Learn

Contains basic and extended limit information for a job object.

## Syntax

```cpp
typedef struct _JOBOBJECT_EXTENDED_LIMIT_INFORMATION {
  JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
  IO_COUNTERS                       IoInfo;
  SIZE_T                            ProcessMemoryLimit;
  SIZE_T                            JobMemoryLimit;
  SIZE_T                            PeakProcessMemoryUsed;
  SIZE_T                            PeakJobMemoryUsed;
} JOBOBJECT_EXTENDED_LIMIT_INFORMATION, *PJOBOBJECT_EXTENDED_LIMIT_INFORMATION;
```

## Members

`BasicLimitInformation`

A [JOBOBJECT_BASIC_LIMIT_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_basic_limit_information) structure that contains basic limit information.

`IoInfo`

Reserved.

`ProcessMemoryLimit`

If the **LimitFlags** member of the [JOBOBJECT_BASIC_LIMIT_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_basic_limit_information) structure specifies the **JOB\_OBJECT\_LIMIT\_PROCESS\_MEMORY** value, this member specifies the limit for the virtual memory that can be committed by a process. Otherwise, this member is ignored.

`JobMemoryLimit`

If the **LimitFlags** member of the [JOBOBJECT_BASIC_LIMIT_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_basic_limit_information) structure specifies the **JOB\_OBJECT\_LIMIT\_JOB\_MEMORY** value, this member specifies the limit for the virtual memory that can be committed for the job. Otherwise, this member is ignored.

`PeakProcessMemoryUsed`

The peak memory used by any process ever associated with the job.

`PeakJobMemoryUsed`

The peak memory usage of all processes currently associated with the job.

## Remarks

The system tracks the value of **PeakProcessMemoryUsed** and **PeakJobMemoryUsed** constantly. This allows you know the peak memory usage of each job. You can use this information to establish a memory limit using the **JOB\_OBJECT\_LIMIT\_PROCESS\_MEMORY** or **JOB\_OBJECT\_LIMIT\_JOB\_MEMORY** value.

Note that the job memory and process memory limits are very similar in operation, but they are independent. You could set a job-wide limit of 100 MB with a per-process limit of 10 MB. In this scenario, no single process could commit more than 10 MB, and the set of processes associated with a job could never exceed 100 MB.

To register for notifications that a job has exceeded its peak memory limit while allowing processes to continue to commit memory, use the [SetInformationJobObject](/en-us/windows/desktop/api/jobapi2/nf-jobapi2-setinformationjobobject) function with the **JobObjectNotificationLimitInformation** information class.

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps only] |
| **Minimum supported server** | Windows Server 2003 [desktop apps only] |
| **Header** | winnt.h (include Windows.h) |