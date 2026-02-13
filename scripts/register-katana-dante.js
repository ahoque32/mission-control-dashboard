#!/usr/bin/env node
/**
 * Register Katana and Dante as agents in Mission Control
 *
 * Usage:
 *   node register-katana-dante.js
 *
 * This creates agent records for Katana (Kimi K2.5 on GCP) and Dante (Kimi K2.5 on MacBook)
 * so their activities appear properly in the dashboard.
 */

import { api } from '../convex/_generated/api.js';
import { ConvexClient } from 'convex/browser';

const CONVEX_URL = process.env.CONVEX_URL || 'https://courteous-quail-705.convex.cloud';

const client = new ConvexClient(CONVEX_URL);

const AGENTS = [
  {
    name: 'Katana',
    role: 'Independent Operator - Kimi K2.5',
    status: 'online',
    currentTaskId: null,
    sessionKey: 'agent:katana-agent:main',
    emoji: '🗡️',
    level: 'operator',
    lastHeartbeat: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    name: 'Dante',
    role: 'MacBook Agent - Kimi K2.5',
    status: 'online',
    currentTaskId: null,
    sessionKey: 'agent:dante-agent:main',
    emoji: '🔥',
    level: 'operator',
    lastHeartbeat: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

async function registerAgents() {
  console.log('Registering Katana and Dante agents...\n');

  for (const agent of AGENTS) {
    try {
      // Check if agent already exists
      const existing = await client.query(api.agents.list, {});
      const exists = existing.find(a => a.sessionKey === agent.sessionKey);

      if (exists) {
        console.log(`✓ ${agent.name} already registered (sessionKey: ${agent.sessionKey})`);
        continue;
      }

      // Create the agent
      const result = await client.mutation(api.agents.create, agent);
      console.log(`✓ Registered ${agent.name} (${agent.emoji})`);
      console.log(`  sessionKey: ${agent.sessionKey}`);
      console.log(`  id: ${result}\n`);
    } catch (error) {
      console.error(`✗ Failed to register ${agent.name}:`, error.message);
    }
  }

  console.log('\nDone! Katana and Dante should now appear in the dashboard.');
  process.exit(0);
}

registerAgents();
