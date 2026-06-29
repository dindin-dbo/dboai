import axios from 'axios';

export async function getIssue(config, issueKey) {
  const { jira_url, jira_email, jira_api_token } = config;
  const res = await axios.get(`${jira_url}/rest/api/3/issue/${issueKey}`, {
    auth: { username: jira_email, password: jira_api_token },
  });
  return res.data;
}

export async function createSubtask(config, parentKey, projectKey, summary, storyPoints) {
  const { jira_url, jira_email, jira_api_token } = config;

  const body = {
    fields: {
      project: { key: projectKey },
      parent: { key: parentKey },
      summary,
      issuetype: { name: 'Subtask' },
      story_points: storyPoints,
      // Common story point field - users may need to adjust
      customfield_10016: storyPoints,
    },
  };

  const res = await axios.post(`${jira_url}/rest/api/3/issue`, body, {
    auth: { username: jira_email, password: jira_api_token },
    headers: { 'Content-Type': 'application/json' },
  });

  return res.data;
}
