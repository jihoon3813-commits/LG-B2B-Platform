/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as campaignHistory from "../campaignHistory.js";
import type * as campaigns from "../campaigns.js";
import type * as contracts from "../contracts.js";
import type * as crawler from "../crawler.js";
import type * as customerGroups from "../customerGroups.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as products from "../products.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  campaignHistory: typeof campaignHistory;
  campaigns: typeof campaigns;
  contracts: typeof contracts;
  crawler: typeof crawler;
  customerGroups: typeof customerGroups;
  customers: typeof customers;
  dashboard: typeof dashboard;
  products: typeof products;
  settings: typeof settings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
