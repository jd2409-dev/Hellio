#!/usr/bin/env node

// Simple server test to verify routes and authentication
import express from 'express';
import { config } from 'dotenv';

config();

const app = express();
app.use(express.json());

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      hasDatabase: !!process.env.DATABASE_URL,
      hasSupabase: !!process.env.VITE_SUPABASE_URL,
      hasGemini: !!process.env.GEMINI_API_KEY,
      hasSession: !!process.env.SESSION_SECRET
    }
  });
});

// Test database connection
app.get('/test/db', async (req, res) => {
  try {
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    res.json({
      success: true,
      message: 'Database connected successfully',
      currentTime: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Test Supabase connection
app.get('/test/supabase', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Supabase connected successfully',
      hasSession: !!data.session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Supabase connection failed',
      error: error.message
    });
  }
});

// Test Gemini AI
app.get('/test/gemini', async (req, res) => {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: 'Respond with exactly: "AI test successful"' }] }],
    });
    
    const text = response.text || '';
    
    res.json({
      success: true,
      message: 'Gemini AI connected successfully',
      response: text.substring(0, 100)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gemini AI failed',
      error: error.message
    });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🧪 Test server running on port ${port}`);
  console.log(`📋 Test endpoints:`);
  console.log(`   http://localhost:${port}/test - Basic server test`);
  console.log(`   http://localhost:${port}/test/db - Database connection test`);
  console.log(`   http://localhost:${port}/test/supabase - Supabase connection test`);
  console.log(`   http://localhost:${port}/test/gemini - Gemini AI test`);
});