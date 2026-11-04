import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ListChecks,
  RefreshCw,
  Save,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  Code,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { TiltCard } from '../../components/common/TiltCard';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { getGeminiKeyStatus, saveGeminiApiKey } from '../../services/api';

async function extractResumeText(file: File): Promise<string> {
  const maxBytes = 5 * 1024 * 1024;
  if (file.size === 0) throw new Error('The selected file is empty.');
  if (file.size > maxBytes) throw new Error('Resume file exceeds the 5 MB upload limit.');
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    const text = await file.text();
    if (!text.trim()) throw new Error('No readable text was found in this file.');
    return text;
  }
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => typeof item.str === 'string' ? item.str : '').filter(Boolean).join(' ');
      if (pageText.trim()) pages.push(pageText.trim());
    }
    const text = pages.join('\n\n');
    if (text.trim().length < 20) throw new Error('No selectable text was found in this PDF. It may be scanned/image-only; OCR is not currently supported. Upload a text-based PDF or paste the resume text.');
    return text;
  }
  if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth/mammoth.browser');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    const text = String(result.value || '').trim();
    if (text.length < 20) throw new Error('No readable text was found in this DOCX file.');
    return text;
  }
  throw new Error('Unsupported file type. Upload PDF, DOCX, TXT, or Markdown.');
}

