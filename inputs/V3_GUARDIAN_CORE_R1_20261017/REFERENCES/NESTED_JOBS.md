---
layout: Conceptual
title: Nested Jobs - Win32 apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/windows/win32/procthread/nested-jobs
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
description: An application can use nested jobs to manage subsets of processes. Nested jobs also enable an application that uses jobs to host other applications that also use jobs.
ms.assetid: FA22493B-CD29-49A7-BDAC-349FA96B8C9E
ms.topic: reference
ms.date: 2025-07-14T00:00:00.0000000Z
locale: en-us
document_id: 5f7c1193-0237-ef38-67ff-5f1d5eae69bc
document_version_independent_id: 6e8633ba-8268-1401-74f2-1182d5df8622
updated_at: 2025-07-16T05:03:00.0000000Z
original_content_git_url: https://github.com/MicrosoftDocs/win32-pr/blob/live/desktop-src/ProcThread/nested-jobs.md
gitcommit: https://github.com/MicrosoftDocs/win32-pr/blob/3aee48ac3f48e187d17bdfd56951741737331749/desktop-src/ProcThread/nested-jobs.md
git_commit_id: 3aee48ac3f48e187d17bdfd56951741737331749
site_name: Docs
depot_name: MSDN.win32
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/MSDN.win32/{branchName}{pdfName}
word_count: 1009
asset_id: procthread/nested-jobs
moniker_range_name: 
monikers: []
item_type: Content
source_path: desktop-src/ProcThread/nested-jobs.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/bcbcbad5-4208-4783-8035-8481272c98b8
- https://authoring-docs-microsoft.poolparty.biz/devrel/caec7b7f-4941-4578-b79f-c63b1c1f5af4
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/43b2e5aa-8a6d-4de2-a252-692232e5edc8
- https://authoring-docs-microsoft.poolparty.biz/devrel/754dea88-f800-4835-b6b5-280cb5d81e88
platformId: a7520364-5e67-4881-deff-002a4c581063
---

# Nested Jobs - Win32 apps | Microsoft Learn

An application can use nested jobs to manage subsets of processes. Nested jobs also enable an application that uses jobs to host other applications that also use jobs.

**Windows 7, Windows Server 2008 R2, Windows XP with SP3, Windows Server 2008, Windows Vista and Windows Server 2003:** A process can be associated with only a single job. Nested jobs were introduced in Windows 8 and Windows Server 2012.

This topic provides an overview of job nesting and behavior of nested jobs:

- Nested Job Hierarchies
- Creating a Nested Job Hierarchy
- Job Limits and Notifications for Nested Jobs
- Resource Accounting for Nested Jobs
- Termination of Nested Jobs

For general information about jobs and job objects, see [Job Objects](job-objects).

## Nested Job Hierarchies

Nested jobs have a parent-child relationship in which each child job contains a subset of the processes in its parent job. If a process that is already in a job is added to another job, the jobs are nested by default if the system can form a valid job hierarchy and neither job sets UI limits ([**SetInformationJobObject**](/en-us/windows/win32/api/jobapi2/nf-jobapi2-setinformationjobobject) with **JobObjectBasicUIRestrictions**).

Figure 1 shows a job hierarchy that contains a tree of processes labeled P0 through P7. Job 1 is the *parent job* of Job 2 and Job 4, and it is an *ancestor* of Job 3. Job 2 is the *immediate parent* of Job 3; Job 3 is the *immediate child* of Job 2. Jobs 1, 2, and 3 form a *job chain* in which Jobs 1 and 2 are the *parent job chain* of Job 3. The end job in a job chain is the *immediate job* of the processes in that job. In Figure 1, Job 3 is the immediate job of processes P2, P3, and P4.

![figure 1. a nested job hierarchy that contains a process tree](images/nested-jobs-a.png)

Nested jobs can also be used to manage groups of peer processes. In the job hierarchy shown in Figure 2, Job 1 is the parent job of Job 2. Note that a job hierarchy might contain only part of a process tree. In Figure 2, P0 is not in the hierarchy, but its child processes P1 through P5 are.

