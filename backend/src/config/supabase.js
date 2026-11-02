/**
 * "নিরাময়" (Niramoy) - Smart Hospital Management System
 * Supabase Client & Database Connection Module
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service role key for backend elevated administrative queries (bypasses RLS)
// Fallback to anon key if service role is not provided
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-ref')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    isConfigured = true;
    console.log('✅ [Supabase] Connected to PostgreSQL Cloud Database:', supabaseUrl);
  } catch (err) {
    console.error('❌ [Supabase] Client Initialization Error:', err.message);
  }
} else {
  console.warn(
    '⚠️  [Supabase] Active credentials not detected in .env. Operating with local database fallback for inspection.'
  );
}

module.exports = {
  supabase,
  isConfigured,
};
