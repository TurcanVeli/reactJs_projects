"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminTransferRoute = void 0;
const constants_1 = require("./constants");
const handlers_1 = require("./handlers");
/**
 * Register a transfer route in the Strapi admin router.
 *
 * It exposes a WS server that can be used to run and manage transfer processes.
 *
 * @param strapi - A Strapi instance
 */
const registerAdminTransferRoute = (strapi) => {
    strapi.admin.routes.push({
        method: 'GET',
        path: constants_1.TRANSFER_PATH,
        handler: (0, handlers_1.createTransferHandler)(),
        config: { auth: false },
    });
};
exports.registerAdminTransferRoute = registerAdminTransferRoute;
//# sourceMappingURL=routes.js.map