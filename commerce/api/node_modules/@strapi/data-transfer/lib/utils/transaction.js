"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
const createTransaction = (strapi) => {
    const fns = [];
    let done = false;
    let resume = null;
    const e = new events_1.EventEmitter();
    e.on('spawn', (uuid, cb) => {
        fns.push({ fn: cb, uuid });
        resume?.();
    });
    e.on('close', () => {
        done = true;
        resume?.();
    });
    strapi.db.transaction(async ({ trx, rollback }) => {
        e.on('rollback', async () => {
            await rollback();
        });
        while (!done) {
            while (fns.length) {
                const item = fns.shift();
                if (item) {
                    const { fn, uuid } = item;
                    try {
                        const res = await fn(trx);
                        e.emit(uuid, { data: res });
                    }
                    catch (error) {
                        e.emit(uuid, { error });
                    }
                }
            }
            if (!done && !fns.length) {
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                await new Promise((resolve) => {
                    resume = resolve;
                });
            }
        }
    });
    return {
        async attach(callback) {
            const uuid = (0, crypto_1.randomUUID)();
            e.emit('spawn', uuid, callback);
            return new Promise((resolve, reject) => {
                e.on(uuid, ({ data, error }) => {
                    if (data) {
                        resolve(data);
                    }
                    if (error) {
                        reject(error);
                    }
                    resolve(undefined);
                });
            });
        },
        end() {
            return e.emit('close');
        },
        rollback() {
            return e.emit('rollback');
        },
    };
};
exports.createTransaction = createTransaction;
//# sourceMappingURL=transaction.js.map