---
layout: Conceptual
title: Process Creation Flags (WinBase.h) - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/procthread/process-creation-flags
breadcrumb_path: /windows/desktop/breadcrumb/toc.json
uhfHeaderId: MSDocsHeader-WinDevCenter
recommendations: true
adobe-target: true
ms.service: windows-api-desktop-tech
ms.subservice: diagnostics
ms.author: jken
author: GrantMeStrength
feedback_system: Standard
feedback_product_url: https://www.microsoft.com/en-us/windowsinsider/feedbackhub/fb
feedback_help_link_url: https://learn.microsoft.com/answers/tags/224/windows-api-win32/
feedback_help_link_type: get-help-at-qna
description: The following process creation flags are used by the CreateProcess, CreateProcessAsUser, CreateProcessWithLogonW, and CreateProcessWithTokenW functions. They can be specified in any combination, except as noted.
ms.assetid: fd3384ad-8635-4ea1-9054-0572ef86b86d
ms.topic: reference
ms.custom: snippet-project
ms.date: 2025-07-14T00:00:00.0000000Z
locale: en-us
document_id: 7a3479bc-e6e1-353c-7141-b8e571b8520f
document_version_independent_id: 1d3887f8-e781-720a-5812-aa545251e11b
updated_at: 2025-07-16T05:03:00.0000000Z
original_content_git_url: https://github.com/MicrosoftDocs/win32-pr/blob/live/desktop-src/ProcThread/process-creation-flags.md
gitcommit: https://github.com/MicrosoftDocs/win32-pr/blob/3aee48ac3f48e187d17bdfd56951741737331749/desktop-src/ProcThread/process-creation-flags.md
git_commit_id: 3aee48ac3f48e187d17bdfd56951741737331749
site_name: Docs
depot_name: MSDN.win32
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.win32/{branchName}{pdfName}
word_count: 1066
asset_id: procthread/process-creation-flags
moniker_range_name: 
monikers: []
item_type: Content
source_path: desktop-src/ProcThread/process-creation-flags.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
- https://authoring-docs-microsoft.poolparty.biz/devrel/540ac133-a371-4dbb-8f94-28d6cc77a70b
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
- https://authoring-docs-microsoft.poolparty.biz/devrel/60bfc045-f127-4841-9d00-ea35495a5800
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
platformId: cdf05b3e-785b-8a7d-a150-b730af40eed5
---

# Process Creation Flags (WinBase.h) - Win32 apps | Microsoft Learn

The following process creation flags are used by the [**CreateProcess**](/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessa), [**CreateProcessAsUser**](/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessasusera), [**CreateProcessWithLogonW**](/en-us/windows/desktop/api/WinBase/nf-winbase-createprocesswithlogonw), and [**CreateProcessWithTokenW**](/en-us/windows/desktop/api/WinBase/nf-winbase-createprocesswithtokenw) functions. They can be specified in any combination, except as noted.

## Example

```c
     BOOL creationResult;
    
    creationResult = CreateProcess(
        NULL,                   // No module name (use command line)
        cmdLine,                // Command line
        NULL,                   // Process handle not inheritable
        NULL,                   // Thread handle not inheritable
        FALSE,                  // Set handle inheritance to FALSE
        NORMAL_PRIORITY_CLASS | CREATE_NEW_CONSOLE | CREATE_NEW_PROCESS_GROUP, // creation flags
        NULL,                   // Use parent's environment block
        NULL,                   // Use parent's starting directory 
        &startupInfo,           // Pointer to STARTUPINFO structure
        &processInformation);   // Pointer to PROCESS_INFORMATION structure

```

