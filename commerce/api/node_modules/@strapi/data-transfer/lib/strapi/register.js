"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const remote_1 = require("./remote");
/**
 * This is intended to be called on Strapi register phase.
 *
 * It registers a transfer route in the Strapi admin router.
 */
const register = (strapi) => {
    remote_1.routes.registerAdminTransferRoute(strapi);
};
exports.default = register;
//# sourceMappingURL=register.js.map