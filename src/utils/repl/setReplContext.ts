import { Context } from 'vm';
import { Registry } from '../Registry';

const setPage = (context: Context): void => {
  const { context: browserContext } = Registry.instance().data();
  if (!browserContext) return;

  const pages = browserContext.pages();
  if (pages.length > 0) context.page = pages[0];
};

const setValues = (object: {}, source: {}): void => {
  Object.keys(source).forEach((key) => {
    object[key] = source[key];
  });
};

const setContext = (context: Context, provided?: {}): void => {
  setValues(context, Registry.instance().data());

  // override with the provided values
  if (provided) setValues(context, provided);

  setPage(context);
};

export const setReplContext = (context: Context, provided?: {}): void => {
  Registry.instance().on('change', () => setContext(context, provided));

  setContext(context, provided);
};
