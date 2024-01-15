"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _RemoteStrapiDestinationProvider_instances, _RemoteStrapiDestinationProvider_streamStep;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRemoteStrapiDestinationProvider = void 0;
const ws_1 = require("ws");
const uuid_1 = require("uuid");
const stream_1 = require("stream");
const utils_1 = require("./utils");
const constants_1 = require("../../remote/constants");
const providers_1 = require("../../../errors/providers");
class RemoteStrapiDestinationProvider {
    constructor(options) {
        _RemoteStrapiDestinationProvider_instances.add(this);
        this.name = 'destination::remote-strapi';
        this.type = 'destination';
        this.options = options;
        this.ws = null;
        this.dispatcher = null;
    }
    async initTransfer() {
        const { strategy, restore } = this.options;
        // Wait for the connection to be made to the server, then init the transfer
        return new Promise((resolve, reject) => {
            this.ws
                ?.once('open', async () => {
                const query = this.dispatcher?.dispatchCommand({
                    command: 'init',
                    params: { options: { strategy, restore }, transfer: 'push' },
                });
                const res = (await query);
                if (!res?.transferID) {
                    return reject(new providers_1.ProviderTransferError('Init failed, invalid response from the server'));
                }
                resolve(res.transferID);
            })
                .once('error', reject);
        });
    }
    async bootstrap() {
        const { url, auth } = this.options;
        const validProtocols = ['https:', 'http:'];
        let ws;
        if (!validProtocols.includes(url.protocol)) {
            throw new providers_1.ProviderValidationError(`Invalid protocol "${url.protocol}"`, {
                check: 'url',
                details: {
                    protocol: url.protocol,
                    validProtocols,
                },
            });
        }
        const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${url.host}${url.pathname}${constants_1.TRANSFER_PATH}`;
        const validAuthMethods = ['token'];
        // No auth defined, trying public access for transfer
        if (!auth) {
            ws = new ws_1.WebSocket(wsUrl);
        }
        // Common token auth, this should be the main auth method
        else if (auth.type === 'token') {
            const headers = { Authorization: `Bearer ${auth.token}` };
            ws = new ws_1.WebSocket(wsUrl, { headers });
        }
        // Invalid auth method provided
        else {
            throw new providers_1.ProviderValidationError('Auth method not implemented', {
                check: 'auth.type',
                details: {
                    auth: auth.type,
                    validAuthMethods,
                },
            });
        }
        this.ws = ws;
        this.dispatcher = (0, utils_1.createDispatcher)(this.ws);
        const transferID = await this.initTransfer();
        this.dispatcher.setTransferProperties({ id: transferID, kind: 'push' });
        await this.dispatcher.dispatchTransferAction('bootstrap');
    }
    async close() {
        await this.dispatcher?.dispatchTransferAction('close');
        await new Promise((resolve) => {
            const { ws } = this;
            if (!ws || ws.CLOSED) {
                resolve();
                return;
            }
            ws.on('close', () => resolve()).close();
        });
    }
    getMetadata() {
        return this.dispatcher?.dispatchTransferAction('getMetadata') ?? null;
    }
    async beforeTransfer() {
        await this.dispatcher?.dispatchTransferAction('beforeTransfer');
    }
    getSchemas() {
        if (!this.dispatcher) {
            return Promise.resolve(null);
        }
        return this.dispatcher.dispatchTransferAction('getSchemas');
    }
    createEntitiesWriteStream() {
        return new stream_1.Writable({
            objectMode: true,
            write: async (entity, _encoding, callback) => {
                const e = await __classPrivateFieldGet(this, _RemoteStrapiDestinationProvider_instances, "m", _RemoteStrapiDestinationProvider_streamStep).call(this, 'entities', entity);
                callback(e);
            },
        });
    }
    createLinksWriteStream() {
        return new stream_1.Writable({
            objectMode: true,
            write: async (link, _encoding, callback) => {
                const e = await __classPrivateFieldGet(this, _RemoteStrapiDestinationProvider_instances, "m", _RemoteStrapiDestinationProvider_streamStep).call(this, 'links', link);
                callback(e);
            },
        });
    }
    createConfigurationWriteStream() {
        return new stream_1.Writable({
            objectMode: true,
            write: async (configuration, _encoding, callback) => {
                const e = await __classPrivateFieldGet(this, _RemoteStrapiDestinationProvider_instances, "m", _RemoteStrapiDestinationProvider_streamStep).call(this, 'configuration', configuration);
                callback(e);
            },
        });
    }
    createAssetsWriteStream() {
        return new stream_1.Writable({
            objectMode: true,
            final: async (callback) => {
                // TODO: replace this stream call by an end call
                const e = await __classPrivateFieldGet(this, _RemoteStrapiDestinationProvider_instances, "m", _RemoteStrapiDestinationProvider_streamStep).call(this, 'assets', null);
                callback(e);
            },
            write: async (asset, _encoding, callback) => {
                const { filename, filepath, stats, stream } = asset;
                const assetID = (0, uuid_1.v4)();
                await __classPrivateFieldGet(this, _RemoteStrapiDestinationProvider_instances, "m", _RemoteStrapiDestinationProvider_streamStep).call(this, 'assets', {
                    action: 'start',
                    assetID,
                    data: { filename, filepath, stats },
                });
                for await (const chunk of stream) {
                    await __classPrivateFieldGet(this, _RemoteStrapiDestinationProvider_instances, "m", _RemoteStrapiDestinationProvider_streamStep).call(this, 'assets', {
                        action: 'stream',
                        assetID,
                        data: chunk,
                    });
                }
                await __classPrivateFieldGet(this, _RemoteStrapiDestinationProvider_instances, "m", _RemoteStrapiDestinationProvider_streamStep).call(this, 'assets', {
                    action: 'end',
                    assetID,
                });
                callback();
            },
        });
    }
}
_RemoteStrapiDestinationProvider_instances = new WeakSet(), _RemoteStrapiDestinationProvider_streamStep = async function _RemoteStrapiDestinationProvider_streamStep(step, data) {
    try {
        await this.dispatcher?.dispatchTransferStep({ action: 'stream', step, data });
    }
    catch (e) {
        if (e instanceof Error) {
            return e;
        }
        if (typeof e === 'string') {
            return new providers_1.ProviderTransferError(e);
        }
        return new providers_1.ProviderTransferError('Unexpected error');
    }
    return null;
};
const createRemoteStrapiDestinationProvider = (options) => {
    return new RemoteStrapiDestinationProvider(options);
};
exports.createRemoteStrapiDestinationProvider = createRemoteStrapiDestinationProvider;
//# sourceMappingURL=index.js.map