#!/usr/bin/env node

/**
 * Memory Sync Script
 * 
 * Scans agent workspaces and syncs memory files to Convex.
 * Run this periodically to keep the Memory Browser up to date.
 * 
 * Usage:
 *   node scripts/sync-memory.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Agent workspaces to scan
const AGENT_WORKSPACES = [
  { id: 'anton', name: 'Anton', path: '/Users/Anton/.openclaw/agents/anton-sys/' },
  { id: 'dante', name: 'Dante', path: '/Users/Anton/.openclaw/agents/dante-agent/' },
  { id: 'vincent', name: 'Vincent', path: '/Users/Anton/.openclaw/agents/vincent-agent/' },
];

// File patterns to look for
const MEMORY_PATTERNS = [
  { pattern: 'MEMORY.md', type: 'memory_md' },
  { pattern: 'SOUL.md', type: 'soul_md' },
  { pattern: 'AGENTS.md', type: 'agents_md' },
  { pattern: /memory\/\d{4}-\d{2}-\d{2}\.md/, type: 'daily_note' },
];

function scanDirectory(dirPath, basePath = dirPath) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '_generated') {
          continue;
        }
        files.push(...scanDirectory(fullPath, basePath));
      } else if (entry.isFile()) {
        files.push({
          path: fullPath,
          relativePath,
          name: entry.name,
        });
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dirPath}:`, err.message);
  }
  
  return files;
}

function matchMemoryFile(file) {
  for (const pattern of MEMORY_PATTERNS) {
    if (pattern.pattern instanceof RegExp) {
      if (pattern.pattern.test(file.relativePath)) {
        return pattern.type;
      }
    } else {
      if (file.name === pattern.pattern || file.relativePath.endsWith(pattern.pattern)) {
        return pattern.type;
      }
    }
  }
  return null;
}

function extractDateFromPath(filePath) {
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function generateSearchIndex(content, fileName) {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 50);
  
  const uniqueWords = [...new Set(words)];
  return [...uniqueWords, fileName.toLowerCase()];
}

async function syncMemoryEntries() {
  console.log('🔍 Scanning agent workspaces for memory files...\n');
  
  const allEntries = [];
  
  for (const agent of AGENT_WORKSPACES) {
    console.log(`📁 Scanning ${agent.name}...`);
    
    if (!fs.existsSync(agent.path)) {
      console.log(`   ⚠️  Path not found: ${agent.path}`);
      continue;
    }
    
    const files = scanDirectory(agent.path);
    console.log(`   Found ${files.length} total files`);
    
    let memoryCount = 0;
    for (const file of files) {
      const entryType = matchMemoryFile(file);
      if (!entryType) continue;
      
      try {
        const content = fs.readFileSync(file.path, 'utf-8');
        const date = extractDateFromPath(file.relativePath);
        
        allEntries.push({
          agentId: agent.id,
          agentName: agent.name,
          filePath: file.path,
          fileName: file.name,
          content: content.slice(0, 50000), // Limit content size
          entryType,
          date,
          searchIndex: generateSearchIndex(content, file.name),
        });
        
        memoryCount++;
      } catch (err) {
        console.error(`   ❌ Error reading ${file.path}:`, err.message);
      }
    }
    
    console.log(`   ✅ Found ${memoryCount} memory files\n`);
  }
  
  console.log(`\n📊 Total memory entries: ${allEntries.length}`);
  
  // Write to JSON file for manual import
  const outputPath = path.join(__dirname, '../memory-sync-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(allEntries, null, 2));
  console.log(`\n💾 Data written to: ${outputPath}`);
  
  console.log('\n📝 To import into Convex, run:');
  console.log('   npx convex import --table memory_entries memory-sync-data.json');
  
  return allEntries;
}

// Run if called directly
if (require.main === module) {
  syncMemoryEntries().catch(console.error);
}

module.exports = { syncMemoryEntries };
