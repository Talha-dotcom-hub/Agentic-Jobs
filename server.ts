import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing:', { url: !!supabaseUrl, key: !!supabaseKey });
  // Do not initialize Supabase if configuration is missing to avoid runtime crashes
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  applySecurityHeaders,
  createRateLimiter,
  sanitizePromptInput,
} from './server/middleware/security';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(applySecurityHeaders);

// Rate Limiters
const geminiRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 15, message: 'Gemini match evaluation rate limit exceeded. Please wait a minute.' });
const scanRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 10, message: 'Scan rate limit exceeded.' });
const jobAddRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 20 });

// Initialize Google Gen AI client with server-side API Key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Mock/Initial In-Memory Database for Demo & Functional Real Server operations
let savedJobsStore: any[] = [];
let applicationsStore: any[] = [];
let userResumeStore: { text: string; lastUpdated: string; name: string } = {
  text: `Senior Full Stack Software Engineer with 6+ years of experience building scalable web applications.
Core Skills: React, TypeScript, Node.js, Express, Python, GraphQL, PostgreSQL, Tailwind CSS, Docker, AWS, REST APIs, Git, CI/CD pipelines, System Architecture.
Experience: Led frontend architecture for cloud platforms, implemented microservices with Express and Python, optimized database queries, built real-time WebSocket dashboards.
Education: B.S. in Computer Science.`,
  lastUpdated: new Date().toISOString(),
  name: 'Resume_Engineering_2026.pdf',
};

let scanScheduleStore = {
  enabled: true,
  frequencyType: 'hourly', // 'hourly' | 'daily'
  frequencyValue: 4, // every 4 hours
  lastScanTime: new Date(Date.now() - 3600000 * 2).toISOString(),
  nextScanTime: new Date(Date.now() + 3600000 * 2).toISOString(),
  lastSuccessfulScanJobsCount: 14,
  sourceFailuresCount: 0,
  status: 'idle', // 'idle' | 'running' | 'completed' | 'error'
};

let customJobsStore: any[] = [];

import { searchAllSources, registeredConnectors } from './server/sources/sourceManager';
import {
  getVapidPublicKey,
  saveSubscription,
  removeSubscription,
  sendPushNotificationToUser,
} from './server/push/webPushService';
import {
  executeScheduledUserScan,
  getUserScanHistory,
  calculateNextScanTime,
} from './server/scheduler/scanEngine';
import {
  getPersistedResume,
  savePersistedResume,
  deletePersistedResume,
  extractStructuredResumeProfile,
  StoredResumeRecord,
} from './server/resume/resumeManager';
import { initSchedulerWorker, processDueScans } from './server/scheduler/schedulerWorker';
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
  createCronAuthMiddleware,
  AuthenticatedRequest,
} from './server/middleware/auth';

const requireAuth = createAuthMiddleware(supabase);
const optionalAuth = createOptionalAuthMiddleware(supabase);
const requireCronAuth = createCronAuthMiddleware();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    apifyConfigured: Boolean(process.env.APIFY_API_TOKEN),
    rapidapiConfigured: Boolean(process.env.RAPIDAPI_KEY),
  });
});

// Web Push VAPID Public Key Endpoint
app.get('/api/push/vapid-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// Web Push Subscribe Endpoint (Authenticated)
app.post('/api/push/subscribe', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || req.body.userId;
  const { subscription } = req.body;
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'subscription payload is required.' });
  }
  await saveSubscription(userId, subscription, supabase);
  res.json({ success: true, message: 'Push subscription registered.' });
});

// Web Push Unsubscribe Endpoint (Authenticated)
app.post('/api/push/unsubscribe', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || req.body.userId;
  const { endpoint } = req.body;
  if (userId && endpoint) {
    await removeSubscription(userId, endpoint, supabase);
  }
  res.json({ success: true, message: 'Push subscription removed.' });
});

// Dedicated Account Deletion Endpoint (Authenticated)
app.delete('/api/user/account', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User authentication required.' });
  }

  try {
    if (supabase) {
      // 1. Delete associated resume files from Supabase Storage
      try {
        const { data: files } = await supabase.storage.from('resumes').list(userId);
        if (files && files.length > 0) {
          await supabase.storage.from('resumes').remove(files.map((f: any) => `${userId}/${f.name}`));
        }
      } catch (storageErr) {
        console.warn('Storage purge warning during account deletion:', storageErr);
      }

      // 2. Delete user profile record (cascades to all relational data in PostgreSQL)
      await supabase.from('profiles').delete().eq('id', userId);

      // 3. Purge user from auth.users if admin API is available
      if (supabase.auth?.admin?.deleteUser) {
        await supabase.auth.admin.deleteUser(userId);
      }
    }

    // Also remove from durable/memory resume store
    await deletePersistedResume(userId, supabase);

    res.json({ success: true, message: 'Account and associated resume memory permanently deleted.' });
  } catch (err: any) {
    console.error('Account deletion failure:', err);
    res.status(500).json({ error: err.message || 'Failed to delete account.' });
  }
});

