/**
 * Migration script: Firebase Firestore → Convex
 * 
 * Reads all data from Firebase collections and writes to Convex.
 * Converts Firestore Timestamps to Unix milliseconds.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { ConvexHttpClient } = require('convex/browser');
const { api } = require('../convex/_generated/api.js');

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyAFGOvoH727DMiJ0dJb4UfFQI7VrB4XF1w',
  authDomain: 'openclawdb-63f64.firebaseapp.com',
  projectId: 'openclawdb-63f64',
  storageBucket: 'openclawdb-63f64.firebasestorage.app',
  messagingSenderId: '219807980935',
  appId: '1:219807980935:web:03ae4aba9e08483efc0722'
};

// Convex config
const CONVEX_URL = 'https://courteous-quail-705.convex.cloud';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Convex
const convex = new ConvexHttpClient(CONVEX_URL);

/**
 * Convert Firestore Timestamp or date-like value to Unix milliseconds
 */
function toMillis(value) {
  if (!value) return Date.now();
  // Firestore Timestamp object with toMillis()
  if (value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  // Firestore Timestamp with seconds/nanoseconds
  if (value && typeof value.seconds === 'number') {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000);
  }
  // Already a number (epoch ms)
  if (typeof value === 'number') {
    return value;
  }
  // Date object
  if (value instanceof Date) {
    return value.getTime();
  }
  // ISO string
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return isNaN(parsed) ? Date.now() : parsed;
  }
  return Date.now();
}

/**
 * Read all documents from a Firestore collection
 */
