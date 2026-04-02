const { spawn } = require('child_process');

const password = 'Rawad@225144';
const host = '76.13.40.119';
const user = 'root';
const targetDir = '/var/www/noor';

const commands = [
  `mkdir -p ${targetDir}`,
  `exit`
];

function runSsh(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ssh ${cmd}`);
    const ssh = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'PreferredAuthentications=password',
      '-o', 'IdentitiesOnly=yes',
      '-i', '/dev/null',
      `${user}@${host}`,
      cmd
    ]);

    ssh.stdout.on('data', (data) => process.stdout.write(data));
    ssh.stderr.on('data', (data) => {
      const msg = data.toString();
      process.stderr.write(msg);
      if (msg.toLowerCase().includes('password')) {
        ssh.stdin.write(password + '\n');
      }
    });

    ssh.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}`));
    });
  });
}

function runScp(local, remote) {
  return new Promise((resolve, reject) => {
    console.log(`Running: scp ${local} to ${remote}`);
    const scp = spawn('scp', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'PreferredAuthentications=password',
      '-o', 'IdentitiesOnly=yes',
      '-i', '/dev/null',
      local,
      `${user}@${host}:${remote}`
    ]);

    scp.stdout.on('data', (data) => process.stdout.write(data));
    scp.stderr.on('data', (data) => {
      const msg = data.toString();
      process.stderr.write(msg);
      if (msg.toLowerCase().includes('password')) {
        scp.stdin.write(password + '\n');
      }
    });

    scp.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}`));
    });
  });
}

async function deploy() {
  try {
    await runSsh(`mkdir -p ${targetDir}`);
    await runScp('deployment.tar.gz', `${targetDir}/`);
    await runSsh(`cd ${targetDir} && tar -xzf deployment.tar.gz && rm deployment.tar.gz && docker compose build noor_app && docker compose up -d noor_app && docker image prune -f`);
    console.log('DEPLOYMENT SUCCESSFUL!');
  } catch (err) {
    console.error('DEPLOYMENT FAILED:', err.message);
  }
}

deploy();
