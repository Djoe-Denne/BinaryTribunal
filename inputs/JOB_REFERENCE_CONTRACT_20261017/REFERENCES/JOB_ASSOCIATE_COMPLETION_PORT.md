---
layout: Conceptual
title: JOBOBJECT_ASSOCIATE_COMPLETION_PORT (winnt.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_associate_completion_port
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
UID: NS:winnt._JOBOBJECT_ASSOCIATE_COMPLETION_PORT
description: Contains information used to associate a completion port with a job.
old-location: base\jobobject_associate_completion_port_str.htm
tech.root: backup
ms.assetid: 18120d81-5480-4e0d-8422-0366a6811319
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: '*PJOBOBJECT_ASSOCIATE_COMPLETION_PORT, JOBOBJECT_ASSOCIATE_COMPLETION_PORT, JOBOBJECT_ASSOCIATE_COMPLETION_PORT structure, PJOBOBJECT_ASSOCIATE_COMPLETION_PORT, PJOBOBJECT_ASSOCIATE_COMPLETION_PORT structure pointer, _JOBOBJECT_ASSOCIATE_COMPLETION_PORT, _win32_jobobject_associate_completion_port_str, base.jobobject_associate_completion_port_str, winnt/JOBOBJECT_ASSOCIATE_COMPLETION_PORT, winnt/PJOBOBJECT_ASSOCIATE_COMPLETION_PORT'
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
req.typenames: JOBOBJECT_ASSOCIATE_COMPLETION_PORT, *PJOBOBJECT_ASSOCIATE_COMPLETION_PORT
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
- JOBOBJECT_ASSOCIATE_COMPLETION_PORT
locale: en-us
document_id: ce9c7535-975f-28d0-4bda-bea60a7f3c46
document_version_independent_id: 2f5b3c2b-2557-9706-94aa-8b288d3f7b14
updated_at: 2025-03-13T13:12:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/winnt/ns-winnt-jobobject_associate_completion_port.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/3f0c2f44258b687c94dc0143de048f3d29a1d401?path=/sdk-api-src/content/winnt/ns-winnt-jobobject_associate_completion_port.md&_a=contents
git_commit_id: 3f0c2f44258b687c94dc0143de048f3d29a1d401
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: ../_backup/toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 920
asset_id: winnt/ns-winnt-jobobject_associate_completion_port
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/winnt/ns-winnt-jobobject_associate_completion_port.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: b3341c99-e72d-f4cc-c2ae-56dc2b15f56f
---

# JOBOBJECT_ASSOCIATE_COMPLETION_PORT (winnt.h) - Win32 apps | Microsoft Learn

Contains information used to associate a completion port with a job. You can associate one completion port with a job.

## Syntax

```cpp
typedef struct _JOBOBJECT_ASSOCIATE_COMPLETION_PORT {
  PVOID  CompletionKey;
  HANDLE CompletionPort;
} JOBOBJECT_ASSOCIATE_COMPLETION_PORT, *PJOBOBJECT_ASSOCIATE_COMPLETION_PORT;
```

## Members

`CompletionKey`

The value to use in the *dwCompletionKey* parameter of [PostQueuedCompletionStatus](/en-us/windows/desktop/FileIO/postqueuedcompletionstatus) when messages are sent on behalf of the job.

`CompletionPort`

The completion port to use in the *CompletionPort* parameter of the [PostQueuedCompletionStatus](/en-us/windows/desktop/FileIO/postqueuedcompletionstatus) function when messages are sent on behalf of the job.

**Windows 8 and newer, Windows Server 2012 and newer:** Specify **NULL** to remove the association between the current completion port and the job.

## Remarks

The system sends messages to the I/O completion port associated with a job when certain events occur. If the job is nested, the message is sent to every I/O completion port associated with any job in the parent job chain of the job that triggered the message. All messages are sent directly from the job as if the job had called the [PostQueuedCompletionStatus](/en-us/windows/desktop/FileIO/postqueuedcompletionstatus) function.

Note that, except for limits set with the **JobObjectNotificationLimitInformation** information class, messages are intended only as notifications and their delivery to the completion port is not guaranteed. The failure of a message to arrive at the completion port does not necessarily mean that the event did not occur. Notifications for limits set with **JobObjectNotificationLimitInformation** are guaranteed to arrive at the completion port.

A thread must monitor the completion port using the [GetQueuedCompletionStatus](/en-us/windows/desktop/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus) function to pick up the messages. The thread receives information in the **GetQueuedCompletionStatus** parameters shown in the following table.

| Parameter | Information Received |
| --- | --- |
| *lpCompletionKey* | The value specified in *CompletionKey* during the completion-port association. If a completion port is associated with multiple jobs, *CompletionKey* should help the caller determine which completion port is sending a message. |
| *lpOverlapped* | Message-specific value. For more information, see the following table of message identifiers. |
| *LpNumberOfBytes* | The message identifier that indicates which job-related event occurred. For more information, see the following table of message identifiers. |

The following messages can be sent to the completion port. Note that for messages that return a process identifier, you cannot guarantee that this process is still active or that the identifier has not been recycled (assigned to a new process after termination) unless you maintain an open handle to the process.

| Message Identifier | Description |
| --- | --- |
| JOB\_OBJECT\_MSG\_ABNORMAL\_EXIT\_PROCESS | Indicates that a process associated with the job exited with an exit code that indicates an abnormal exit (see the list following this table). <br>The value of *lpOverlapped* is the identifier of the exiting process. |
| JOB\_OBJECT\_MSG\_ACTIVE\_PROCESS\_LIMIT | Indicates that the active process limit has been exceeded. <br>The value of *lpOverlapped* is NULL. |
| JOB\_OBJECT\_MSG\_ACTIVE\_PROCESS\_ZERO | Indicates that the active process count has been decremented to 0. For example, if the job currently has two active processes, the system sends this message after they both terminate. <br>The value of *lpOverlapped* is NULL. |
| JOB\_OBJECT\_MSG\_END\_OF\_JOB\_TIME | Indicates that the JOB\_OBJECT\_POST\_AT\_END\_OF\_JOB option is in effect and the end-of-job time limit has been reached. Upon posting this message, the time limit is canceled and the job's processes can continue to run. <br>The value of *lpOverlapped* is NULL. |
| JOB\_OBJECT\_MSG\_END\_OF\_PROCESS\_TIME | Indicates that a process has exceeded a per-process time limit. The system sends this message after the process termination has been requested. <br>The value of *lpOverlapped* is the identifier of the process that exceeded its limit. |
| JOB\_OBJECT\_MSG\_EXIT\_PROCESS | Indicates that a process associated with the job has exited. <br>The value of *lpOverlapped* is the identifier of the exiting process. |
| JOB\_OBJECT\_MSG\_JOB\_MEMORY\_LIMIT | Indicates that a process associated with the job caused the job to exceed the job-wide memory limit (if one is in effect). <br>The value of *lpOverlapped* specifies the identifier of the process that has attempted to exceed the limit. The system does not send this message if the process has not yet reported its process identifier. |
| JOB\_OBJECT\_MSG\_NEW\_PROCESS | Indicates that a process has been added to the job. Processes added to a job at the time a completion port is associated are also reported. <br>The value of *lpOverlapped* is the identifier of the process added to the job. |
| JOB\_OBJECT\_MSG\_NOTIFICATION\_LIMIT | Indicates that a process associated with a job that has registered for resource limit notifications has exceeded one or more limits. Use the [QueryInformationJobObject](/en-us/windows/desktop/api/jobapi2/nf-jobapi2-queryinformationjobobject) function with JobObjectLimitViolationInformation to determine which limit was exceeded. <br>The value of *lpOverlapped* is the identifier of the process that has exceeded its limit. The system does not send this message if the process has not yet reported its process identifier. |
| JOB\_OBJECT\_MSG\_PROCESS\_MEMORY\_LIMIT | Indicates that a process associated with the job has exceeded its memory limit (if one is in effect). <br>The value of *lpOverlapped* is the identifier of the process that has exceeded its limit. The system does not send this message if the process has not yet reported its process identifier. |

The following exit codes indicate an abnormal exit:

- STATUS\_GUARD\_PAGE\_VIOLATION
- STATUS\_DATATYPE\_MISALIGNMENT
- STATUS\_BREAKPOINT
- STATUS\_SINGLE\_STEP
- STATUS\_ACCESS\_VIOLATION
- STATUS\_IN\_PAGE\_ERROR
- STATUS\_ILLEGAL\_INSTRUCTION
- STATUS\_NONCONTINUABLE\_EXCEPTION
- STATUS\_INVALID\_DISPOSITION
- STATUS\_ARRAY\_BOUNDS\_EXCEEDED
- STATUS\_FLOAT\_DENORMAL\_OPERAND
- STATUS\_FLOAT\_DIVIDE\_BY\_ZERO
- STATUS\_FLOAT\_INEXACT\_RESULT
- STATUS\_FLOAT\_INVALID\_OPERATION
- STATUS\_FLOAT\_OVERFLOW
- STATUS\_FLOAT\_STACK\_CHECK
- STATUS\_FLOAT\_UNDERFLOW
- STATUS\_INTEGER\_DIVIDE\_BY\_ZERO
- STATUS\_INTEGER\_OVERFLOW
- STATUS\_PRIVILEGED\_INSTRUCTION
- STATUS\_STACK\_OVERFLOW
- STATUS\_CONTROL\_C\_EXIT
- STATUS\_FLOAT\_MULTIPLE\_FAULTS
- STATUS\_FLOAT\_MULTIPLE\_TRAPS
- STATUS\_REG\_NAT\_CONSUMPTION

You must be cautious when using the JOB\_OBJECT\_MSG\_NEW\_PROCESS and JOB\_OBJECT\_MSG\_EXIT\_PROCESS messages, as race conditions may occur. For instance, if processes are actively starting and exiting within a job, and you are in the process of assigning a completion port to the job, you may miss messages for processes whose states change during the association of the completion port. For this reason, it is best to associate a completion port with a job when the job is inactive.

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps only] |
| **Minimum supported server** | Windows Server 2003 [desktop apps only] |
| **Header** | winnt.h (include Windows.h) |