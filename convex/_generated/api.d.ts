/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as agentComms from "../agentComms.js";
import type * as agentMessages from "../agentMessages.js";
import type * as agentState from "../agentState.js";
import type * as agentTasks from "../agentTasks.js";
import type * as agents from "../agents.js";
import type * as cronJobs from "../cronJobs.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as payouts from "../payouts.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  agentComms: typeof agentComms;
  agentMessages: typeof agentMessages;
  agentState: typeof agentState;
  agentTasks: typeof agentTasks;
  agents: typeof agents;
  cronJobs: typeof cronJobs;
  documents: typeof documents;
  http: typeof http;
  messages: typeof messages;
  payouts: typeof payouts;
  tasks: typeof tasks;
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