async function readCollection(collectionName) {
  console.log(`  📖 Reading ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  const docs = [];
  snapshot.forEach((doc) => {
    docs.push({ id: doc.id, ...doc.data() });
  });
  console.log(`     Found ${docs.length} documents`);
  return docs;
}

/**
 * Migrate agents collection
 */
async function migrateAgents(docs) {
  console.log(`  ✍️  Writing ${docs.length} agents to Convex...`);
  let count = 0;
  for (const doc of docs) {
    try {
      // Use the internal mutation to insert with all fields
      await convex.mutation(api.agents.create || null, {
        name: doc.name || '',
        role: doc.role || '',
        status: doc.status || 'offline',
        currentTaskId: doc.currentTaskId || null,
        sessionKey: doc.sessionKey || '',
        emoji: doc.emoji || '🤖',
        level: doc.level || 'agent',
        lastHeartbeat: toMillis(doc.lastHeartbeat),
        createdAt: toMillis(doc.createdAt),
        updatedAt: toMillis(doc.updatedAt),
      });
      count++;
    } catch (err) {
      // If no create mutation, use raw insert approach
      console.error(`     ⚠️ Error migrating agent ${doc.id}: ${err.message}`);
    }
  }
  return count;
}

/**
 * Migrate tasks collection
 */
async function migrateTasks(docs) {
  console.log(`  ✍️  Writing ${docs.length} tasks to Convex...`);
  let count = 0;
  for (const doc of docs) {
    try {
      await convex.mutation(api.tasks.create, {
        title: doc.title || 'Untitled',
        description: doc.description || '',
        status: doc.status || 'inbox',
        priority: doc.priority || 'medium',
        assigneeIds: Array.isArray(doc.assigneeIds) ? doc.assigneeIds : (doc.assignedTo ? [doc.assignedTo] : []),
        createdBy: doc.createdBy || '',
        dueDate: doc.dueDate ? toMillis(doc.dueDate) : null,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
      });
      count++;
    } catch (err) {
      console.error(`     ⚠️ Error migrating task ${doc.id}: ${err.message}`);
    }
  }
  return count;
}

/**
 * Migrate activities collection
 */
async function migrateActivities(docs) {
  console.log(`  ✍️  Writing ${docs.length} activities to Convex...`);
  let count = 0;
  for (const doc of docs) {
    try {
      await convex.mutation(api.activities.create, {
        type: doc.type || 'agent_task_completed',
        agentId: doc.agentId || '',
        taskId: doc.taskId || null,
        message: doc.message || doc.description || '',
        metadata: doc.metadata || {},
      });
      count++;
    } catch (err) {
      console.error(`     ⚠️ Error migrating activity ${doc.id}: ${err.message}`);
    }
  }
  return count;
}

/**
 * Migrate messages collection
 */
async function migrateMessages(docs) {
  console.log(`  ✍️  Writing ${docs.length} messages to Convex...`);
  let count = 0;
  for (const doc of docs) {
    try {
      await convex.mutation(api.messages.create, {
        taskId: doc.taskId || '',
        fromAgentId: doc.fromAgentId || '',
        content: doc.content || '',
        attachments: Array.isArray(doc.attachments) ? doc.attachments : [],
        mentions: Array.isArray(doc.mentions) ? doc.mentions : [],
      });
      count++;
    } catch (err) {
      console.error(`     ⚠️ Error migrating message ${doc.id}: ${err.message}`);
    }
  }
  return count;
}

/**
 * Migrate documents collection
 */
async function migrateDocuments(docs) {
  console.log(`  ✍️  Writing ${docs.length} documents to Convex...`);
  let count = 0;
  for (const doc of docs) {
    try {
      await convex.mutation(api.documents.create, {
        title: doc.title || 'Untitled',
        content: doc.content || '',
        type: doc.type || 'note',
        taskId: doc.taskId || null,
        createdBy: doc.createdBy || '',
      });
      count++;
    } catch (err) {
      console.error(`     ⚠️ Error migrating document ${doc.id}: ${err.message}`);
    }
  }
  return count;
}

/**
 * Migrate cron_jobs collection
 */
async function migrateCronJobs(docs) {
  console.log(`  ✍️  Writing ${docs.length} cron_jobs to Convex...`);
  let count = 0;
  for (const doc of docs) {
    try {
      await convex.mutation(api.cronJobs.create, {
        name: doc.name || '',
        schedule: doc.schedule || '',
        cronExpression: doc.cronExpression || '',
        category: doc.category || 'general',
        enabled: doc.enabled !== undefined ? doc.enabled : true,
        description: doc.description || undefined,
        lastRun: doc.lastRun ? toMillis(doc.lastRun) : undefined,
        nextRun: doc.nextRun ? toMillis(doc.nextRun) : undefined,
        createdAt: toMillis(doc.createdAt),
        updatedAt: toMillis(doc.updatedAt),
      });
      count++;
    } catch (err) {
      console.error(`     ⚠️ Error migrating cron_job ${doc.id}: ${err.message}`);
    }
  }
  return count;
}

async function main() {
  console.log('🚀 Starting Firebase → Convex Migration');
  console.log('=' .repeat(50));
  
  const results = {};

  try {
    // Step 1: Read all Firebase data
    console.log('\n📦 Step 1: Reading Firebase data...');
    const agentDocs = await readCollection('agents');
    const taskDocs = await readCollection('tasks');
    const activityDocs = await readCollection('activities');
    const messageDocs = await readCollection('messages');
    const documentDocs = await readCollection('documents');
    const cronJobDocs = await readCollection('cron_jobs');

    // Step 2: Write to Convex
    console.log('\n📤 Step 2: Writing to Convex...');
    
    results.agents = await migrateAgents(agentDocs);
    results.tasks = await migrateTasks(taskDocs);
    results.activities = await migrateActivities(activityDocs);
    results.messages = await migrateMessages(messageDocs);
    results.documents = await migrateDocuments(documentDocs);
    results.cronJobs = await migrateCronJobs(cronJobDocs);

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Migration Complete!');
    console.log('');
    console.log('Collection Counts:');
    for (const [key, count] of Object.entries(results)) {
      console.log(`  ${key}: ${count}`);
    }
    console.log('');
    console.log(`Total documents migrated: ${Object.values(results).reduce((a, b) => a + b, 0)}`);
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }

  process.exit(0);
}

main();
