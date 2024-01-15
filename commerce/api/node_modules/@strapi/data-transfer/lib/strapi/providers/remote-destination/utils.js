"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDispatcher = void 0;
const uuid_1 = require("uuid");
const createDispatcher = (ws) => {
    const state = {};
    const dispatch = async (message, options = {}) => {
        if (!ws) {
            throw new Error('No websocket connection found');
        }
        return new Promise((resolve, reject) => {
            const uuid = (0, uuid_1.v4)();
            const payload = { ...message, uuid };
            if (options.attachTransfer) {
                Object.assign(payload, { transferID: state.transfer?.id });
            }
            const stringifiedPayload = JSON.stringify(payload);
            ws.send(stringifiedPayload, (error) => {
                if (error) {
                    reject(error);
                }
            });
            const onResponse = (raw) => {
                const response = JSON.parse(raw.toString());
                if (response.uuid === uuid) {
                    if (response.error) {
                        return reject(new Error(response.error.message));
                    }
                    resolve(response.data ?? null);
                }
                else {
                    ws.once('message', onResponse);
                }
            };
            // TODO: What happens if the server sends another message (not a response to this message)
            ws.once('message', onResponse);
        });
    };
    const dispatchCommand = (payload) => {
        return dispatch({ type: 'command', ...payload });
    };
    const dispatchTransferAction = async (action) => {
        const payload = { type: 'transfer', kind: 'action', action };
        return dispatch(payload, { attachTransfer: true }) ?? Promise.resolve(null);
    };
    const dispatchTransferStep = async (payload) => {
        const message = {
            type: 'transfer',
            kind: 'step',
            ...payload,
        };
        return dispatch(message, { attachTransfer: true }) ?? Promise.resolve(null);
    };
    const setTransferProperties = (properties) => {
        state.transfer = { ...properties };
    };
    return {
        get transferID() {
            return state.transfer?.id;
        },
        get transferKind() {
            return state.transfer?.kind;
        },
        setTransferProperties,
        dispatch,
        dispatchCommand,
        dispatchTransferAction,
        dispatchTransferStep,
    };
};
exports.createDispatcher = createDispatcher;
//# sourceMappingURL=utils.js.map