Example from [Windows classic samples](https://github.com/microsoft/Windows-classic-samples/blob/1d363ff4bd17d8e20415b92e2ee989d615cc0d91/Samples/ManagementInfrastructure/cpp/Process/Provider/WindowsProcess.c) on GitHub.

## Flags

| Constant/value | Description |
| --- | --- |
| - **CREATE\_BREAKAWAY\_FROM\_JOB**<br>- 0x01000000 | The child processes of a process associated with a job are not associated with the job.  If the calling process is not associated with a job, this constant has no effect. If the calling process is associated with a job, the job must set the **JOB\_OBJECT\_LIMIT\_BREAKAWAY\_OK** limit. |
| - **CREATE\_DEFAULT\_ERROR\_MODE**<br>- 0x04000000 | The new process does not inherit the error mode of the calling process. Instead, the new process gets the default error mode.  This feature is particularly useful for multithreaded shell applications that run with hard errors disabled. The default behavior is for the new process to inherit the error mode of the caller. Setting this flag changes that default behavior. |
| - **CREATE\_NEW\_CONSOLE**<br>- 0x00000010 | The new process has a new console, instead of inheriting its parent's console (the default). For more information, see [Creation of a Console](/en-us/windows/console/creation-of-a-console).  This flag cannot be used with **DETACHED\_PROCESS**. |
| - **CREATE\_NEW\_PROCESS\_GROUP**<br>- 0x00000200 | The new process is the root process of a new process group. The process group includes all processes that are descendants of this root process. The process identifier of the new process group is the same as the process identifier, which is returned in the *lpProcessInformation* parameter. Process groups are used by the [**GenerateConsoleCtrlEvent**](/en-us/windows/console/generateconsolectrlevent) function to enable sending a CTRL+BREAK signal to a group of console processes. If this flag is specified, CTRL+C signals will be disabled for all processes within the new process group. This flag is ignored if specified with **CREATE\_NEW\_CONSOLE**. |
| - **CREATE\_NO\_WINDOW**<br>- 0x08000000 | The process is a console application that is being run without a console window. Therefore, the console handle for the application is not set. This flag is ignored if the application is not a console application, or if it is used with either **CREATE\_NEW\_CONSOLE** or **DETACHED\_PROCESS**. |
| - **CREATE\_PROTECTED\_PROCESS**<br>- 0x00040000 | The process is to be run as a protected process. The system restricts access to protected processes and the threads of protected processes. For more information on how processes can interact with protected processes, see [Process Security and Access Rights](process-security-and-access-rights). To activate a protected process, the binary must have a special signature. This signature is provided by Microsoft but not currently available for non-Microsoft binaries. There are currently four protected processes: media foundation, audio engine, Windows error reporting, and system. Components that load into these binaries must also be signed. Multimedia companies can leverage the first two protected processes. For more information, see [Overview of the Protected Media Path](../medfound/protected-media-path).**Windows Server 2003 and Windows XP:** This value is not supported. |
| - **CREATE\_PRESERVE\_CODE\_AUTHZ\_LEVEL**<br>- 0x02000000 | Allows the caller to execute a child process that bypasses the process restrictions that would normally be applied automatically to the process. |
| - **CREATE\_SECURE\_PROCESS**<br>- 0x00400000 | This flag allows secure processes, that run in the Virtualization-Based Security environment, to launch. |
| - **CREATE\_SEPARATE\_WOW\_VDM**<br>- 0x00000800 | This flag is valid only when starting a 16-bit Windows-based application. If set, the new process runs in a private Virtual DOS Machine (VDM). By default, all 16-bit Windows-based applications run as threads in a single, shared VDM. The advantage of running separately is that a crash only terminates the single VDM; any other programs running in distinct VDMs continue to function normally. Also, 16-bit Windows-based applications that are run in separate VDMs have separate input queues. That means that if one application stops responding momentarily, applications in separate VDMs continue to receive input. The disadvantage of running separately is that it takes significantly more memory to do so. You should use this flag only if the user requests that 16-bit applications should run in their own VDM. |
| - **CREATE\_SHARED\_WOW\_VDM**<br>- 0x00001000 | The flag is valid only when starting a 16-bit Windows-based application. If the DefaultSeparateVDM switch in the Windows section of WIN.INI is **TRUE**, this flag overrides the switch. The new process is run in the shared Virtual DOS Machine. |
| - **CREATE\_SUSPENDED**<br>- 0x00000004 | The primary thread of the new process is created in a suspended state, and does not run until the [**ResumeThread**](/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-resumethread) function is called. |
| - **CREATE\_UNICODE\_ENVIRONMENT**<br>- 0x00000400 | If this flag is set, the environment block pointed to by *lpEnvironment* uses Unicode characters. Otherwise, the environment block uses ANSI characters. |
| - **DEBUG\_ONLY\_THIS\_PROCESS**<br>- 0x00000002 | The calling thread starts and debugs the new process. It can receive all related debug events using the [**WaitForDebugEvent**](/en-us/windows/win32/api/debugapi/nf-debugapi-waitfordebugevent) function. |
| - **DEBUG\_PROCESS**<br>- 0x00000001 | The calling thread starts and debugs the new process and all child processes created by the new process. It can receive all related debug events using the [**WaitForDebugEvent**](/en-us/windows/win32/api/debugapi/nf-debugapi-waitfordebugevent) function.  A process that uses **DEBUG\_PROCESS** becomes the root of a debugging chain. This continues until another process in the chain is created with **DEBUG\_PROCESS**. If this flag is combined with **DEBUG\_ONLY\_THIS\_PROCESS**, the caller debugs only the new process, not any child processes. |
| - **DETACHED\_PROCESS**<br>- 0x00000008 | For console processes, the new process does not inherit its parent's console (the default). The new process can call the [**AllocConsole**](/en-us/windows/console/allocconsole) function at a later time to create a console. For more information, see [Creation of a Console](/en-us/windows/console/creation-of-a-console).  This value cannot be used with **CREATE\_NEW\_CONSOLE**. |
| - **EXTENDED\_STARTUPINFO\_PRESENT**<br>- 0x00080000 | The process is created with extended startup information; the *lpStartupInfo* parameter specifies a [**STARTUPINFOEX**](/en-us/windows/desktop/api/WinBase/ns-winbase-startupinfoexa) structure.**Windows Server 2003 and Windows XP:** This value is not supported. |
| - **INHERIT\_PARENT\_AFFINITY**<br>- 0x00010000 | The process inherits its parent's affinity. If the parent process has threads in more than one [processor group](processor-groups), the new process inherits the group-relative affinity of an arbitrary group in use by the parent.**Windows Server 2008, Windows Vista, Windows Server 2003 and Windows XP:** This value is not supported. |

## Remarks

On 32-bit Windows, 16-bit applications are simulated by ntvdm.exe, not run as individual processes. Therefore, the process creation flags apply to *ntvdm.exe*. Because ntvdm.exe persists after you run the first 16-bit application, when you launch another 16-bit application, the new creation flags are not applied, except for **CREATE\_NEW\_CONSOLE** and **CREATE\_SEPARATE\_WOW\_VDM**, which create a new ntvdm.exe.

## Requirements

| Requirement | Value |
| --- | --- |
| Minimum supported client | Windows XP [desktop apps only] |
| Minimum supported server | Windows Server 2003 [desktop apps only] |
| Header | - WinBase.h (include Windows.h) |