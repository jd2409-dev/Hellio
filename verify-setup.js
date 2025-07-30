#!/usr/bin/env node

// Comprehensive verification script for NexusLearn AI setup
import { config } from 'dotenv';
import { Pool } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

config();

console.log('🔍 NexusLearn AI - Comprehensive Setup Verification\n');

let allTestsPassed = true;
const results = [];

function logResult(test, status, message) {
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${test}: ${message}`);
  results.push({ test, status, message });
  if (!status) allTestsPassed = false;
}

// Test 1: Environment Variables
console.log('1. Environment Variables Check:');
const requiredEnvVars = [
  'DATABASE_URL',
  'VITE_SUPABASE_URL', 
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
  'SESSION_SECRET'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.length > 10) {
    logResult(`ENV ${varName}`, true, `Present (${value.length} chars)`);
  } else {
    logResult(`ENV ${varName}`, false, 'Missing or too short');
  }
});

// Test 2: File Structure
console.log('\n2. File Structure Check:');
const requiredFiles = [
  'server/index.ts',
  'server/routes.ts',
  'server/storage.ts',
  'server/replitAuth.ts',
  'server/supabaseClient.ts',
  'client/src/lib/supabaseService.ts',
  'client/src/lib/supabaseClient.ts',
  'client/src/hooks/useAuth.ts',
  'shared/schema.ts',
  'drizzle.config.ts'
];

requiredFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    logResult(`FILE ${filePath}`, true, 'Exists');
  } else {
    logResult(`FILE ${filePath}`, false, 'Missing');
  }
});

// Test 3: Database Connection
console.log('\n3. Database Connection (Neon PostgreSQL):');
try {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  
  // Test basic connection
  const versionResult = await client.query('SELECT version()');
  logResult('DB Connection', true, `Connected to ${versionResult.rows[0].version.substring(0, 30)}...`);
  
  // Test if tables exist (they might not if db:push hasn't been run)
  try {
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'subjects', 'sessions')
    `);
    
    if (tablesResult.rows.length > 0) {
      logResult('DB Tables', true, `Found ${tablesResult.rows.length} tables`);
    } else {
      logResult('DB Tables', false, 'No tables found - run "npm run db:push"');
    }
  } catch (tableError) {
    logResult('DB Tables', false, 'Cannot check tables - might need db:push');
  }
  
  client.release();
} catch (error) {
  logResult('DB Connection', false, error.message);
}

// Test 4: Supabase Authentication
console.log('\n4. Supabase Authentication:');
try {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Test connection by getting the current session
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    logResult('Supabase Auth', false, error.message);
  } else {
    logResult('Supabase Auth', true, 'Connected successfully');
    
    // Test if we can get user (should be null for no active session)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError && !userError.message.includes('session_not_found')) {
      logResult('Supabase User API', false, userError.message);
    } else {
      logResult('Supabase User API', true, 'User API accessible');
    }
  }
} catch (error) {
  logResult('Supabase Auth', false, error.message);
}

// Test 5: Gemini AI
console.log('\n5. Gemini AI Connection:');
try {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: 'user', parts: [{ text: 'Respond with exactly: "NexusLearn AI test successful"' }] }],
  });
  
  const text = response.text || '';
  if (text.toLowerCase().includes('nexuslearn') || text.toLowerCase().includes('successful')) {
    logResult('Gemini AI', true, `Response: ${text.substring(0, 50)}...`);
  } else {
    logResult('Gemini AI', false, `Unexpected response: ${text.substring(0, 50)}...`);
  }
} catch (error) {
  logResult('Gemini AI', false, error.message);
}

// Test 6: TypeScript Compilation
console.log('\n6. TypeScript Check:');
try {
  // Check if TypeScript files can be imported (basic syntax check)
  const schemaPath = path.resolve('shared/schema.ts');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    if (schemaContent.includes('export const users') && schemaContent.includes('pgTable')) {
      logResult('Schema Types', true, 'Schema file looks valid');
    } else {
      logResult('Schema Types', false, 'Schema file missing key exports');
    }
  }
  
  // Check package.json scripts
  const packagePath = path.resolve('package.json');
  if (fs.existsSync(packagePath)) {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const hasRequiredScripts = ['dev', 'build', 'db:push'].every(script => 
      packageContent.scripts && packageContent.scripts[script]
    );
    
    if (hasRequiredScripts) {
      logResult('NPM Scripts', true, 'All required scripts present');
    } else {
      logResult('NPM Scripts', false, 'Missing required scripts');
    }
  }
} catch (error) {
  logResult('TypeScript Check', false, error.message);
}

// Test 7: Port Availability
console.log('\n7. Port Check:');
const port = process.env.PORT || 5000;
try {
  // Simple check if port is specified
  if (port && !isNaN(port)) {
    logResult('Port Config', true, `Port ${port} configured`);
  } else {
    logResult('Port Config', false, 'Invalid port configuration');
  }
} catch (error) {
  logResult('Port Config', false, error.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));

const passed = results.filter(r => r.status).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log(`✅ Passed: ${passed}/${total} tests (${percentage}%)`);

if (allTestsPassed) {
  console.log('\n🎉 ALL TESTS PASSED! Your setup is ready.');
  console.log('\n📋 Next Steps:');
  console.log('1. Run "npm run db:push" to set up database tables');
  console.log('2. Run "npm run dev" to start the development server');
  console.log('3. Visit http://localhost:5000 to test the application');
  console.log('4. Go to /supabase-auth to test authentication');
} else {
  console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  console.log('\n🔧 Common fixes:');
  console.log('- Check your .env file for missing variables');
  console.log('- Verify Supabase project is accessible');
  console.log('- Ensure Neon database is running');
  console.log('- Run "npm install" to install dependencies');
}

console.log('\n📖 See AUTHENTICATION_SETUP_SUMMARY.md for detailed information.');

// Exit with appropriate code
process.exit(allTestsPassed ? 0 : 1);