![figure 2. a nested job hierarchy that contains peer processes](images/nested-jobs-b.png)

## Creating a Nested Job Hierarchy

Processes in a job hierarchy are either explicitly associated with a job object using the [**AssignProcessToJobObject**](/en-us/windows/win32/api/jobapi2/nf-jobapi2-assignprocesstojobobject) function or implicitly associated during process creation, same as for standalone jobs. The order in which jobs are created and processes are assigned determines whether a hierarchy can be created.

To build a job hierarchy using explicit association, all job objects must be created using [**CreateJobObject**](/en-us/windows/desktop/api/WinBase/nf-winbase-createjobobjecta), then [**AssignProcessToJobObject**](/en-us/windows/win32/api/jobapi2/nf-jobapi2-assignprocesstojobobject) must be called multiple times for each process to associate the process with each job it should belong to. To ensure that the job hierarchy is valid, first assign all processes to the job at the root of the hierarchy, then assign a subset of processes to the immediate child job object, and so on. If processes are assigned to jobs in this order, a child job will always have a subset of processes in its parent job while the hierarchy is being created, which is required for nesting. If processes are assigned to jobs in random order, at some point a child job will have processes that are not in its parent job. This is not allowed by nesting and it will cause **AssignProcessToJobObject** to fail.

When processes are implicitly associated with a job during process creation, a child process is associated with every job in the job chain of its parent process. If the immediate job object allows breakaway, the child process breaks away from the immediate job object and from each job in the parent job chain, moving up the hierarchy until it reaches a job that does not permit breakaway. If the immediate job object does not allow breakaway, the child process does not break away even if jobs in its parent job chain allow it.

## Job Limits and Notifications for Nested Jobs

For certain resource limits, the limit set for jobs in a parent job chain determine the *effective limit* that is enforced for a child job. The effective limit for child job can be more restrictive than the limit of its parent, but it cannot be less restrictive. For example, if a child job's priority class is ABOVE\_NORMAL\_PRIORITY\_CLASS and its parent job's priority class is NORMAL\_PRIORITY\_CLASS, the effective limit for processes in the child job is NORMAL\_PRIORITY\_CLASS. However, if the child job's priority class is BELOW\_NORMAL\_PRIORITY\_CLASS, the effective limit for processes in the child job is BELOW\_NORMAL\_PRIORITY\_CLASS. Effective limits are enforced for priority class, affinity, commit charge, per-process execution time limit, scheduling class limit, and working set minimum and maximum. For more information about specific resource limits, see [**SetInformationJobObject.**](/en-us/windows/win32/api/jobapi2/nf-jobapi2-setinformationjobobject)

When certain events occur, such as new process creation or resource limit violation, a message is sent to the I/O completion port associated with a job. A job can also register to receive notifications when certain limits are exceeded. For a non-nested job, the message is sent to the I/O completion port associated with the job. For a nested job, the message is sent to every I/O completion port associated with any job in the parent job chain of the job that triggered the message. A child job does not need to have an associated I/O completion port for messages it triggers to be sent to the I/O completion ports of parent jobs higher in the job chain. For more information about specific messages, see [**JOBOBJECT\_ASSOCIATE\_COMPLETION\_PORT**](/en-us/windows/desktop/api/WinNT/ns-winnt-jobobject_associate_completion_port).

## Resource Accounting for Nested Jobs

Resource accounting information for a nested job describes the usage of every process associated with that job, including processes in child jobs. Each job in a job chain therefore represents the aggregated resources used by its own processes and the processes of every child job below it in the job chain.

## Termination of Nested Jobs

When a job in a job hierarchy is terminated, the system terminates processes in that job and all of its child jobs, starting with the child job at the bottom of the hierarchy. Outstanding resources used by each terminated process are charged to the parent job.

The job handle must have the JOB\_OBJECT\_TERMINATE access right, same as for standalone jobs.