// Cron-Triggered Autonomous Due Scans Endpoint (Protected by CRON_SECRET)
app.post('/api/scan/cron', requireCronAuth, async (req, res) => {
  try {
    const result = await processDueScans(
      () => scanScheduleStore as any,
      (patch) => {
        scanScheduleStore = { ...scanScheduleStore, ...patch };
      },
      supabase
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Cron scan execution failed:', err);
    res.status(500).json({ error: err.message || 'Cron scan failed' });
  }
});

// Run Scheduled Due Scans Endpoint (Protected by Cron/Auth)
app.post('/api/scan/run-due', requireCronAuth, scanRateLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId = 'user-001', resumeText } = req.body;
    const scanConfig = {
      userId,
      enabled: scanScheduleStore.enabled,
      frequencyType: scanScheduleStore.frequencyType as 'hourly' | 'daily',
      frequencyValue: scanScheduleStore.frequencyValue,
      timezone: 'UTC',
      lastScanTime: scanScheduleStore.lastScanTime,
      nextScanTime: scanScheduleStore.nextScanTime,
      resumeText: resumeText || userResumeStore.text,
    };

    const result = await executeScheduledUserScan(scanConfig, supabase);

    if (result.success) {
      scanScheduleStore.lastScanTime = new Date().toISOString();
      scanScheduleStore.nextScanTime = result.nextScanTime;
      scanScheduleStore.lastSuccessfulScanJobsCount = result.jobsDiscovered;
      scanScheduleStore.status = 'completed';
    } else {
      scanScheduleStore.status = 'error';
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Scan execution failed' });
  }
});

// Get User Scan History Logs Endpoint
app.get('/api/scan/history', optionalAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || (req.query.userId as string) || 'user-001';
  res.json(getUserScanHistory(userId));
});

// Real Multi-Source Job Search Endpoint
app.get('/api/jobs/search', async (req, res) => {
  try {
    const { keywords, location, experienceLevel, workplaceType } = req.query;
    const searchParams = {
      keywords: keywords ? String(keywords) : undefined,
      location: location ? String(location) : undefined,
      experienceLevel: experienceLevel ? String(experienceLevel) : undefined,
      workplaceType: workplaceType ? String(workplaceType) : undefined,
    };

    const result = await searchAllSources(searchParams);
    return res.json(result);
  } catch (error: any) {
    console.error('Job search API error:', error);
    return res.status(500).json({ error: error.message || 'Job search execution failed.' });
  }
});

// Source Connectors Status Endpoint
app.get('/api/sources', (req, res) => {
  const statuses = registeredConnectors.map((c) => ({
    sourceId: c.sourceId,
    displayName: c.displayName,
    apiKeyEnvVar: c.apiKeyEnvVar,
    isConfigured: c.isConfigured(),
  }));
  res.json(statuses);
});

