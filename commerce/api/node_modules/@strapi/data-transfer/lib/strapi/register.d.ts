/**
 * This is intended to be called on Strapi register phase.
 *
 * It registers a transfer route in the Strapi admin router.
 */
declare const register: (strapi: Strapi.Strapi) => void;
export default register;
