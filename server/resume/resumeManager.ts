import { Type } from '@google/genai';
import { generateWithGeminiFallback } from '../ai/geminiFallback.js';
import fs from 'fs';
import { createHash } from 'node:crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const RESUME_FILE = path.join(DATA_DIR, 'resumes.json');

// Ensure data directory exists for durable local persistence
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface WorkExperienceItem {
  jobTitle: string;
  company: string;
  duration?: string;
  yearsOfExperience?: number;
  responsibilities: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  graduationYear?: string;
}

export interface StructuredProfessionalProfile {
  headline?: string;
  skills: string[];
  technicalTools: string[];
  qualifications: string[];
  certifications: string[];
  experience: WorkExperienceItem[];
  education: EducationItem[];
  projects: string[];
  languages: string[];
  domains: string[];
  yearsOfExperienceTotal?: number;
}

export interface StoredResumeRecord {
  userId: string;
  text: string;
  name: string;
  lastUpdated: string;
  extractedSkills: string[];
  parsedRole: string;
  profile: StructuredProfessionalProfile;
  extractionStatus: 'idle' | 'extracting' | 'completed' | 'failed';
  extractionError?: string;
  profileVersion: number;
}

// Durable local storage helper
function readLocalStore(): Record<string, StoredResumeRecord> {
  try {
    if (fs.existsSync(RESUME_FILE)) {
      const content = fs.readFileSync(RESUME_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    }
  } catch (err) {
    console.warn('Failed to read local resume store:', err);
  }
  return {};
}

function writeLocalStore(data: Record<string, StoredResumeRecord>) {
  try {
    fs.writeFileSync(RESUME_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write local resume store:', err);
  }
}

// Deterministic baseline extraction only records evidence that appears in the supplied text.
// It deliberately does not fabricate a job, employer, degree institution, projects, or experience duration.
export function extractDeterministicProfile(resumeText: string, _fileName?: string): StructuredProfessionalProfile {
  const text = String(resumeText || '');
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const commonTech = [
    'TypeScript', 'JavaScript', 'React', 'Node.js', 'Express', 'Python', 'GraphQL',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS',
    'GCP', 'Azure', 'Tailwind CSS', 'REST APIs', 'System Architecture', 'Git',
    'CI/CD', 'Next.js', 'HTML5', 'CSS3', 'Linux', 'Microservices', 'Jest', 'Vite',
    'Java', 'C++', 'C#', 'SQL', 'Power BI', 'Tableau', 'Excel', 'Pandas', 'NumPy',
    'Scikit-learn', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis',
  ];
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matchedTech = commonTech.filter((tech) => {
    const pattern = new RegExp(`(^|[^\\w])${escapeRegExp(tech)}($|[^\\w])`, 'i');
    return pattern.test(text);
  });

  const certificationPatterns: Array<[string, RegExp]> = [
    ['AWS Certified Solutions Architect', /AWS Certified Solutions Architect/i],
    ['AWS Certified Developer', /AWS Certified Developer/i],
    ['Google Cloud Certified', /Google Cloud Certified|GCP Certified/i],
    ['Project Management Professional (PMP)', /Project Management Professional|\bPMP\b/i],
    ['Certified ScrumMaster', /Certified ScrumMaster|Scrum Master Certified/i],
    ['CISSP', /\bCISSP\b/i],
    ['Certified Kubernetes Application Developer (CKAD)', /\bCKAD\b/i],
    ['Certified Kubernetes Administrator (CKA)', /\bCKA\b/i],
  ];
  const certifications = certificationPatterns.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);

  const degreePattern = /\b(bachelor(?:'s)?|master(?:'s)?|ph\.?d\.?|doctorate|b\.?s\.?|b\.?sc\.?|b\.?e\.?|bsse|bcs|m\.?s\.?|m\.?sc\.?|mcs|mba|associate(?:'s)?)\b/i;
  const qualifications = Array.from(new Set(lines
    .map((line) => line.replace(/^(education|qualification|degree)\s*:\s*/i, '').trim())
    .filter((line) => degreePattern.test(line))
    .map((line) => line.replace(/[.;,]+$/, '').trim())
    .filter(Boolean))).slice(0, 10);

  const education: EducationItem[] = [];
  const institutionPattern = /\b(university|college|institute|school|academy|polytechnic)\b/i;
  for (let i = 0; i < lines.length; i++) {
    const cleaned = lines[i].replace(/^education\s*:\s*/i, '').trim();
    if (!degreePattern.test(cleaned)) continue;
    const split = cleaned.match(/^(.+?)\s+(?:at|from|\||—|–|-)\s+(.+)$/i) || cleaned.match(/^(.+?),\s+(.+)$/);
    if (split && institutionPattern.test(split[2])) {
      education.push({ degree: split[1].replace(/[.;]+$/, '').trim(), institution: split[2].replace(/[.;]+$/, '').trim() });
      continue;
    }
    const nextLine = lines[i + 1];
    if (nextLine && institutionPattern.test(nextLine) && nextLine.length <= 160) {
      education.push({ degree: cleaned.replace(/[.;]+$/, '').trim(), institution: nextLine.replace(/[.;]+$/, '').trim() });
    }
  }

  const roleTerms = /\b(software engineer|software developer|full[- ]stack developer|full[- ]stack engineer|frontend developer|front[- ]end developer|backend developer|back[- ]end developer|data analyst|data scientist|business analyst|machine learning engineer|AI engineer|devops engineer|qa engineer|quality assurance engineer|mobile developer|android developer|ios developer|cybersecurity analyst|database administrator|product manager|project manager|web developer|systems analyst|UI\/UX designer|designer|engineer|developer|analyst|scientist|administrator|consultant|specialist|intern|student)\b/i;
  let headline: string | undefined;
  for (const line of lines.slice(0, 15)) {
    if (/^(skills?|technical skills?|education|experience|work experience|projects?|certifications?|languages?)\s*:/i.test(line)) continue;
    if (!roleTerms.test(line) || line.length > 140) continue;
    const candidate = line.split(/\s+(?:\||—|–)\s+|\s+with\s+\d+\+?\s+years?/i)[0].replace(/^(headline|title|role|profile)\s*:\s*/i, '').trim();
    if (candidate.length >= 4 && candidate.length <= 100) { headline = candidate; break; }
  }

  const yearsMatch = text.match(/\b(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:professional\s+)?experience\b/i)
    || text.match(/\bexperience\s*:\s*(\d{1,2})\+?\s*(?:years?|yrs?)\b/i);
  const yearsOfExperienceTotal = yearsMatch ? Number(yearsMatch[1]) : undefined;

  const readLabeledList = (label: string): string[] => {
    const pattern = new RegExp(`^${label}\\s*:\\s*(.+)$`, 'im');
    const match = text.match(pattern);
    if (!match) return [];
    return match[1].split(/[,;|]/).map((item) => item.trim()).filter(Boolean).slice(0, 20);
  };

  const projects: string[] = [];
  const projectHeading = lines.findIndex((line) => /^projects?\s*:?\s*$/i.test(line));
  if (projectHeading >= 0) {
    for (const line of lines.slice(projectHeading + 1)) {
      if (/^(experience|education|skills|certifications|languages|references)\s*:?\s*$/i.test(line)) break;
      if (/^[-•*]\s+/.test(line)) projects.push(line.replace(/^[-•*]\s+/, '').trim());
      if (projects.length >= 15) break;
    }
  }

  const experience: WorkExperienceItem[] = [];
  let inExperience = false;
  for (const line of lines) {
    if (/^(work\s+)?experience\s*:?\s*$/i.test(line)) { inExperience = true; continue; }
    if (inExperience && /^(education|skills|projects|certifications|languages|summary|technical skills)\s*:?\s*$/i.test(line)) break;
    if (!inExperience) continue;
    const match = line.replace(/^[-•*]\s+/, '').match(/^(.{2,80}?)\s+(?:at|@)\s+(.{2,100}?)(?:\s*\(([^)]{2,50})\))?$/i);
    if (match) experience.push({ jobTitle: match[1].trim(), company: match[2].trim(), duration: match[3]?.trim(), responsibilities: [] });
    if (experience.length >= 10) break;
  }

  return {
    headline,
    skills: matchedTech.slice(0, 20),
    technicalTools: matchedTech,
    qualifications,
    certifications,
    experience,
    education,
    projects,
    languages: readLabeledList('languages'),
    domains: readLabeledList('domains|industries'),
    yearsOfExperienceTotal,
  };
}

// Search terms must be grounded in a title or skills explicitly present in the resume.
export function deriveResumeSearchKeywords(resumeText: string): string {
  const profile = extractDeterministicProfile(resumeText);
  if (profile.headline) {
    const primarySkill = profile.skills[0];
    return [profile.headline, primarySkill].filter(Boolean).join(' ').slice(0, 120);
  }
  return profile.skills.slice(0, 3).join(' ').slice(0, 120);
}

// AI-Powered structured extraction with Google GenAI SDK
export async function extractStructuredResumeProfile(
  resumeText: string,
  fileName?: string,
  apiKeyOverride?: string,
): Promise<{ profile: StructuredProfessionalProfile; skills: string[]; role: string }> {
  // Use the signed-in user key first, then an optional service-level key.
  const activeApiKey = apiKeyOverride || (process.env.ALLOW_SHARED_GEMINI_KEY === 'true' ? process.env.GEMINI_API_KEY : undefined);
  // Without a key, keep deterministic extraction honest and available.
  if (!activeApiKey || resumeText.trim().length < 40) {
    const fallbackProfile = extractDeterministicProfile(resumeText, fileName);
    return {
      profile: fallbackProfile,
      skills: fallbackProfile.skills,
      role: fallbackProfile.headline || '',
    };
  }

  try {
    const prompt = `You are a precision AI Resume Intelligence system. Extract structured professional profile data from the candidate's resume below.
CRITICAL RULES:
1. Do NOT invent or fabricate any missing companies, degrees, certifications, skills, or years of experience.
2. Only output data that is explicitly supported by the resume text.
3. If an item is not present, return an empty array or null.
4. Estimate total years of professional experience realistically based on the dates or explicit text provided.

RESUME CONTENT:
"""
${resumeText.slice(0, 4500)}
"""`;

    const { response } = await generateWithGeminiFallback(activeApiKey, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING, description: 'Primary professional title or specialty' },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Core professional skills directly evidenced',
            },
            technicalTools: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Programming languages, frameworks, cloud platforms, and tools',
            },
            qualifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Formal degrees, academic qualifications',
            },
            certifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Verified professional industry certifications',
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jobTitle: { type: Type.STRING },
                  company: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  yearsOfExperience: { type: Type.NUMBER },
                  responsibilities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['jobTitle', 'company'],
              },
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  graduationYear: { type: Type.STRING },
                },
                required: ['degree', 'institution'],
              },
            },
            projects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            languages: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            domains: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            yearsOfExperienceTotal: {
              type: Type.NUMBER,
              description: 'Total estimated years of relevant professional experience',
            },
          },
          required: ['headline', 'skills', 'technicalTools', 'qualifications'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}') as StructuredProfessionalProfile;
    const skills = Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : parsed.technicalTools || [];

    return {
      profile: {
        headline: typeof parsed.headline === 'string' && parsed.headline.trim() ? parsed.headline.trim() : undefined,
        skills: skills.slice(0, 20),
        technicalTools: parsed.technicalTools || [],
        qualifications: parsed.qualifications || [],
        certifications: parsed.certifications || [],
        experience: Array.isArray(parsed.experience) ? parsed.experience.filter((item: any) => item && typeof item.jobTitle === 'string' && item.jobTitle.trim() && typeof item.company === 'string' && item.company.trim()).map((item: any) => ({ ...item, responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities.filter((v: unknown) => typeof v === 'string') : [] })) : [],
        education: Array.isArray(parsed.education) ? parsed.education.filter((item: any) => item && typeof item.degree === 'string' && item.degree.trim() && typeof item.institution === 'string' && item.institution.trim()) : [],
        projects: parsed.projects || [],
        languages: Array.isArray(parsed.languages) ? parsed.languages.filter((v: unknown) => typeof v === 'string' && v.trim()) : [],
        domains: parsed.domains || [],
        yearsOfExperienceTotal: typeof parsed.yearsOfExperienceTotal === 'number' && Number.isFinite(parsed.yearsOfExperienceTotal) && parsed.yearsOfExperienceTotal >= 0 && parsed.yearsOfExperienceTotal <= 80 ? parsed.yearsOfExperienceTotal : undefined,
      },
      skills: skills.slice(0, 20),
      role: typeof parsed.headline === 'string' && parsed.headline.trim() ? parsed.headline.trim() : '',
    };
  } catch (err: any) {
    console.warn('Gemini structured resume extraction failed, using fallback:', err.message);
    const fallbackProfile = extractDeterministicProfile(resumeText, fileName);
    return {
      profile: fallbackProfile,
      skills: fallbackProfile.skills,
      role: fallbackProfile.headline || '',
    };
  }
}

