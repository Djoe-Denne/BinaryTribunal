---
layout: Conceptual
title: QueryInformationJobObject function (jobapi2.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-queryinformationjobobject
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
UID: NF:jobapi2.QueryInformationJobObject
description: Retrieves limit and job state information from the job object.
old-location: base\queryinformationjobobject.htm
tech.root: backup
ms.assetid: d843d578-fd67-4708-959f-00245ff70ec6
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: JobObjectBasicAccountingInformation, JobObjectBasicAndIoAccountingInformation, JobObjectBasicLimitInformation, JobObjectBasicProcessIdList, JobObjectBasicUIRestrictions, JobObjectCpuRateControlInformation, JobObjectEndOfJobTimeInformation, JobObjectExtendedLimitInformation, JobObjectGroupInformation, JobObjectGroupInformationEx, JobObjectLimitViolationInformation, JobObjectLimitViolationInformation2, JobObjectNetRateControlInformation, JobObjectNotificationLimitInformation, JobObjectNotificationLimitInformation2, JobObjectSecurityLimitInformation, QueryInformationJobObject, QueryInformationJobObject function, _win32_queryinformationjobobject, base.queryinformationjobobject, jobapi2/QueryInformationJobObject
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
- QueryInformationJobObject
locale: en-us
document_id: 14c814cc-4eb0-011d-ec11-60034f1d4ea5
document_version_independent_id: 091cbe13-1a3a-f053-c20d-9c0c0f7a79b2
updated_at: 2024-02-22T19:54:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/jobapi2/nf-jobapi2-queryinformationjobobject.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/9267262487657894a8af112d7165006fed5035a7?path=/sdk-api-src/content/jobapi2/nf-jobapi2-queryinformationjobobject.md&_a=contents
git_commit_id: 9267262487657894a8af112d7165006fed5035a7
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 762
asset_id: jobapi2/nf-jobapi2-queryinformationjobobject
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/jobapi2/nf-jobapi2-queryinformationjobobject.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/fc3f72c2-fb6f-4cea-95ee-b444e52254ee
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/f12cf087-582d-48ac-a085-0c19adf1e391
platformId: 67ecbe93-5045-8f55-e69e-943dd9649ecf
---

# QueryInformationJobObject function (jobapi2.h) - Win32 apps | Microsoft Learn

Retrieves limit and job state information from the job object.

## Syntax

```cpp
BOOL QueryInformationJobObject(
  [in, optional]  HANDLE             hJob,
  [in]            JOBOBJECTINFOCLASS JobObjectInformationClass,
  [out]           LPVOID             lpJobObjectInformation,
  [in]            DWORD              cbJobObjectInformationLength,
  [out, optional] LPDWORD            lpReturnLength
);
```

## Parameters

`[in, optional] hJob`

A handle to the job whose information is being queried. The [CreateJobObject](/en-us/windows/desktop/api/winbase/nf-winbase-createjobobjecta) or [OpenJobObject](/en-us/windows/desktop/api/winbase/nf-winbase-openjobobjecta) function returns this handle. The handle must have the **JOB\_OBJECT\_QUERY** access right. For more information, see [Job Object Security and Access Rights](/en-us/windows/desktop/ProcThread/job-object-security-and-access-rights).

If this value is NULL and the calling process is associated with a job, the job associated with the calling process is used. If the job is nested, the immediate job of the calling process is used.

`[in] JobObjectInformationClass`

The information class for the limits to be queried. This parameter can be one of the following values.

| Value | Meaning |
| --- | --- |
| - **JobObjectBasicAccountingInformation**<br>- 1 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_BASIC_ACCOUNTING_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_basic_accounting_information) structure. |
| - **JobObjectBasicAndIoAccountingInformation**<br>- 8 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_BASIC_AND_IO_ACCOUNTING_INFORMATION](/en-us/windows/win32/api/winnt/ns-winnt-jobobject_basic_and_io_accounting_information) structure. |
| - **JobObjectBasicLimitInformation**<br>- 2 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_BASIC_LIMIT_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_basic_limit_information) structure. |
| - **JobObjectBasicProcessIdList**<br>- 3 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_BASIC_PROCESS_ID_LIST](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_basic_process_id_list) structure. |
| - **JobObjectBasicUIRestrictions**<br>- 4 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_BASIC_UI_RESTRICTIONS](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_basic_ui_restrictions) structure. |
| - **JobObjectCpuRateControlInformation**<br>- 15 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_CPU_RATE_CONTROL_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_cpu_rate_control_information) structure. <br>**Windows 7, Windows Server 2008 R2, Windows Server 2008, Windows Vista, Windows Server 2003 and Windows XP: **This flag is not supported. |
| - **JobObjectEndOfJobTimeInformation**<br>- 6 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_END_OF_JOB_TIME_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_end_of_job_time_information) structure. |
| - **JobObjectExtendedLimitInformation**<br>- 9 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_EXTENDED_LIMIT_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_extended_limit_information) structure. |
| - **JobObjectGroupInformation**<br>- 11 | The *lpJobObjectInfo* parameter is a pointer to a buffer that receives the list of [processor groups](/en-us/windows/desktop/ProcThread/processor-groups) to which the job is currently assigned. The variable pointed to by the *lpReturnLength* parameter is set to the size of the group data. Divide this value by `sizeof(USHORT)` to determine the number of groups. <br>**Windows Server 2008, Windows Vista, Windows Server 2003 and Windows XP: **This flag is not supported. |
| - **JobObjectGroupInformationEx**<br>- 14 | The *lpJobObjectInfo* parameter is a pointer to a buffer that receives an array of [GROUP_AFFINITY](/en-us/windows/desktop/api/winnt/ns-winnt-group_affinity) structures that indicate the affinity of the job in the [processor groups](/en-us/windows/desktop/ProcThread/processor-groups) to which the job is currently assigned. The variable pointed to by the *lpReturnLength* parameter is set to the size of the group affinity data. Divide this value by `sizeof(GROUP_AFFINITY)` to determine the number of groups. <br>**Windows 7, Windows Server 2008 R2, Windows Server 2008, Windows Vista, Windows Server 2003 and Windows XP: **This flag is not supported. |
| - **JobObjectLimitViolationInformation**<br>- 13 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_LIMIT_VIOLATION_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_limit_violation_information) structure. <br>**Windows 7, Windows Server 2008 R2, Windows Server 2008, Windows Vista, Windows Server 2003 and Windows XP: **This flag is not supported. |
| - **JobObjectLimitViolationInformation2**<br>- 34 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_LIMIT_VIOLATION_INFORMATION_2](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_limit_violation_information_2) structure. <br>**Windows 8.1, Windows Server 2012 R2, Windows 8, Windows Server 2012, Windows 7, Windows Server 2008 R2, Windows Server 2008, Windows Vista, Windows Server 2003 and Windows XP: **This flag is not supported. |
| - **JobObjectNetRateControlInformation**<br>- 32 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_NET_RATE_CONTROL_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_net_rate_control_information) structure. <br>**Windows 8.1, Windows Server 2012 R2, Windows 8, Windows Server 2012, Windows 7, Windows Server 2008 R2, Windows Server 2008, Windows Vista, Windows Server 2003 and Windows XP: **This flag is not supported. |
| - **JobObjectNotificationLimitInformation**<br>- 12 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_NOTIFICATION_LIMIT_INFORMATION](/en-us/windows/win32/api/winnt/ns-winnt-jobobject_notification_limit_information) structure. <br>**Windows 7, Windows Server 2008 R2, Windows Server 2008, Windows Vista, Windows Server 2003 and Windows XP: **This flag is not supported. |
| - **JobObjectNotificationLimitInformation2**<br>- 33 | The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_NOTIFICATION_LIMIT_INFORMATION_2](/en-us/windows/win32/api/winnt/ns-winnt-jobobject_notification_limit_information) structure. <br>**Windows 8.1, Windows Server 2012 R2, Windows 8, Windows Server 2012, Windows 7, Windows Server 2008 R2, Windows Server 2008, Windows Vista, Windows Server 2003 and Windows XP: **This flag is not supported. |
| - **JobObjectSecurityLimitInformation**<br>- 5 | This flag is not supported. Applications must set security limits individually for each process. **Windows Server 2003 and Windows XP: **The *lpJobObjectInfo* parameter is a pointer to a [JOBOBJECT_SECURITY_LIMIT_INFORMATION](/en-us/windows/desktop/api/winnt/ns-winnt-jobobject_security_limit_information) structure. |

`[out] lpJobObjectInformation`

The limit or job state information. The format of this data depends on the value of the *JobObjectInfoClass* parameter.

`[in] cbJobObjectInformationLength`

The count of the job information being queried, in bytes. This value depends on the value of the *JobObjectInfoClass* parameter.

`[out, optional] lpReturnLength`

A pointer to a variable that receives the length of data written to the structure pointed to by the *lpJobObjectInfo* parameter. Specify **NULL** to not receive this information.

## Return value

If the function succeeds, the return value is nonzero.

If the function fails, the return value is zero. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

## Remarks

Use **QueryInformationJobObject** to obtain the current limits and modify them. Use the [SetInformationJobObject](/en-us/windows/desktop/api/jobapi2/nf-jobapi2-setinformationjobobject) function to set new limits.

To compile an application that uses this function, define **\_WIN32\_WINNT** as 0x0500 or later. For more information, see [Using the Windows Headers](/en-us/windows/desktop/WinProg/using-the-windows-headers).

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps only] |
| **Minimum supported server** | Windows Server 2003 [desktop apps only] |
| **Target Platform** | Windows |
| **Header** | jobapi2.h (include Windows.h) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |