// backend/index.js
require('dotenv').config({ path: require('path').join(__dirname, '.env.local') }); // More robust path to .env.local in the same directory as index.js

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js'); // Standard Supabase JS client

// Your auto-apply service functions
const { applyToJob } = require('./services/autoApply');
const { applyToJobEmbed } = require('./services/autoApplyEmbed');
const { applyToSmartRecruiters } = require('./services/autoApplySmartRecruiters');
const { applyToLeverJob } = require('./services/leverApply');

const app = express();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("FATAL ERROR: Supabase URL and/or Anon Key are not defined in backend environment variables.");
  process.exit(1);
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.use(express.json());

app.post('/api/apply', async (req, res) => {
  console.log('Received /api/apply request. Body:', req.body);
  const { jobUrl } = req.body; // Only expect jobUrl from the body

  if (!jobUrl) {
    return res.status(400).json({ error: 'Missing jobUrl in request body' });
  }

  // 1. Extract JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated: Authorization header missing or malformed' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated: Token missing' });
  }

  // 2. Create a Supabase client instance to validate the token
  const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Server-side, no need to persist session for this client
      autoRefreshToken: false,
    }
  });

  // 3. Verify the token and get the user
  const { data: { user: authenticatedUser }, error: authError } = await supabaseAuthClient.auth.getUser(token);

  if (authError || !authenticatedUser) {
    console.error('Backend Authentication Error:', authError?.message || 'User could not be authenticated from token.');
    return res.status(401).json({ error: authError?.message || 'Invalid or expired token. User authentication failed.' });
  }

  const userIdFromToken = authenticatedUser.id;
  console.log(`User authenticated successfully via token. UserID: ${userIdFromToken}`);

  // 4. Create a new Supabase client instance specifically for this user's data requests.
  // This client will use the user's token, ensuring RLS policies work correctly.
  const supabaseDataClientForUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    },
    auth: {
      persistSession: false
    }
  });

  try {
    // 5. Fetch user_profile, work_experience, and education using the user-scoped client
    console.log(`Workspaceing data for user: ${userIdFromToken}`);
    const [
      profileResult,
      experiencesResult,
      educationsResult,
    ] = await Promise.all([
      supabaseDataClientForUser.from('user_profile').select('*').eq('user_id', userIdFromToken).single(),
      supabaseDataClientForUser.from('work_experience').select('*').eq('user_id', userIdFromToken),
      supabaseDataClientForUser.from('education').select('*').eq('user_id', userIdFromToken),
    ]);

    // Error handling for data fetching
    if (profileResult.error || !profileResult.data) {
      console.error('Error fetching profile or profile not found:', profileResult.error);
      throw new Error(profileResult.error?.message || 'User profile not found.');
    }
    if (experiencesResult.error) {
      console.error('Error fetching work experiences:', experiencesResult.error);
      throw new Error(experiencesResult.error.message);
    }
    if (educationsResult.error) {
      console.error('Error fetching education history:', educationsResult.error);
      throw new Error(educationsResult.error.message);
    }

    const userData = {
      profile: profileResult.data,
      experiences: experiencesResult.data || [],
      educations: educationsResult.data || [],
    };
    console.log(userData); // For debugging
    // console.log('User data fetched for auto-apply:', userData); // For debugging full data

    // 6. Dispatch to the appropriate auto-apply service
    console.log(`Dispatching to auto-apply service for URL: ${jobUrl}`);
    if (/greenhouse\.io|boards\.greenhouse\.io/.test(jobUrl)) {
      if (/embed/.test(jobUrl)) {
        await applyToJobEmbed(jobUrl, userData);
      } else {
        await applyToJob(jobUrl, userData);
      }
    } else if (/smartrecruiters\.com/.test(jobUrl)) {
      await applyToSmartRecruiters(jobUrl, userData);
    } else if (/\.lever\.co/.test(jobUrl)) { // Robust Lever matching
      await applyToLeverJob(jobUrl, userData);
    } else {
      console.warn(`Unsupported job URL for auto-apply: ${jobUrl}`);
      return res.status(400).json({ error: 'Unsupported job URL for auto-application' });
    }

    console.log(`Application process successfully initiated for ${jobUrl} for user ${userIdFromToken}`);
    return res.json({ success: true, message: 'Application process initiated successfully.' });

  } catch (err) {
    console.error(`Unified apply error for user ${userIdFromToken}, URL ${jobUrl}:`, err.message, err.stack);
    return res.status(500).json({ error: err.message || 'An internal error occurred during the application process.' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend server for ApplyPilot listening on port ${PORT}`));

// Optional: Add a root route for health check or basic info
app.get('/', (req, res) => {
  res.send('ApplyPilot Auto-Apply Backend is running.');
});