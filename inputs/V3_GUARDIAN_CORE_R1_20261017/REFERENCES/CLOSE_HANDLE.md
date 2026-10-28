---
layout: Conceptual
title: CloseHandle function (handleapi.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-closehandle
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
UID: NF:handleapi.CloseHandle
description: Closes an open object handle.
old-location: base\closehandle.htm
tech.root: winprog
ms.assetid: 9b84891d-62ca-4ddc-97b7-c4c79482abd9
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: CloseHandle, CloseHandle function, _win32_closehandle, base.closehandle, handleapi/CloseHandle
req.header: handleapi.h
req.include-header: Windows.h
req.target-type: Windows
req.target-min-winverclnt: Windows 2000 Professional [desktop apps \| UWP apps]
req.target-min-winversvr: Windows 2000 Server [desktop apps \| UWP apps]
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
ms.custom: snippet-project
topic_type:
- APIRef
- kbSyntax
api_type:
- DllExport
api_location:
- Kernel32.dll
- API-MS-Win-Core-handle-l1-1-0.dll
- KernelBase.dll
- API-MS-Win-DownLevel-Kernel32-l1-1-0.dll
- MinKernelBase.dll
api_name:
- CloseHandle
locale: en-us
document_id: 6501dee2-b9d5-cb60-df44-ac3732454bb4
document_version_independent_id: fb078b8f-25e9-d383-dfc8-a22741e66123
updated_at: 2024-02-22T19:54:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/handleapi/nf-handleapi-closehandle.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/9267262487657894a8af112d7165006fed5035a7?path=/sdk-api-src/content/handleapi/nf-handleapi-closehandle.md&_a=contents
git_commit_id: 9267262487657894a8af112d7165006fed5035a7
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 657
asset_id: handleapi/nf-handleapi-closehandle
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/handleapi/nf-handleapi-closehandle.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
platformId: 9f88a121-c2c8-cdfe-3cb7-aa9a46bbbf44
---

# CloseHandle function (handleapi.h) - Win32 apps | Microsoft Learn

Closes an open object handle.

## Syntax

```cpp
BOOL CloseHandle(
  [in] HANDLE hObject
);
```

## Parameters

`[in] hObject`

A valid handle to an open object.

## Return value

If the function succeeds, the return value is nonzero.

If the function fails, the return value is zero. To get extended error information, call [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror).

If the application is running under a debugger, the function will throw an exception if it receives either a handle value that is not valid or a pseudo-handle value. This can happen if you close a handle twice, or if you call **CloseHandle** on a handle returned by the [FindFirstFile](/en-us/windows/desktop/api/fileapi/nf-fileapi-findfirstfilea) function instead of calling the [FindClose](/en-us/windows/desktop/api/fileapi/nf-fileapi-findclose) function.

## Remarks

The **CloseHandle** function closes handles to the following objects:

- Access token
- Communications device
- Console input
- Console screen buffer
- Event
- File
- File mapping
- I/O completion port
- Job
- Mailslot
- Memory resource notification
- Mutex
- Named pipe
- Pipe
- Process
- Semaphore
- Thread
- Transaction
- Waitable timer

 The documentation for the functions that create these objects indicates that **CloseHandle** should be used when you are finished with the object, and what happens to pending operations on the object after the handle is closed. In general, **CloseHandle** invalidates the specified object handle, decrements the object's handle count, and performs object retention checks. After the last handle to an object is closed, the object is removed from the system. For a summary of the creator functions for these objects, see [Kernel Objects](/en-us/windows/desktop/SysInfo/kernel-objects). 
Generally, an application should call **CloseHandle** once for each handle it opens. It is usually not necessary to call **CloseHandle** if a function that uses a handle fails with ERROR\_INVALID\_HANDLE, because this error usually indicates that the handle is already invalidated. However, some functions use ERROR\_INVALID\_HANDLE to indicate that the object itself is no longer valid. For example, a function that attempts to use a handle to a file on a network might fail with ERROR\_INVALID\_HANDLE if the network connection is severed, because the file object is no longer available. In this case, the application should close the handle.

If a handle is transacted, all handles bound to a transaction should be closed before the transaction is committed. If a transacted handle was opened by calling [CreateFileTransacted](/en-us/windows/desktop/api/winbase/nf-winbase-createfiletransacteda) with the FILE\_FLAG\_DELETE\_ON\_CLOSE flag, the file is not deleted until the application closes the handle and calls [CommitTransaction](/en-us/windows/desktop/api/ktmw32/nf-ktmw32-committransaction). For more information about transacted objects, see [Working With Transactions](/en-us/windows/desktop/Ktm/programming-model).

Closing a thread handle does not terminate the associated thread or remove the thread object. Closing a process handle does not terminate the associated process or remove the process object. To remove a thread object, you must terminate the thread, then close all handles to the thread. For more information, see [Terminating a Thread](/en-us/windows/desktop/ProcThread/terminating-a-thread). To remove a process object, you must terminate the process, then close all handles to the process. For more information, see [Terminating a Process](/en-us/windows/desktop/ProcThread/terminating-a-process).

Closing a handle to a file mapping can succeed even when there are file views that are still open. For more information, see [Closing a File Mapping Object](/en-us/windows/desktop/Memory/closing-a-file-mapping-object).

Do not use the **CloseHandle** function to close a socket. Instead, use the [closesocket](/en-us/windows/desktop/api/winsock/nf-winsock-closesocket) function, which releases all resources associated with the socket including the handle to the socket object. For more information, see [Socket Closure](/en-us/windows/desktop/WinSock/graceful-shutdown-linger-options-and-socket-closure-2).

Do not use the **CloseHandle** function to close a handle to an open registry key. Instead, use the [RegCloseKey](/en-us/windows/desktop/api/winreg/nf-winreg-regclosekey) function. **CloseHandle** does not close the handle to the registry key, but does not return an error to indicate this failure.

#### Examples

```cpp
dwPriorityClass = 0;
hProcess = OpenProcess( PROCESS_ALL_ACCESS, FALSE, pe32.th32ProcessID );
if( hProcess == NULL )printError( TEXT("OpenProcess") );
else
{dwPriorityClass = GetPriorityClass( hProcess );if( !dwPriorityClass )printError( TEXT("GetPriorityClass") );CloseHandle( hProcess );
}
```

To see this example in context, see [Taking a Snapshot and Viewing Processes](/en-us/windows/desktop/ToolHelp/taking-a-snapshot-and-viewing-processes).

## Requirements

| Requirement | Value |
| --- | --- |
| **Minimum supported client** | Windows 2000 Professional [desktop apps | UWP apps] |
| **Minimum supported server** | Windows 2000 Server [desktop apps | UWP apps] |
| **Target Platform** | Windows |
| **Header** | handleapi.h (include Windows.h) |
| **Library** | Kernel32.lib |
| **DLL** | Kernel32.dll |