import axios from 'axios';

export async function getIssue(config, issueKey) {
  const { jira_url, jira_email, jira_api_token } = config;
  const res = await axios.get(`${jira_url}/rest/api/3/issue/${issueKey}`, {
    auth: { username: jira_email, password: jira_api_token },
  });
  return res.data;
}

export async function createSubtask(config, parentKey, projectKey, summary, storyPoints) {
  const { jira_url, jira_email, jira_api_token, jira_account_id } = config;

  const fields = {
    project: { key: projectKey },
    parent: { key: parentKey },
    summary,
    issuetype: { name: 'Sub-task' },
    customfield_10226: storyPoints,
  };

  if (jira_account_id) {
    fields.assignee = { accountId: jira_account_id };
  }

  const body = { fields };

  const res = await axios.post(`${jira_url}/rest/api/3/issue`, body, {
    auth: { username: jira_email, password: jira_api_token },
    headers: { 'Content-Type': 'application/json' },
  });

  return res.data;
}