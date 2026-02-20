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
import type * as agentProfiles from "../agentProfiles.js";
import type * as agentState from "../agentState.js";
import type * as agentTasks from "../agentTasks.js";
import type * as agents from "../agents.js";
import type * as configUpdateRequests from "../configUpdateRequests.js";
import type * as contentItems from "../contentItems.js";
import type * as cronJobs from "../cronJobs.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as kimiChatMessages from "../kimiChatMessages.js";
import type * as kimiDelegations from "../kimiDelegations.js";
import type * as kimiEscalations from "../kimiEscalations.js";
import type * as kimiLogs from "../kimiLogs.js";
import type * as kimiMemory from "../kimiMemory.js";
import type * as kimiPermissions from "../kimiPermissions.js";
import type * as kimiSessions from "../kimiSessions.js";
import type * as mcTasks from "../mcTasks.js";
import type * as memoryEntries from "../memoryEntries.js";
import type * as memorySyncProposals from "../memorySyncProposals.js";
import type * as messages from "../messages.js";
import type * as payouts from "../payouts.js";
import type * as scheduledTasks from "../scheduledTasks.js";
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
  agentProfiles: typeof agentProfiles;
  agentState: typeof agentState;
  agentTasks: typeof agentTasks;
  agents: typeof agents;
  configUpdateRequests: typeof configUpdateRequests;
  contentItems: typeof contentItems;
  cronJobs: typeof cronJobs;
  documents: typeof documents;
  http: typeof http;
  kimiChatMessages: typeof kimiChatMessages;
  kimiDelegations: typeof kimiDelegations;
  kimiEscalations: typeof kimiEscalations;
  kimiLogs: typeof kimiLogs;
  kimiMemory: typeof kimiMemory;
  kimiPermissions: typeof kimiPermissions;
  kimiSessions: typeof kimiSessions;
  mcTasks: typeof mcTasks;
  memoryEntries: typeof memoryEntries;
  memorySyncProposals: typeof memorySyncProposals;
  messages: typeof messages;
  payouts: typeof payouts;
  scheduledTasks: typeof scheduledTasks;
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
