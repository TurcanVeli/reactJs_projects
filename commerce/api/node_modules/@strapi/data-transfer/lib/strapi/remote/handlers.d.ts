import type { Context } from 'koa';
import type { ServerOptions } from 'ws';
export declare const createTransferHandler: (options?: ServerOptions) => (ctx: Context) => Promise<void>;
