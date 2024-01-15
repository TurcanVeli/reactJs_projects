"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_chain_1 = require("stream-chain");
const providers_1 = require("../../providers");
const createPushController = (options) => {
    const provider = (0, providers_1.createLocalStrapiDestinationProvider)(options);
    const streams = {};
    const assets = {};
    const writeAsync = (stream, data) => {
        return new Promise((resolve, reject) => {
            stream.write(data, (error) => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });
    };
    return {
        streams,
        actions: {
            async getSchemas() {
                return provider.getSchemas();
            },
            async getMetadata() {
                return provider.getMetadata();
            },
            async bootstrap() {
                return provider.bootstrap();
            },
            async close() {
                return provider.close();
            },
            async beforeTransfer() {
                return provider.beforeTransfer();
            },
        },
        transfer: {
            async entities(entity) {
                if (!streams.entities) {
                    streams.entities = provider.createEntitiesWriteStream();
                }
                await writeAsync(streams.entities, entity);
            },
            async links(link) {
                if (!streams.links) {
                    streams.links = await provider.createLinksWriteStream();
                }
                await writeAsync(streams.links, link);
            },
            async configuration(config) {
                if (!streams.configuration) {
                    streams.configuration = await provider.createConfigurationWriteStream();
                }
                await writeAsync(streams.configuration, config);
            },
            async assets(payload) {
                // TODO: close the stream upong receiving an 'end' event instead
                if (payload === null) {
                    streams.assets?.end();
                    return;
                }
                const { action, assetID } = payload;
                if (!streams.assets) {
                    streams.assets = await provider.createAssetsWriteStream();
                }
                if (action === 'start') {
                    assets[assetID] = { ...payload.data, stream: new stream_chain_1.PassThrough() };
                    writeAsync(streams.assets, assets[assetID]);
                }
                if (action === 'stream') {
                    // The buffer has gone through JSON operations and is now of shape { type: "Buffer"; data: UInt8Array }
                    // We need to transform it back into a Buffer instance
                    const rawBuffer = payload.data;
                    const chunk = Buffer.from(rawBuffer.data);
                    await writeAsync(assets[assetID].stream, chunk);
                }
                if (action === 'end') {
                    await new Promise((resolve, reject) => {
                        const { stream } = assets[assetID];
                        stream
                            .on('close', () => {
                            delete assets[assetID];
                            resolve();
                        })
                            .on('error', reject)
                            .end();
                    });
                }
            },
        },
    };
};
exports.default = createPushController;
//# sourceMappingURL=push.js.map