#!/usr/bin/env node

// Quick test runner for RAG system
const { runRAGTests } = require('./rag-system.test');

console.log('🎬 Starting RAG Test Suite...\n');

// Run tests with better error handling
runRAGTests()
  .then(() => {
    console.log('\n✅ Test suite execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });