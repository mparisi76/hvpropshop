import { updateMe } from "@directus/sdk";

/**
 * `updateMe` for our custom directus_users fields (phone, shop_name, shop_logo, …).
 * The SDK's built-in user type only knows Directus's standard fields, so
 * passing custom ones directly fails type-checking.
 */
export function updateMeFields(fields: object) {
  return updateMe(fields as Parameters<typeof updateMe>[0]);
}