// Local plaintext storage is opt-in for development only. Production resumes belong in Supabase.
const LOCAL_RESUME_STORAGE_ENABLED = process.env.NODE_ENV !== 'production' && process.env.ALLOW_LOCAL_RESUME_STORE === 'true';

export async function getPersistedResume(userId: string, supabaseClient?: any): Promise<StoredResumeRecord | null> {
  if (!userId) return null;
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`Could not read saved resume: ${error.message}`);
    if (data) {
      return {
        userId: data.user_id,
        text: data.content_text || '',
        name: data.file_name || 'Resume',
        lastUpdated: data.updated_at || new Date().toISOString(),
        extractedSkills: Array.isArray(data.extracted_skills) ? data.extracted_skills : [],
        parsedRole: data.structured_profile?.headline || '',
        profile: data.structured_profile || extractDeterministicProfile(data.content_text || '', data.file_name),
        extractionStatus: data.extraction_status || 'completed',
        profileVersion: data.profile_version || 1,
      };
    }
    return null;
  }

  if (!LOCAL_RESUME_STORAGE_ENABLED) return null;
  return readLocalStore()[userId] || null;
}

export async function savePersistedResume(
  record: StoredResumeRecord,
  supabaseClient?: any,
): Promise<StoredResumeRecord> {
  if (!record.userId || !record.text.trim()) throw new Error('A user identity and non-empty resume text are required.');
  if (supabaseClient) {
    const { error: resumeError } = await supabaseClient
      .from('resumes')
      .upsert({
        user_id: record.userId,
        content_text: record.text,
        file_name: record.name,
        extracted_skills: record.extractedSkills,
        structured_profile: record.profile,
        profile_version: record.profileVersion,
        extraction_status: record.extractionStatus,
        updated_at: record.lastUpdated,
      }, { onConflict: 'user_id' });
    if (resumeError) throw new Error(`Resume could not be saved in Supabase: ${resumeError.message}`);

    const { error: profileError } = await supabaseClient
      .from('professional_profiles')
      .upsert({
        user_id: record.userId,
        headline: record.profile.headline || null,
        skills: record.profile.skills,
        technical_tools: record.profile.technicalTools,
        qualifications: record.profile.qualifications,
        certifications: record.profile.certifications,
        experience: record.profile.experience,
        education: record.profile.education,
        projects: record.profile.projects,
        languages: record.profile.languages,
        domains: record.profile.domains,
        years_of_experience: record.profile.yearsOfExperienceTotal ?? null,
        profile_version: record.profileVersion,
        extracted_at: record.lastUpdated,
        updated_at: record.lastUpdated,
      }, { onConflict: 'user_id' });
    if (profileError) throw new Error(`Resume saved, but structured profile sync failed: ${profileError.message}`);
    return record;
  }

  if (!LOCAL_RESUME_STORAGE_ENABLED) {
    throw new Error('Persistent resume storage is unavailable. Configure Supabase for this backend, or explicitly enable local development storage.');
  }
  const localStore = readLocalStore();
  localStore[record.userId] = record;
  writeLocalStore(localStore);
  const check = readLocalStore()[record.userId];
  if (!check || check.text !== record.text) throw new Error('Local resume store could not confirm the saved record.');
  return record;
}

export async function deletePersistedResume(userId: string, supabaseClient?: any): Promise<boolean> {
  if (!userId) throw new Error('User identity is required to delete a resume.');
  if (supabaseClient) {
    const { error: resumeError } = await supabaseClient.from('resumes').delete().eq('user_id', userId);
    if (resumeError) throw new Error(`Could not delete saved resume: ${resumeError.message}`);
    const { error: profileError } = await supabaseClient.from('professional_profiles').delete().eq('user_id', userId);
    if (profileError) throw new Error(`Could not delete structured profile: ${profileError.message}`);
  } else if (!LOCAL_RESUME_STORAGE_ENABLED) {
    throw new Error('Persistent resume storage is unavailable.');
  }

  if (LOCAL_RESUME_STORAGE_ENABLED) {
    const localStore = readLocalStore();
    delete localStore[userId];
    writeLocalStore(localStore);
  }
  return true;
}

export function removeLocalResumeRecord(userId: string): void {
  if (!LOCAL_RESUME_STORAGE_ENABLED || !userId) return;
  const localStore = readLocalStore();
  delete localStore[userId];
  writeLocalStore(localStore);
}
