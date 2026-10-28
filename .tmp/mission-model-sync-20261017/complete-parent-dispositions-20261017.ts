const ids = [
  'task_mvc42woi_0006_kj3b51',
  'task_mvc42woi_0007_28drf0',
  'task_mvc422gy_0002_ua4zsu',
  'task_mvb1jeoy_0011_n4y9u9',
  'task_mv9wspa8_0058_bz8uxd',
];
const results = {};
for (const id of ids) {
  try {
    results[id] = await tools.team_tasks_complete({ task_id: id });
  } catch (e) {
    results[id] = 'ERROR ' + String(e).slice(0, 300);
  }
}
const j = await (await fetch('http://127.0.0.1:4747/api/state')).json();
const t = j.teams.find((x) => x.name === 're-graph-scheduler');
results.boardAfter = t.tasks
  .filter((x) => x.status !== 'completed')
  .map((x) => ({ id: x.id, st: x.status, asg: x.assignee ?? null }));
return results;
