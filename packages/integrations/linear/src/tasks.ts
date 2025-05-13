import type { LinearAccountDetails } from "./client";
import { resolveLinearPaginatedRequest } from "./utils";

export async function fetchLinearTasklists(account: LinearAccountDetails) {
  const self = await account.client.viewer;
  const tasklists = await resolveLinearPaginatedRequest(self.teams());

  return tasklists;
}

export async function fetchLinearTasklist(
  account: LinearAccountDetails,
  tasklistId: string,
) {
  const tasklist = await account.client.team(tasklistId);
  return tasklist;
}

export async function fetchLinearIssues(
  account: LinearAccountDetails,
  teamId: string,
) {
  const tasksReq = account.client.issues({
    filter: {
      team: {
        id: {
          eq: teamId,
        },
      },
      assignee: {
        isMe: {
          eq: true,
        },
      },
    },
  });

  return resolveLinearPaginatedRequest(tasksReq);
}

export async function fetchLinearIssue(
  account: LinearAccountDetails,
  issueId: string,
) {
  const issue = await account.client.issue(issueId);

  return issue;
}
