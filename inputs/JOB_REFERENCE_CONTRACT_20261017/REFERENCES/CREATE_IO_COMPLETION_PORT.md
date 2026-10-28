---
layout: Conceptual
title: CreateIoCompletionPort function (ioapiset.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-createiocompletionport
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
UID: NF:ioapiset.CreateIoCompletionPort
description: Creates an input/output (I/O) completion port and associates it with a specified file handle, or creates an I/O completion port that is not yet associated with a file handle, allowing association at a later time.
old-location: fs\createiocompletionport.htm
tech.root: fs
ms.assetid: 40cb47fc-7b15-47f6-bee2-2611d4686053
ms.date: 2018-12-05T00:00:00.0000000Z
ms.keywords: CreateIoCompletionPort, CreateIoCompletionPort function [Files], _win32_createiocompletionport, base.createiocompletionport, fs.createiocompletionport, ioapiset/CreateIoCompletionPort, winbase/CreateIoCompletionPort
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
- CreateIoCompletionPort
locale: en-us
document_id: cc936f7f-a726-a67e-0ef0-5a5da26fea4c
document_version_independent_id: 554fecb8-c09a-b2b4-5b18-e7ace60446d8
updated_at: 2024-02-22T19:54:00.0000000Z
original_content_git_url: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build?path=/sdk-api-src/content/ioapiset/nf-ioapiset-createiocompletionport.md&version=GBlive&_a=contents
gitcommit: https://cpubwin.visualstudio.com/DefaultCollection/win32/_git/sdk-api-build/commit/9267262487657894a8af112d7165006fed5035a7?path=/sdk-api-src/content/ioapiset/nf-ioapiset-createiocompletionport.md&_a=contents
git_commit_id: 9267262487657894a8af112d7165006fed5035a7
site_name: Docs
depot_name: MSDN.sdk-api-build
page_type: conceptual
toc_rel: ../_fs/toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.sdk-api-build/{branchName}{pdfName}
search.mshattr.devlang: c++
word_count: 1152
asset_id: ioapiset/nf-ioapiset-createiocompletionport
moniker_range_name: 
monikers: []
item_type: Content
source_path: sdk-api-src/content/ioapiset/nf-ioapiset-createiocompletionport.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
platformId: 0ab4b908-4f71-7aa4-60f7-b3deb81283be
---

# CreateIoCompletionPort function (ioapiset.h) - Win32 apps | Microsoft Learn

Creates an input/output (I/O) completion port and associates it with a specified file handle, or creates an I/O completion port that is not yet associated with a file handle, allowing association at a later time.

Associating an instance of an opened file handle with an I/O completion port allows a process to receive notification of the completion of asynchronous I/O operations involving that file handle.
**Note**
The term *file handle* as used here refers to a system abstraction that represents an overlapped I/O endpoint, not only a file on disk. Any system objects that support overlapped I/O—such as network endpoints, TCP sockets, named pipes, and mail slots—can be used as file handles. For additional information, see the Remarks section. 

## Syntax

```cpp
HANDLE CreateIoCompletionPort(
  [in]           HANDLE    FileHandle,
  [in, optional] HANDLE    ExistingCompletionPort,
  [in]           ULONG_PTR CompletionKey,
  [in]           DWORD     NumberOfConcurrentThreads
);
```

## Parameters

`[in] FileHandle`

An open file handle or **INVALID\_HANDLE\_VALUE**.

The handle must be to an object that supports overlapped I/O.

If a handle is provided, it has to have been opened for overlapped I/O completion. For example, you must specify the **FILE\_FLAG\_OVERLAPPED** flag when using the [CreateFile](/en-us/windows/desktop/api/fileapi/nf-fileapi-createfilea) function to obtain the handle.

If **INVALID\_HANDLE\_VALUE** is specified, the function creates an I/O completion port without associating it with a file handle. In this case, the *ExistingCompletionPort* parameter must be **NULL** and the *CompletionKey* parameter is ignored.

`[in, optional] ExistingCompletionPort`

A handle to an existing I/O completion port or **NULL**.

If this parameter specifies an existing I/O completion port, the function associates it with the handle specified by the *FileHandle* parameter. The function returns the handle of the existing I/O completion port if successful; it does not create a new I/O completion port.

If this parameter is **NULL**, the function creates a new I/O completion port and, if the *FileHandle* parameter is valid, associates it with the new I/O completion port. Otherwise no file handle association occurs. The function returns the handle to the new I/O completion port if successful.

`[in] CompletionKey`

The per-handle user-defined completion key that is included in every I/O completion packet for the specified file handle. For more information, see the Remarks section.

`[in] NumberOfConcurrentThreads`

The maximum number of threads that the operating system can allow to concurrently process I/O completion packets for the I/O completion port. This parameter is ignored if the *ExistingCompletionPort* parameter is not **NULL**.

If this parameter is zero, the system allows as many concurrently running threads as there are processors in the system.

## Return value

If the function succeeds, the return value is the handle to an I/O completion port:

- If the *ExistingCompletionPort* parameter was **NULL**, the return value is a new handle.
- If the *ExistingCompletionPort* parameter was a valid I/O completion port handle, the return value is that same handle.
- If the *FileHandle* parameter was a valid handle, that file handle is now associated with the returned I/O completion port.

 If the function fails, the return value is **NULL**. To get extended error information, call the [GetLastError](/en-us/windows/desktop/api/errhandlingapi/nf-errhandlingapi-getlasterror) function. 
## Remarks

The I/O system can be instructed to send I/O completion notification packets to I/O completion ports, where they are queued. The **CreateIoCompletionPort** function provides this functionality.

An I/O completion port and its handle are associated with the process that created it and is not sharable between processes. However, a single handle is sharable between threads in the same process.

**CreateIoCompletionPort** can be used in three distinct modes:

- Create only an I/O completion port without associating it with a file handle.
- Associate an existing I/O completion port with a file handle.
- Perform both creation and association in a single call.

 To create an I/O completion port without associating it, set the *FileHandle* parameter to **INVALID\_HANDLE\_VALUE**, the *ExistingCompletionPort* parameter to **NULL**, and the *CompletionKey* parameter to zero (which is ignored in this case). Set the *NumberOfConcurrentThreads* parameter to the desired concurrency value for the new I/O completion port, or zero for the default (the number of processors in the system). 
The handle passed in the *FileHandle* parameter can be any handle that supports overlapped I/O. Most commonly, this is a handle opened by the [CreateFile](/en-us/windows/desktop/api/fileapi/nf-fileapi-createfilea) function using the **FILE\_FLAG\_OVERLAPPED** flag (for example, files, mail slots, and pipes). Objects created by other functions such as [socket](/en-us/windows/desktop/api/winsock2/nf-winsock2-socket) can also be associated with an I/O completion port. For an example using sockets, see [AcceptEx](/en-us/windows/desktop/api/mswsock/nf-mswsock-acceptex). A handle can be associated with only one I/O completion port, and after the association is made, the handle remains associated with that I/O completion port until it is closed.

For more information on I/O completion port theory, usage, and associated functions, see [I/O Completion Ports](/en-us/windows/desktop/FileIO/i-o-completion-ports).

Multiple file handles can be associated with a single I/O completion port by calling **CreateIoCompletionPort** multiple times with the same I/O completion port handle in the *ExistingCompletionPort* parameter and a different file handle in the *FileHandle* parameter each time.

Use the *CompletionKey* parameter to help your application track which I/O operations have completed. This value is not used by **CreateIoCompletionPort** for functional control; rather, it is attached to the file handle specified in the *FileHandle* parameter at the time of association with an I/O completion port. This completion key should be unique for each file handle, and it accompanies the file handle throughout the internal completion queuing process. It is returned in the [GetQueuedCompletionStatus](/en-us/windows/desktop/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus) function call when a completion packet arrives. The *CompletionKey* parameter is also used by the [PostQueuedCompletionStatus](/en-us/windows/desktop/FileIO/postqueuedcompletionstatus) function to queue your own special-purpose completion packets.

After an instance of an open handle is associated with an I/O completion port, it cannot be used in the [ReadFileEx](/en-us/windows/desktop/api/fileapi/nf-fileapi-readfileex) or [WriteFileEx](/en-us/windows/desktop/api/fileapi/nf-fileapi-writefileex) function because these functions have their own asynchronous I/O mechanisms.

It is best not to share a file handle associated with an I/O completion port by using either handle inheritance or a call to the [DuplicateHandle](/en-us/windows/desktop/api/handleapi/nf-handleapi-duplicatehandle) function. Operations performed with such duplicate handles generate completion notifications. Careful consideration is advised.

The I/O completion port handle and every file handle associated with that particular I/O completion port are known as *references to the I/O completion port*. The I/O completion port is released when there are no more references to it. Therefore, all of these handles must be properly closed to release the I/O completion port and its associated system resources. After these conditions are satisfied, close the I/O completion port handle by calling the [CloseHandle](/en-us/windows/desktop/api/handleapi/nf-handleapi-closehandle) function.

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