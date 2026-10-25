// Only targets the disposable cluster populated by tests/database-v2.sql.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const owner = '00000000-0000-0000-0000-000000000001';
const run = sql => new Promise((resolve, reject) => {
  const child = spawn('psql', ['-h', '127.0.0.1', '-p', '55432', '-U', 'postgres', '-d', 'postgres', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], { windowsHide: true });
  let output = '', error = '';
  child.stdout.on('data', data => output += data); child.stderr.on('data', data => error += data);
  child.on('error', reject); child.on('close', code => code === 0 ? resolve(output) : reject(new Error(error)));
  child.stdin.end(sql);
});
const statements = Array.from({ length: 250 }, (_, i) => `begin; update public.categories set name='Version ${i}' where user_id='${owner}' and id='historical'; select pg_sleep(0.001); update public.transactions set description='Version ${i}' where user_id='${owner}' and id='old'; ${i % 2 ? `delete from public.transactions where user_id='${owner}' and id='temporary';` : `insert into public.transactions(id,user_id,type,amount,date,category_id,description) values('temporary','${owner}','expense',1,'2026-01-01','historical','inserted');`} commit;`).join('\n');
const query = `with s as materialized(select public.ledger_snapshot_v2() as data) select (data->'categories'->0->>'name') = (select t->>'description' from jsonb_array_elements(data->'transactions') t where t->>'id'='old') from s;`;
const [, output] = await Promise.all([
  run(statements),
  run(`set role authenticated; set request.jwt.claim.sub='${owner}';\n${Array.from({ length: 500 }, () => query).join('\n')}`),
]);
const reads = output.trim().split(/\r?\n/);
assert.equal(reads.length, 500);
assert.ok(reads.every(line => line === 't'), 'inconsistent snapshot under concurrent category/transaction updates');
console.log('PASS 500 consistent snapshots during 250 concurrent updates/inserts/deletes; owner-scoped reads');