// Gemini Resume Matching Endpoint (Rate limited & Prompt sanitized)
app.post('/api/gemini/match', geminiRateLimiter, async (req, res) => {
  try {
    const { jobTitle, jobCompany, jobDescription, resumeText } = req.body;

    if (!jobDescription || !jobTitle) {
      return res.status(400).json({ error: 'Job title and description are required.' });
    }

    const cleanTitle = sanitizePromptInput(jobTitle, 150);
    const cleanCompany = sanitizePromptInput(jobCompany, 150);
    const cleanDescription = sanitizePromptInput(jobDescription, 2500);
    const activeResume = sanitizePromptInput(resumeText || userResumeStore.text, 2500);

    if (!process.env.GEMINI_API_KEY) {
      // Fallback deterministic evaluator when GEMINI_API_KEY is not set
      const skillsToMatch = ['TypeScript', 'React', 'Node.js', 'Express', 'Python', 'AWS', 'PostgreSQL', 'Docker', 'GraphQL', 'Tailwind'];
      const matched = skillsToMatch.filter(skill =>
        cleanDescription.toLowerCase().includes(skill.toLowerCase()) &&
        activeResume.toLowerCase().includes(skill.toLowerCase())
      );
      const gaps = skillsToMatch.filter(skill =>
        cleanDescription.toLowerCase().includes(skill.toLowerCase()) &&
        !activeResume.toLowerCase().includes(skill.toLowerCase())
      );

      const score = Math.min(96, Math.max(65, 70 + matched.length * 4 - gaps.length * 3));

      return res.json({
        score,
        summary: `Strong candidate match for ${cleanTitle} at ${cleanCompany}. Demonstrated core competency in ${matched.slice(0, 3).join(', ')}.`,
        matchingEvidence: matched.map(m => `Proven hands-on experience in ${m} mentioned in resume experience.`),
        potentialSkillGaps: gaps.length > 0 ? gaps.map(g => `${g} required in job posting is not explicitly highlighted in resume text.`) : ['No major skill gaps identified.'],
        eligibilityWarnings: cleanDescription.toLowerCase().includes('clearance') ? ['Security Clearance may be required for this position.'] : [],
        isFallback: true,
      });
    }

    const prompt = `You are an expert AI talent evaluator. Analyze the following job posting against the candidate's resume.
Provide a objective, highly realistic estimated match score between 0 and 100.
Do NOT fabricate skills that are missing from the resume. Phrase skill gaps cautiously as "Not explicitly mentioned in resume text" rather than claiming the user lacks the skill.

JOB TITLE: ${cleanTitle}
COMPANY: ${cleanCompany || 'N/A'}
JOB DESCRIPTION:
${cleanDescription}

CANDIDATE RESUME:
${activeResume}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: 'Match score from 0 to 100' },
            summary: { type: Type.STRING, description: 'Concise explanation of the estimated match score' },
            matchingEvidence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key candidate skills and requirements supported by resume evidence',
            },
            potentialSkillGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Requirements mentioned in job description not explicitly highlighted in resume',
            },
            eligibilityWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Work authorization, clearance, or location requirements',
            },
          },
          required: ['score', 'summary', 'matchingEvidence', 'potentialSkillGaps', 'eligibilityWarnings'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini match error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process AI resume match.' });
  }
});

// Manual Job Creation
app.post('/api/jobs/add', (req, res) => {
  const newJob = {
    id: `custom-${Date.now()}`,
    title: req.body.title,
    company: req.body.company,
    location: req.body.location || 'Remote',
    source: 'User Custom Entry',
    postedDate: new Date().toISOString(),
    matchScore: req.body.matchScore || 88,
    salary: req.body.salary || 'Competitive',
    type: req.body.type || 'Full-time',
    experienceLevel: req.body.experienceLevel || 'Mid-Senior',
    originalUrl: req.body.originalUrl || 'https://linkedin.com/jobs',
    description: req.body.description || '',
    isStale: false,
    verified: true,
  };
  customJobsStore.unshift(newJob);
  res.json(newJob);
});

// Trigger Discovery Scan
app.post('/api/scan/trigger', async (req, res) => {
  scanScheduleStore.status = 'running';

  // Simulate active scanning across Apify, RapidAPI, public APIs
  setTimeout(() => {
    scanScheduleStore.lastScanTime = new Date().toISOString();
    const intervalMs = scanScheduleStore.frequencyType === 'hourly'
      ? scanScheduleStore.frequencyValue * 3600000
      : scanScheduleStore.frequencyValue * 86400000;
    scanScheduleStore.nextScanTime = new Date(Date.now() + intervalMs).toISOString();
    scanScheduleStore.status = 'completed';
    scanScheduleStore.lastSuccessfulScanJobsCount = Math.floor(Math.random() * 8) + 12;
  }, 1200);

  res.json({ message: 'Scan initiated across configured job sources.', schedule: scanScheduleStore });
});

// Schedule Get/Update with strict interval validation
const ALLOWED_HOURLY_INTERVALS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
const ALLOWED_DAILY_INTERVALS = [1, 2, 3, 4, 5];

app.get('/api/schedule', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (userId && supabase) {
    try {
      const { data, error } = await supabase
        .from('scan_schedules')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return res.json({
          enabled: data.enabled,
          frequencyType: data.frequency_type || 'hourly',
          frequencyValue: data.frequency_value || 4,
          lastScanTime: data.last_scan_time,
          nextScanTime: data.next_scan_time,
          lastSuccessfulScanJobsCount: data.last_successful_jobs_count || 0,
          sourceFailuresCount: data.source_failures_count || 0,
          status: data.status || 'idle',
        });
      }
    } catch (err) {
      console.warn('Failed to retrieve user scan schedule from Supabase:', err);
    }
  }
  res.json(scanScheduleStore);
});

app.post('/api/schedule', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { enabled, frequencyType, frequencyValue } = req.body;

  const targetType = frequencyType !== undefined ? frequencyType : scanScheduleStore.frequencyType;
  const targetValue = frequencyValue !== undefined ? Number(frequencyValue) : scanScheduleStore.frequencyValue;

  // Strict interval constraints: No 1-hour interval; hourly must be in ALLOWED_HOURLY_INTERVALS
  if (targetType === 'hourly') {
    if (targetValue === 1 || !ALLOWED_HOURLY_INTERVALS.includes(targetValue)) {
      return res.status(400).json({
        error: `Hourly interval must be one of [${ALLOWED_HOURLY_INTERVALS.join(', ')}]. 1 hour interval is not supported.`,
      });
    }
  } else if (targetType === 'daily') {
    if (!ALLOWED_DAILY_INTERVALS.includes(targetValue)) {
      return res.status(400).json({
        error: `Daily interval must be between 1 and 5 days. Received: ${targetValue}`,
      });
    }
  } else if (frequencyType !== undefined) {
    return res.status(400).json({ error: 'frequencyType must be "hourly" or "daily".' });
  }

  const nextScanTime = calculateNextScanTime(targetType, targetValue, new Date()).toISOString();

  if (userId && supabase) {
    try {
      await supabase.from('scan_schedules').upsert({
        user_id: userId,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        frequency_type: targetType,
        frequency_value: targetValue,
        next_scan_time: nextScanTime,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to upsert schedule in Supabase:', err);
    }
  }

  scanScheduleStore.enabled = enabled !== undefined ? Boolean(enabled) : scanScheduleStore.enabled;
  scanScheduleStore.frequencyType = targetType;
  scanScheduleStore.frequencyValue = targetValue;
  scanScheduleStore.nextScanTime = nextScanTime;

  res.json(scanScheduleStore);
});

// Resume Endpoints (Persistent Resume Memory with Durable Fallback)
app.get('/api/resume', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id || (req.query.userId as string) || 'user-001';
    const record = await getPersistedResume(userId, supabase);
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve resume' });
  }
});

app.post('/api/resume', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'user-001';
    const { text, name } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Resume text is required.' });
    }

    const existing = await getPersistedResume(userId, supabase);
    const extraction = await extractStructuredResumeProfile(text, name);

    const record: StoredResumeRecord = {
      userId,
      text,
      name: name || existing.name || 'Resume.pdf',
      lastUpdated: new Date().toISOString(),
      extractedSkills: extraction.skills,
      parsedRole: extraction.role,
      profile: extraction.profile,
      extractionStatus: 'completed',
      profileVersion: (existing.profileVersion || 0) + 1,
    };

    const saved = await savePersistedResume(record, supabase);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to persist resume' });
  }
});

app.post('/api/resume/extract', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'user-001';
    let resumeContent = req.body.text;
    if (!resumeContent) {
      const persisted = await getPersistedResume(userId, supabase);
      resumeContent = persisted.text;
    }
    const result = await extractStructuredResumeProfile(resumeContent, req.body.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract resume profile' });
  }
});

app.delete('/api/resume', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id || (req.query.userId as string) || req.body?.userId || 'user-001';
    await deletePersistedResume(userId, supabase);
    res.json({ success: true, message: 'Resume profile permanently deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete resume' });
  }
});

// Start autonomous background scheduler loop
initSchedulerWorker(
  () => scanScheduleStore as any,
  (patch) => {
    scanScheduleStore = { ...scanScheduleStore, ...patch };
  },
  30000,
  supabase
);

// Server Initialization with Vite middleware
async function startServer() {
  const PORT = process.env.PORT || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const template = await vite.transformIndexHtml(
          url,
          `
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Agentic Jobs — AI Job Discovery & Application Tracking</title>
  </head>
  <body class="bg-[#0B0F19] text-slate-100 min-h-screen antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
          `
        );

        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // server-dist/server.js and root dist/ are sibling directories.
    // Resolve the frontend build from the parent of server-dist.
    const clientDistPath = path.resolve(__dirname, '..', 'dist');

    // Serve production assets such as JS, CSS, icons and the web manifest.
    app.use(express.static(clientDistPath));

    // Serve React's entry point for frontend routes.
    app.get('*', (req, res, next) => {
      // Do not turn unknown API endpoints into the React HTML page.
      if (req.path.startsWith('/api/')) {
        return next();
      }

      res.sendFile(
        path.join(clientDistPath, 'index.html'),
        (err) => {
          if (err) {
            next(err);
          }
        }
      );
    });
  }

  app.listen(PORT, () => {
    console.log(`Agentic Jobs server running on http://localhost:${PORT}`);
  });
}

startServer();