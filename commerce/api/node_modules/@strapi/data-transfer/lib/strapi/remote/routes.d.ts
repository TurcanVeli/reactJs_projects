import type { Context } from 'koa';
declare module '@strapi/strapi' {
    interface Strapi {
        admin: {
            routes: {
                method: string;
                path: string;
                handler: (ctx: Context) => Promise<void>;
                config: unknown;
            }[];
        };
    }
}
/**
 * Register a transfer route in the Strapi admin router.
 *
 * It exposes a WS server that can be used to run and manage transfer processes.
 *
 * @param strapi - A Strapi instance
 */
export declare const registerAdminTransferRoute: (strapi: Strapi.Strapi) => void;
