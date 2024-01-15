"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransferHandler = void 0;
const crypto_1 = require("crypto");
const ws_1 = require("ws");
const push_1 = __importDefault(require("./controllers/push"));
const providers_1 = require("../../errors/providers");
const constants_1 = require("./constants");
const createTransferHandler = (options = {}) => async (ctx) => {
    const upgradeHeader = (ctx.request.headers.upgrade || '')
        .split(',')
        .map((s) => s.trim().toLowerCase());
    // Create the websocket server
    const wss = new ws_1.WebSocket.Server({ ...options, noServer: true });
    if (upgradeHeader.includes('websocket')) {
        wss.handleUpgrade(ctx.req, ctx.request.socket, Buffer.alloc(0), (ws) => {
            // Create a connection between the client & the server
            wss.emit('connection', ws, ctx.req);
            const state = {};
            let uuid;
            /**
             * Format error & message to follow the remote transfer protocol
             */
            const callback = (e = null, data) => {
                return new Promise((resolve, reject) => {
                    if (!uuid) {
                        reject(new Error('Missing uuid for this message'));
                        return;
                    }
                    const payload = JSON.stringify({
                        uuid,
                        data: data ?? null,
                        error: e
                            ? {
                                code: 'ERR',
                                message: e?.message,
                            }
                            : null,
                    });
                    ws.send(payload, (error) => (error ? reject(error) : resolve()));
                });
            };
            /**
             * Wrap a function call to catch errors and answer the request with the correct format
             */
            const answer = async (fn) => {
                try {
                    const response = await fn();
                    callback(null, response);
                }
                catch (e) {
                    if (e instanceof Error) {
                        callback(e);
                    }
                    else if (typeof e === 'string') {
                        callback(new providers_1.ProviderTransferError(e));
                    }
                    else {
                        callback(new providers_1.ProviderTransferError('Unexpected error', {
                            error: e,
                        }));
                    }
                }
            };
            const teardown = () => {
                delete state.controller;
                delete state.transfer;
                return { ok: true };
            };
            const init = (msg) => {
                // TODO: this only checks for this instance of node: we should consider a database lock
                if (state.controller) {
                    throw new providers_1.ProviderInitializationError('Transfer already in progres');
                }
                const { transfer } = msg.params;
                // Push transfer
                if (transfer === 'push') {
                    const { options: controllerOptions } = msg.params;
                    state.controller = (0, push_1.default)({
                        ...controllerOptions,
                        autoDestroy: false,
                        getStrapi: () => strapi,
                    });
                }
                // Pull or any other string
                else {
                    throw new providers_1.ProviderTransferError(`Transfer type not implemented: "${transfer}"`, {
                        transfer,
                        validTransfers: constants_1.TRANSFER_METHODS,
                    });
                }
                state.transfer = { id: (0, crypto_1.randomUUID)(), kind: transfer };
                return { transferID: state.transfer.id };
            };
            /**
             * On command message (init, end, status, ...)
             */
            const onCommand = async (msg) => {
                const { command } = msg;
                if (command === 'init') {
                    await answer(() => init(msg));
                }
                if (command === 'end') {
                    await answer(teardown);
                }
                if (command === 'status') {
                    await callback(new providers_1.ProviderTransferError('Command not implemented: "status"', {
                        command,
                        validCommands: ['init', 'end', 'status'],
                    }));
                }
            };
            const onTransferCommand = async (msg) => {
                const { transferID, kind } = msg;
                const { controller } = state;
                // TODO: (re)move this check
                // It shouldn't be possible to start a pull transfer for now, so reaching
                // this code should be impossible too, but this has been added by security
                if (state.transfer?.kind === 'pull') {
                    return callback(new providers_1.ProviderTransferError('Pull transfer not implemented'));
                }
                if (!controller) {
                    return callback(new providers_1.ProviderTransferError("The transfer hasn't been initialized"));
                }
                if (!transferID) {
                    return callback(new providers_1.ProviderTransferError('Missing transfer ID'));
                }
                // Action
                if (kind === 'action') {
                    const { action } = msg;
                    if (!(action in controller.actions)) {
                        return callback(new providers_1.ProviderTransferError(`Invalid action provided: "${action}"`, {
                            action,
                            validActions: Object.keys(controller.actions),
                        }));
                    }
                    await answer(() => controller.actions[action]());
                }
                // Transfer
                else if (kind === 'step') {
                    // We can only have push transfer message for the moment
                    const message = msg;
                    // TODO: lock transfer process
                    if (message.action === 'start') {
                        // console.log('Starting transfer for ', message.step);
                    }
                    // Stream step
                    else if (message.action === 'stream') {
                        await answer(() => controller.transfer[message.step]?.(message.data));
                    }
                    // TODO: unlock transfer process
                    else if (message.action === 'end') {
                        // console.log('Ending transfer for ', message.step);
                    }
                }
            };
            ws.on('close', () => {
                teardown();
            });
            ws.on('error', (e) => {
                teardown();
                // TODO: is logging a console error to the running instance of Strapi ok to do? Should we check for an existing strapi.logger to use?
                console.error(e);
            });
            ws.on('message', async (raw) => {
                const msg = JSON.parse(raw.toString());
                if (!msg.uuid) {
                    await callback(new providers_1.ProviderTransferError('Missing uuid in message'));
                    return;
                }
                uuid = msg.uuid;
                // Regular command message (init, end, status)
                if (msg.type === 'command') {
                    await onCommand(msg);
                }
                // Transfer message (the transfer must be initialized first)
                else if (msg.type === 'transfer') {
                    await onTransferCommand(msg);
                }
                // Invalid messages
                else {
                    await callback(new providers_1.ProviderTransferError('Bad request'));
                }
            });
        });
        ctx.respond = false;
    }
};
exports.createTransferHandler = createTransferHandler;
//# sourceMappingURL=handlers.js.map