export const MyResume: React.FC = () => {
  const { resume, updateResume, reprocessResumeProfile, deleteResumeProfile, showToast } = useApp();
  const [resumeText, setResumeText] = useState(resume.text);
  const [resumeName, setResumeName] = useState(resume.name);
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'structured' | 'editor'>('structured');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [geminiSetupOpen, setGeminiSetupOpen] = useState(false);
  const [geminiSetupKey, setGeminiSetupKey] = useState('');
  const [geminiSetupSaving, setGeminiSetupSaving] = useState(false);
  const promptForGeminiIfMissing = async () => {
    try {
      const status = await getGeminiKeyStatus();
      if (!status.configured) setGeminiSetupOpen(true);
    } catch {
      // A failed status check should not block resume upload; invite the user to configure the key.
      setGeminiSetupOpen(true);
    }
  };
  const handleSaveGeminiSetupKey = async () => {
    if (!geminiSetupKey.trim()) {
      showToast('Paste your Gemini API key to enable AI matching.', 'error');
      return;
    }
    setGeminiSetupSaving(true);
    try {
      await saveGeminiApiKey(geminiSetupKey.trim());
      setGeminiSetupKey('');
      setGeminiSetupOpen(false);
      showToast('Gemini key encrypted and saved. Refreshing your resume profile with AI...', 'success');
      await reprocessResumeProfile();
    } catch (error: any) {
      showToast(error?.message || 'Could not save Gemini API key. Check Settings/backend configuration.', 'error');
    } finally {
      setGeminiSetupSaving(false);
    }
  };

  // Sync state if context resume changes
  React.useEffect(() => {
    setResumeText(resume.text);
    setResumeName(resume.name);
  }, [resume.text, resume.name]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const content = await extractResumeText(file);
      setResumeName(file.name);
      setResumeText(content);
      showToast(`Text extracted from ${file.name}. Saving your resume...`, 'info');
      await updateResume(content, file.name, file);
      await promptForGeminiIfMissing();
    } catch (error: any) {
      showToast(error?.message || 'Could not read or save this resume file.', 'error');
    } finally {
      setSaving(false);
      input.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateResume(resumeText, resumeName);
      if (resumeText.trim()) await promptForGeminiIfMissing();
    } catch (error: any) {
      showToast(error?.message || 'Could not save the resume. Your previous saved profile was kept.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await reprocessResumeProfile();
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(false);
    await deleteResumeProfile();
  };

  const profile = resume.profile;
  const skills = profile?.skills?.length ? profile.skills : resume.extractedSkills;
  const tools = profile?.technicalTools?.length ? profile.technicalTools : resume.extractedSkills;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Persistent Resume &amp; Profile Memory</span>
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Structured candidate memory used by autonomous background scans to evaluate job compatibility.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReprocess}
            disabled={reprocessing || !resume.text.trim()}
            className="px-3.5 py-2 rounded-[6px] bg-surface-container hover:bg-surface-container-high text-on-surface border border-[#27272A] font-label-md font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Re-extract structured competency profile with Gemini AI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin text-primary' : 'text-primary'}`} />
            <span>{reprocessing ? 'Extracting...' : 'Reprocess AI Profile'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !resumeText.trim()}
            className="px-4 py-2 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary font-semibold font-label-md text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={!resume.text.trim()}
            className="p-2 rounded-[6px] bg-surface-container hover:bg-error-container/30 text-on-surface-variant hover:text-error border border-[#27272A] transition-colors disabled:opacity-30"
            title="Delete Stored Profile"
            aria-label="Delete Stored Profile"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security & Memory Status Banner */}
      <div className="p-4 rounded-xl bg-surface-container border border-[#27272A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-on-surface-variant font-body-sm">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <strong className="text-on-surface font-semibold font-label-md">Dual Persistent Memory: </strong>
            Saved in your authenticated account. Production does not use a local plaintext resume fallback.
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-code-meta">
          <span className="px-2 py-0.5 rounded-[4px] bg-surface-container-high border border-[#27272A] text-on-surface">
            v{resume.profileVersion || 1}
          </span>
          <span className="px-2 py-0.5 rounded-[4px] bg-primary/10 border border-primary/20 text-primary">
            {resume.extractionStatus || 'active'}
          </span>
        </div>
      </div>

      {/* Stitch Segmented View Mode Tabs */}
      <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-[6px] border border-[#27272A] w-fit">
        <button
          onClick={() => setActiveTab('structured')}
          className={`px-3 py-1.5 rounded-[4px] font-label-md text-xs transition-colors flex items-center gap-2 ${
            activeTab === 'structured'
              ? 'bg-[#27272A] text-on-surface font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>Structured AI Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-3 py-1.5 rounded-[4px] font-label-md text-xs transition-colors flex items-center gap-2 ${
            activeTab === 'editor'
              ? 'bg-[#27272A] text-on-surface font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-secondary" />
          <span>Resume Text &amp; Upload</span>
        </button>
      </div>

      {activeTab === 'structured' ? (
        <div className="space-y-6">
          {/* Headline & Overview Card */}
          <div className="p-5 sm:p-6 rounded-xl bg-surface-container-high border border-[#27272A] shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div>
                <span className="font-code-meta text-[11px] uppercase tracking-wider text-primary font-medium">
                  Target Candidate Profile
                </span>
                <h2 className="font-headline-lg-mobile sm:font-headline-lg text-lg sm:text-xl font-bold text-on-surface mt-0.5">
                  {profile?.headline || resume.parsedRole || (resume.text.trim() ? 'Role not explicitly identified' : 'Upload a resume to build your profile')}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-[6px] bg-primary/10 border border-primary/20 text-primary font-code-meta text-xs font-semibold tabular-nums">
                  {typeof profile?.yearsOfExperienceTotal === 'number' ? `${profile.yearsOfExperienceTotal}+ Years Experience` : 'Experience duration not specified'}
                </span>
              </div>
            </div>

            {profile?.domains && profile.domains.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 relative z-10">
                <span className="font-code-meta text-xs text-on-surface-variant font-medium">Domain Focus:</span>
                {profile.domains.map((dom, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-[4px] bg-surface-container border border-[#27272A] text-on-surface font-code-meta text-[11px]"
                  >
                    {dom}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Core Competencies & Skills */}
          <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-[#27272A] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Extracted Core Competencies</span>
              </h3>
              <span className="font-code-meta text-[11px] text-on-surface-variant tabular-nums">
                {skills.length} competencies identified
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-[6px] bg-surface-container-high border border-[#27272A] text-on-surface font-code-meta text-xs flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Technical Tools & Frameworks */}
          {tools && tools.length > 0 && (
            <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-[#27272A] space-y-3">
              <h3 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Technical Tools, Languages &amp; Infrastructure</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-[6px] bg-surface-container-low border border-[#27272A] text-secondary font-code-meta text-xs"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-[#27272A] space-y-4">
            <h3 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-tertiary flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Demonstrated Work Experience</span>
            </h3>

            {profile?.experience && profile.experience.length > 0 ? (
              <div className="space-y-3">
                {profile.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-[#27272A] space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-bold text-on-surface text-sm font-headline-sm">{exp.jobTitle}</div>
                      <div className="text-xs font-code-meta text-on-surface-variant flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-on-surface-variant/70" />
                        <span>{exp.duration || (exp.yearsOfExperience ? `${exp.yearsOfExperience} years` : 'Documented')}</span>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-primary font-label-md">{exp.company}</div>
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="space-y-1.5 pt-1 pl-1 font-body-sm text-xs text-on-surface-variant">
                        {exp.responsibilities.map((resp, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <span className="text-primary font-bold">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-sm text-xs text-on-surface-variant italic">No explicit work-history entries were identified in the saved resume.</p>
            )}
          </div>

          {/* Education & Qualifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Education */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-[#27272A] space-y-3">
              <h3 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span>Education &amp; Degrees</span>
              </h3>
              {profile?.education && profile.education.length > 0 ? (
                <div className="space-y-2.5">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-surface-container-lowest border border-[#27272A] text-xs">
                      <div className="font-semibold text-on-surface font-label-md">{edu.degree}</div>
                      <div className="text-on-surface-variant text-[11px] font-code-meta mt-0.5">{edu.institution}</div>
                      {edu.graduationYear && (
                        <div className="text-on-surface-variant/70 text-[10px] font-code-meta mt-0.5">Class of {edu.graduationYear}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-body-sm text-xs text-on-surface-variant italic">No formal degree explicitly listed in resume.</p>
              )}
            </div>

            {/* Certifications */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-[#27272A] space-y-3">
              <h3 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Certifications &amp; Credentials</span>
              </h3>
              {profile?.certifications && profile.certifications.length > 0 ? (
                <div className="space-y-2">
                  {profile.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-container-lowest border border-[#27272A] text-xs flex items-center gap-2 text-on-surface font-code-meta"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-body-sm text-xs text-on-surface-variant italic">
                  Certifications explicitly mentioned in resume will appear here.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Drag & Drop File Upload Box */}
          <div className="p-6 rounded-xl bg-surface-container border border-dashed border-[#27272A] hover:border-primary/60 transition-colors text-center space-y-3">
            <Upload className="w-8 h-8 text-primary mx-auto" />
            <div className="text-xs text-on-surface font-body-sm">
              <label className="text-primary hover:text-primary-fixed font-semibold cursor-pointer underline font-label-md">
                Click to upload PDF / TXT
                <input
                  type="file"
                  accept=".txt,.pdf,.md,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>{' '}
              or drag and drop your resume file
            </div>
            <p className="font-code-meta text-[11px] text-on-surface-variant">
              Currently active: <span className="text-on-surface font-medium">{resume.name}</span> (Updated {new Date(resume.lastUpdated).toLocaleDateString()})
            </p>
          </div>

          {/* Resume Content Text Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-on-surface font-label-md">Resume Plain Text Content</label>
              <span className="text-on-surface-variant font-code-meta text-[11px] tabular-nums">{resumeText.length} characters</span>
            </div>
            <textarea
              rows={14}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full p-4 bg-surface-container-lowest border border-[#27272A] rounded-xl text-xs text-on-surface font-mono leading-relaxed focus:outline-none focus:border-primary transition-colors resize-y"
            />
          </div>
        </div>
      )}

      {geminiSetupOpen && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="gemini-setup-title" className="w-full max-w-lg rounded-xl border border-[#27272A] bg-surface-container-high p-6 shadow-2xl space-y-4 font-body-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 id="gemini-setup-title" className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">Connect Gemini to activate your AI agent</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Your resume is saved. Add your own Google Gemini API key for profile extraction, job matching and scheduled AI scoring.</p>
              </div>
            </div>
            <label className="block text-xs font-medium text-on-surface font-label-md">Gemini API key</label>
            <input type="password" autoComplete="new-password" value={geminiSetupKey} onChange={(e) => setGeminiSetupKey(e.target.value)} placeholder="Paste Gemini API key" className="w-full rounded-[6px] bg-surface-container-lowest border border-[#27272A] px-3.5 py-2.5 text-xs text-on-surface font-mono focus:outline-none focus:border-primary transition-colors" />
            <p className="font-code-meta text-[11px] text-on-surface-variant">Key is encrypted on the backend and never sent back to the browser.</p>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" onClick={() => setGeminiSetupOpen(false)} className="px-3.5 py-1.5 rounded-[6px] border border-[#27272A] bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-xs">Later</button>
              <button type="button" onClick={handleSaveGeminiSetupKey} disabled={geminiSetupSaving || !geminiSetupKey.trim()} className="px-4 py-1.5 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary font-semibold font-label-md text-xs disabled:opacity-50 transition-colors">{geminiSetupSaving ? 'Saving securely...' : 'Save Key & Enable Agent'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Resume & Structured Memory"
        message="Are you sure you want to delete your stored resume and structured competencies? This will clear candidate memory used for autonomous background job scans."
        confirmText="Delete Profile"
        confirmVariant="rose"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
