import callsites from 'callsites';
import Debug from 'debug';
import { pathExists, readFile } from 'fs-extra';
import { bold } from 'kleur';
import { findLast } from 'lodash';
import { basename, dirname, join } from 'path';
import { CreateManager } from './CreateManager';
import { getLineIncludes } from './format';
import { PATCH_HANDLE } from './patchCode';
import { Registry } from '../utils';

const debug = Debug('qawolf:create');

export const getCreatePath = async (
  callerFileNames: string[],
): Promise<string> => {
  debug(`search caller files for ${PATCH_HANDLE} %j`, callerFileNames);

  const codes = await Promise.all(
    callerFileNames.map(async (filename) => {
      let code = '';

      if (await pathExists(filename)) {
        code = await readFile(filename, 'utf8');
      }

      return { code, filename };
    }),
  );

  const item = findLast(
    codes,
    ({ code }) => !!getLineIncludes(code, PATCH_HANDLE),
  );

  if (!item) {
    throw new Error(`Could not find ${PATCH_HANDLE} in caller`);
  }

  return item.filename;
};

export const getSelectorPath = (codePath: string): string => {
  const codeName = basename(codePath).split('.')[0];
  return join(dirname(codePath), './selectors', `${codeName}.json`);
};

export const create = async (): Promise<void> => {
  const context = Registry.instance().data().context;
  if (!context) {
    throw new Error(
      'No context found. Call qawolf.register(context) before qawolf.create()',
    );
  }

  const callerFileNames = callsites().map((c) => c.getFileName());

  const codePath = await getCreatePath(callerFileNames);

  const selectorPath = getSelectorPath(codePath);

  const manager = await CreateManager.create({
    codePath,
    context,
    selectorPath,
  });

  console.log(bold().blue('🐺  QA Wolf is ready to create code!'));

  await manager.finalize();
};
