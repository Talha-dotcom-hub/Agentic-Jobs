import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { initSchedulerWorker } from './server/scheduler/schedulerWorker.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Persistent scan worker requires SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stopWorker = initSchedulerWorker(undefined, undefined, 30000, supabase);

function shutdown(signal: string): void {
  console.log(`Stopping persistent scan worker after ${signal}.`);
  stopWorker();
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
