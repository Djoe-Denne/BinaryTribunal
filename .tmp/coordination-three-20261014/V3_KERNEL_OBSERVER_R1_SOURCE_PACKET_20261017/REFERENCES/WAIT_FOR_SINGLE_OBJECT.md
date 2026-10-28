---
layout: Conceptual
title: WaitForSingleObject function (synchapi.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitforsingleobject
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
UID: NF:synchapi.WaitForSingleObject
description: Waits until the specified object is in the signaled state or the time-out interval elapses.
old-location: base\waitforsingleobject.htm
tech.root: base
ms.assetid: e37ebff7-b44e-469d-81ab-7a6bd1a0c822
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: WaitForSingleObject, WaitForSingleObject function, _win32_waitforsingleobject, base.waitforsingleobject, synchapi/WaitForSingleObject, winbase/WaitForSingleObject
req.header: synchapi.h
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
- API-MS-Win-Core-Synch-l1-1-0.dll
- KernelBase.dll
- API-MS-Win-Core-Synch-l1-2-0.dll
- API-MS-Win-Core-Synch-l1-2-1.dll
- API-MS-Win-DownLevel-Kernel32-l1-1-0.dll
- MinKernelBase.dll
api_name:
- WaitForSingleObject
locale: en-us
document_id: 6cf1e965-7d47-2a5d-450c-4c2abe28bcde
document_version_independent_id: 066789d1-52c5-726c-7d51-7940e6198d5f
updated_at: 2024-11-20T01:20:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/synchapi/nf-synchapi-waitforsingleobject.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/adea022c86382b9cef5d28bccca8b9b719e57d6b?path=/sdk-api-src/content/synchapi/nf-synchapi-waitforsingleobject.md&_a=contents
git_commit_id: adea022c86382b9cef5d28bccca8b9b719e57d6b
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: ../_base/toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 590
asset_id: synchapi/nf-synchapi-waitforsingleobject
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/synchapi/nf-synchapi-waitforsingleobject.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
platformId: a145e77f-942d-f442-5678-d2d59b88ecc5
---

# WaitForSingleObject function (synchapi.h) - Win32 apps | Microsoft Learn

Waits until the specified object is in the signaled state or the time-out interval elapses.

To enter an alertable wait state, use the [WaitForSingleObjectEx](/en-us/windows/desktop/api/synchapi/nf-synchapi-waitforsingleobjectex) function. To wait for multiple objects, use [WaitForMultipleObjects](/en-us/windows/desktop/api/synchapi/nf-synchapi-waitformultipleobjects).

## Syntax

```cpp
DWORD WaitForSingleObject(
  [in] HANDLE hHandle,
  [in] DWORD  dwMilliseconds
);
```

## Parameters

`[in] hHandle`

A handle to the object. For a list of the object types whose handles can be specified, see the following Remarks section.

If this handle is closed while the wait is still pending, the function's behavior is undefined.

The handle must have the **SYNCHRONIZE** access right. For more information, see [Standard Access Rights](/en-us/windows/desktop/SecAuthZ/standard-access-rights).

`[in] dwMilliseconds`

The time-out interval, in milliseconds. If a nonzero value is specified, the function waits until the object is signaled or the interval elapses. If *dwMilliseconds* is zero, the function does not enter a wait state if the object is not signaled; it always returns immediately. If *dwMilliseconds* is **INFINITE**, the function will return only when the object is signaled.

**Windows XP, Windows Server 2003, Windows Vista, Windows 7, Windows Server 2008, and Windows Server 2008 R2:** The *dwMilliseconds* value does include time spent in low-power states. For example, the timeout does keep counting down while the computer is asleep.

**Windows 8 and newer, Windows Server 2012 and newer:** The *dwMilliseconds* value does not include time spent in low-power states. For example, the timeout does not keep counting down while the computer is asleep.

## Return value

If the function succeeds, the return value indicates the event that caused the function to return. It can be one of the following values.

| Return code/value | Description |
| --- | --- |
| - **WAIT\_ABANDONED**<br>- 0x00000080L | The specified object is a mutex object that was not released by the thread that owned the mutex object before the owning thread terminated. Ownership of the mutex object is granted to the calling thread and the mutex state is set to nonsignaled. <br>If the mutex was protecting persistent state information, you should check it for consistency. |
| - **WAIT\_OBJECT\_0**<br>- 0x00000000L | The state of the specified object is signaled. |
| - **WAIT\_TIMEOUT**<br>- 0x00000102L | The time-out interval elapsed, and the object's state is nonsignaled. |
| - **WAIT\_FAILED**<br>- (DWORD)0xFFFFFFFF | The function has failed. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror). |

## Remarks

The **WaitForSingleObject** function checks the current state of the specified object. If the object's state is nonsignaled, the calling thread enters the wait state until the object is signaled or the time-out interval elapses.

The function modifies the state of some types of synchronization objects. Modification occurs only for the object whose signaled state caused the function to return. For example, the count of a semaphore object is decreased by one.

The **WaitForSingleObject** function can wait for the following objects:

- Change notification
- Console input
- Event
- Memory resource notification
- Mutex
- Process
- Semaphore
- Thread
- Waitable timer

 Use caution when calling the wait functions and code that directly or indirectly creates windows. If a thread creates any windows, it must process messages. Message broadcasts are sent to all windows in the system. A thread that uses a wait function with an **INFINITE** time-out interval may cause the system to become deadlocked. Two examples of code that indirectly creates windows are DDE and the [CoInitialize](/en-us/windows/desktop/api/objbase/nf-objbase-coinitialize) function. Therefore, if you have a thread that creates windows, use [MsgWaitForMultipleObjects](/en-us/windows/desktop/api/winuser/nf-winuser-msgwaitformultipleobjects) or [MsgWaitForMultipleObjectsEx](/en-us/windows/desktop/api/winuser/nf-winuser-msgwaitformultipleobjectsex), rather than **WaitForSingleObject**. 
#### Examples

For an example, see [Using Mutex Objects](/en-us/windows/desktop/Sync/using-mutex-objects).

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows XP [desktop apps | UWP apps] |
| **Minimum supported server** | Windows Server 2003 [desktop apps | UWP apps] |
| **Target Platform** | Windows |
| **Header** | synchapi.h (include Windows.h on Windows Server 2003, Windows Vista, Windows 7, Windows Server 2008 Windows Server 2008 R2) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |