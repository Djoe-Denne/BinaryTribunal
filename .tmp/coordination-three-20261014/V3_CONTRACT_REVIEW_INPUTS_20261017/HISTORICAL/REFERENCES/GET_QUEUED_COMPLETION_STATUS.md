---
layout: Conceptual
title: GetQueuedCompletionStatus function (ioapiset.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus
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
UID: NF:ioapiset.GetQueuedCompletionStatus
description: Attempts to dequeue an I/O completion packet from the specified I/O completion port.
old-location: fs\getqueuedcompletionstatus.htm
tech.root: fs
ms.assetid: 8121a38b-0fe1-43b8-aed6-4b85af1feba9
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: GetQueuedCompletionStatus, GetQueuedCompletionStatus function [Files], _win32_getqueuedcompletionstatus, base.getqueuedcompletionstatus, fs.getqueuedcompletionstatus, ioapiset/GetQueuedCompletionStatus
req.header: ioapiset.h
req.include-header: Windows.h
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
- Kernel32.dll
- API-MS-Win-Core-io-l1-1-0.dll
- KernelBase.dll
- MinKernelBase.dll
- API-MS-Win-Core-io-l1-1-1.dll
- api-ms-win-downlevel-kernel32-l1-1-0.dll
api_name:
- GetQueuedCompletionStatus
locale: en-us
document_id: 82d2a986-4dcf-4a55-e201-e4117a2dade4
document_version_independent_id: a3d86a1e-01bd-f07f-ece4-1422948fa629
updated_at: 2024-08-22T19:27:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/ioapiset/nf-ioapiset-getqueuedcompletionstatus.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/6b9a67de5437d21f17f6d91324777b31fd5da045?path=/sdk-api-src/content/ioapiset/nf-ioapiset-getqueuedcompletionstatus.md&_a=contents
git_commit_id: 6b9a67de5437d21f17f6d91324777b31fd5da045
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: ../_fs/toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 777
asset_id: ioapiset/nf-ioapiset-getqueuedcompletionstatus
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/ioapiset/nf-ioapiset-getqueuedcompletionstatus.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: 9231b83c-375c-2558-2d05-8dbbd1989348
---

# GetQueuedCompletionStatus function (ioapiset.h) - Win32 apps | Microsoft Learn

Attempts to dequeue an I/O completion packet from the specified I/O completion port. If there is no completion packet queued, the function waits for a pending I/O operation associated with the completion port to complete.

To dequeue multiple I/O completion packets at once, use the [GetQueuedCompletionStatusEx](/en-us/windows/desktop/FileIO/getqueuedcompletionstatusex-func) function.

## Syntax

```cpp
BOOL GetQueuedCompletionStatus(
  [in]  HANDLE       CompletionPort,
        LPDWORD      lpNumberOfBytesTransferred,
  [out] PULONG_PTR   lpCompletionKey,
  [out] LPOVERLAPPED *lpOverlapped,
  [in]  DWORD        dwMilliseconds
);
```

## Parameters

`[in] CompletionPort`

A handle to the completion port. To create a completion port, use the [CreateIoCompletionPort](/en-us/windows/desktop/FileIO/createiocompletionport) function.

`lpNumberOfBytesTransferred`

A pointer to a variable that receives the number of bytes transferred in a completed I/O operation.

`[out] lpCompletionKey`

A pointer to a variable that receives the completion key value associated with the file handle whose I/O operation has completed. A completion key is a per-file key that is specified in a call to [CreateIoCompletionPort](/en-us/windows/desktop/FileIO/createiocompletionport).

`[out] lpOverlapped`

A pointer to a variable that receives the address of the [OVERLAPPED](/en-us/windows/desktop/api/minwinbase/ns-minwinbase-overlapped) structure that was specified when the completed I/O operation was started.

Even if you have passed the function a file handle associated with a completion port and a valid [OVERLAPPED](/en-us/windows/desktop/api/minwinbase/ns-minwinbase-overlapped) structure, an application can prevent completion port notification. This is done by specifying a valid event handle for the **hEvent** member of the **OVERLAPPED** structure, and setting its low-order bit. A valid event handle whose low-order bit is set prevents the completion of the overlapped I/O from enqueing a completion packet to the completion port.

`[in] dwMilliseconds`

The number of milliseconds that the caller is willing to wait for a completion packet to appear at the completion port. If a completion packet does not appear within the specified time, the function times out, returns **FALSE**, and sets \**lpOverlapped* to **NULL**.

If *dwMilliseconds* is **INFINITE**, the function will never time out. If *dwMilliseconds* is zero and there is no I/O operation to dequeue, the function will time out immediately.

**Windows XP, Windows Server 2003, Windows Vista, Windows 7, Windows Server 2008, and Windows Server 2008 R2:** The *dwMilliseconds* value includes time spent in low-power states. For example, the timeout continues counting down while the computer is asleep.

**Windows 8 and newer, Windows Server 2012 and newer:** The *dwMilliseconds* value does not include time spent in low-power states. For example, the timeout does not continue counting down while the computer is asleep.

## Return value

Returns nonzero (**TRUE**) if successful or zero (**FALSE**) otherwise.

To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

For more information, see the Remarks section.

## Remarks

This function associates a thread with the specified completion port. A thread can be associated with at most one completion port.

If a call to **GetQueuedCompletionStatus** fails because the completion port handle associated with it is closed while the call is outstanding, the function returns **FALSE**, *\*lpOverlapped* will be **NULL**, and [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror) will return **ERROR\_ABANDONED\_WAIT\_0**.

**Windows Server 2003 and Windows XP: **Closing the completion port handle while a call is outstanding will not result in the previously stated behavior. The function will continue to wait until an entry is removed from the port or until a time-out occurs, if specified as a value other than **INFINITE**.

If the **GetQueuedCompletionStatus** function succeeds, it dequeued a completion packet for a successful I/O operation from the completion port and has stored information in the variables pointed to by the following parameters: *lpNumberOfBytes*, *lpCompletionKey*, and *lpOverlapped*. Upon failure (the return value is **FALSE**), those same parameters can contain particular value combinations as follows:

- If \**lpOverlapped* is **NULL**, the function did not dequeue a completion packet from the completion port. In this case, the function does not store information in the variables pointed to by the *lpNumberOfBytes* and *lpCompletionKey* parameters, and their values are indeterminate.
- If \**lpOverlapped* is not **NULL** and the function dequeues a completion packet for a failed I/O operation from the completion port, the function stores information about the failed operation in the variables pointed to by *lpNumberOfBytes*, *lpCompletionKey*, and *lpOverlapped*. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

 For more information on I/O completion port theory, usage, and associated functions, see [I/O Completion Ports](/en-us/windows/desktop/FileIO/i-o-completion-ports). 
In Windows 8 and Windows Server 2012, this function is supported by the following technologies.

| Technology | Supported |
| --- | --- |
| Server Message Block (SMB) 3.0 protocol | Yes |
| SMB 3.0 Transparent Failover (TFO) | Yes |
| SMB 3.0 with Scale-out File Shares (SO) | Yes |
| Cluster Shared Volume File System (CsvFS) | Yes |
| Resilient File System (ReFS) | Yes |

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps | UWP apps] |
| **Minimum supported server** | Windows Server 2003 [desktop apps | UWP apps] |
| **Target Platform** | Windows |
| **Header** | ioapiset.h (include Windows.h) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |