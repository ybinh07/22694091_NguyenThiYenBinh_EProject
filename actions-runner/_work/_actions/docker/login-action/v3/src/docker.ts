import * as aws from './aws';
import * as core from '@actions/core';

import {Docker} from '@docker/actions-toolkit/lib/docker/docker';

export async function login(registry: string, username: string, password: string, ecr: string): Promise<void> {
  if (/true/i.test(ecr) || (ecr == 'auto' && aws.isECR(registry))) {
    await loginECR(registry, username, password);
  } else {
    await loginStandard(registry, username, password);
  }
}

export async function logout(registry: string): Promise<void> {
  await Docker.getExecOutput(['logout', registry], {
    ignoreReturnCode: true
  }).then(res => {
    if (res.stderr.length > 0 && res.exitCode != 0) {
      core.warning(res.stderr.trim());
    }
  });
}

export async function loginStandard(registry: string, username: string, password: string): Promise<void> {
  if (!username && !password) {
    throw new Error('Username and password required');
  }
  if (!username) {
    throw new Error('Username required');
  }
  if (!password) {
    throw new Error('Password required');
  }

  const loginArgs: Array<string> = ['login', '--password-stdin'];
  loginArgs.push('--username', username);
  loginArgs.push(registry);

  core.info(`Logging into ${registry}...`);
  await Docker.getExecOutput(loginArgs, {
    ignoreReturnCode: true,
    silent: true,
    input: Buffer.from(password)
  }).then(res => {
    if (res.stderr.length > 0 && res.exitCode != 0) {
      throw new Error(res.stderr.trim());
    }
    core.info(`Login Succeeded!`);
  });
}

export async function loginECR(registry: string, username: string, password: string): Promise<void> {
  core.info(`Retrieving registries data through AWS SDK...`);
  const regDatas = await aws.getRegistriesData(registry, username, password);
  for (const regData of regDatas) {
    core.info(`Logging into ${regData.registry}...`);
    await Docker.getExecOutput(['login', '--password-stdin', '--username', regData.username, regData.registry], {
      ignoreReturnCode: true,
      silent: true,
      input: Buffer.from(regData.password)
    }).then(res => {
      if (res.stderr.length > 0 && res.exitCode != 0) {
        throw new Error(res.stderr.trim());
      }
      core.info('Login Succeeded!');
    });
  }
}
