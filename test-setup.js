#!/usr/bin/env node

// Test script to verify database and authentication setup
import { config } from 'dotenv';
import { Pool } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';

config();

console.log('🔍 Testing NexusLearn AI Setup...\n');

// Test 1: Environment Variables
console.log('1. Environment Variables:');
const requiredEnvVars = [
  'DATABASE_URL',
  'VITE_SUPABASE_URL', 
  'SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
  'SESSION_SECRET'
];

let envVarsOk = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`   ❌ ${varName}: Missing`);
    envVarsOk = false;
  }
});

if (!envVarsOk) {
  console.log('\n❌ Some environment variables are missing. Please check your .env file.');
  process.exit(1);
}

// Test 2: Database Connection (Neon PostgreSQL)
console.log('\n2. Database Connection (Neon PostgreSQL):');
try {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  const result = await client.query('SELECT version()');
  console.log(`   ✅ Connected to PostgreSQL: ${result.rows[0].version.substring(0, 50)}...`);
  client.release();
} catch (error) {
  console.log(`   ❌ Database connection failed: ${error.message}`);
}

// Test 3: Supabase Authentication
console.log('\n3. Supabase Authentication:');
try {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Test connection by getting the current session (should return null for no user)
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log(`   ❌ Supabase auth error: ${error.message}`);
  } else {
    console.log(`   ✅ Supabase auth connected (no active session)`);
  }
} catch (error) {
  console.log(`   ❌ Supabase connection failed: ${error.message}`);
}

// Test 4: Gemini AI
console.log('\n4. Gemini AI:');
try {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Test with a simple prompt
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: 'user', parts: [{ text: 'Say "Hello from NexusLearn AI!"' }] }],
  });
  
  const text = response.text || '';
  if (text.includes('Hello')) {
    console.log(`   ✅ Gemini AI connected: ${text.substring(0, 50)}...`);
  } else {
    console.log(`   ⚠️  Gemini AI responded but unexpected: ${text.substring(0, 50)}...`);
  }
} catch (error) {
  console.log(`   ❌ Gemini AI failed: ${error.message}`);
}

console.log('\n🎉 Setup test completed!');
console.log('\nNext steps:');
console.log('1. Run "npm run db:push" to set up database tables');
console.log('2. Run "npm run dev" to start the development server');
console.log('3. Visit http://localhost:5000 to test the application');