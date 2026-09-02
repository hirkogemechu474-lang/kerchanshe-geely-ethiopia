/* eslint-disable @typescript-eslint/no-unused-vars */

// Prisma mock stub for client-side / build-time rendering.
// At runtime, server components should use the real Prisma client via the API proxy.

function createModelProxy(): any {
  return new Proxy(
    {},
    {
      get(_: any, method: string | symbol) {
        if (method === Symbol.toPrimitive) return () => '';
        return async (..._args: any[]) => {
          if (method === 'findMany') return [];
          if (method === 'findFirst') return null;
          if (method === 'findUnique') return null;
          if (method === 'create') return { id: 'mock-id' };
          if (method === 'update') return { id: 'mock-id' };
          if (method === 'delete') return { id: 'mock-id' };
          if (method === 'upsert') return { id: 'mock-id' };
          if (method === 'count') return 0;
          if (method === 'groupBy') return [];
          if (method === 'aggregate') return { _sum: {}, _avg: {}, _count: {} };
          return null;
        };
      },
    }
  );
}

const prismaProxy: any = new Proxy(
  {},
  {
    get(_: any, prop: string | symbol) {
      if (prop === Symbol.toPrimitive) return () => '';
      if (prop === '$queryRaw') {
        const fn = async function (_strings: any, ..._values: any[]) {
          return [];
        };
        return fn;
      }
      if (prop === '$queryRawUnsafe') {
        const fn = async function (_query: string, ..._values: any[]) {
          return [];
        };
        return fn;
      }
      if (prop === '$transaction') return async (fns: any[]) => Promise.all(fns);
      if (prop === '$connect') return async () => {};
      if (prop === '$disconnect') return async () => {};
      return createModelProxy();
    },
  }
);

export const prisma = prismaProxy;

// Re-export Prisma namespace for components that import { Prisma } from "@prisma/client"
// but need a compatible stub at build time.
let PrismaSqlStub: any;
try {
  PrismaSqlStub = require('@prisma/client').Prisma;
} catch {
  PrismaSqlStub = {
    sql: function sql(strings: TemplateStringsArray, ...values: any[]) {
      return { strings, values, _brand: 'Prisma.Sql' };
    },
  };
}

export { PrismaSqlStub as Prisma };
