import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setResumeText(content);
      showToast(`Extracted file content from ${file.name}. Saving & extracting...`, 'info');
      setSaving(true);
      await updateResume(content, file.name, file);
      setSaving(false);
      await promptForGeminiIfMissing();
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateResume(resumeText, resumeName);
    setSaving(false);
    if (resumeText.trim()) await promptForGeminiIfMissing();
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    await reprocessResumeProfile();
    setReprocessing(false);
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(false);
    await deleteResumeProfile();
    setResumeText('');
    setResumeName('No Resume Stored');
  };

  const profile = resume.profile;
  const skills = profile?.skills?.length ? profile.skills : resume.extractedSkills;
  const tools = profile?.technicalTools?.length ? profile.technicalTools : resume.extractedSkills;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Persistent Resume &amp; Profile Memory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured candidate memory used by autonomous background scans to evaluate job compatibility.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReprocess}
            disabled={reprocessing || !resume.text.trim()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Re-extract structured competency profile with Gemini AI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin text-cyan-400' : 'text-violet-400'}`} />
            <span>{reprocessing ? 'Extracting...' : 'Reprocess AI Profile'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !resumeText.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={!resume.text.trim()}
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors disabled:opacity-30"
            title="Delete Stored Profile"
            aria-label="Delete Stored Profile"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security & Memory Status Banner */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="text-white font-semibold">Dual Persistent Memory: </strong>
            Securely synchronized to Row Level Security storage with local durable JSON backup.
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            v{resume.profileVersion || 1}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            {resume.extractionStatus || 'active'}
          </span>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('structured')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'structured'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Structured AI Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'editor'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Resume Text &amp; Upload</span>
        </button>
      </div>

      {activeTab === 'structured' ? (
        <div className="space-y-6">
          {/* Headline & Overview Card with TiltCard 3D response */}
          <TiltCard className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                  Target Candidate Profile
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {profile?.headline || resume.parsedRole || 'Full Stack Software Engineer'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs font-semibold">
                  {profile?.yearsOfExperienceTotal ? `${profile.yearsOfExperienceTotal}+ Years Experience` : 'Demonstrated Experience'}
                </span>
              </div>
            </div>

            {profile?.domains && profile.domains.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Domain Focus:</span>
                {profile.domains.map((dom, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px]"
                  >
                    {dom}
                  </span>
                ))}
              </div>
            )}
          </TiltCard>

          {/* Core Competencies & Skills */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Extracted Core Competencies</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {skills.length} competencies identified
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-xl bg-violet-950/40 border border-violet-500/30 text-violet-200 text-xs font-medium hover:border-violet-400/50 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Technical Tools & Frameworks */}
          {tools && tools.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Technical Tools, Languages &amp; Infrastructure</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs hover:border-cyan-500/40 transition-colors"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Demonstrated Work Experience</span>
            </h3>

            {profile?.experience && profile.experience.length > 0 ? (
              <div className="space-y-4">
                {profile.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-bold text-white text-sm">{exp.jobTitle}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{exp.duration || (exp.yearsOfExperience ? `${exp.yearsOfExperience} years` : 'Documented')}</span>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-violet-400">{exp.company}</div>
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="space-y-1.5 pt-1 pl-1">
                        {exp.responsibilities.map((resp, rIdx) => (
                          <li key={rIdx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-violet-400 font-bold">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Experience details extracted from resume text will appear here.
              </p>
            )}
          </div>

          {/* Education & Qualifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Education */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span>Education &amp; Academic Degrees</span>
              </h3>
              {profile?.education && profile.education.length > 0 ? (
                <div className="space-y-2.5">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="font-semibold text-white">{edu.degree}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{edu.institution}</div>
                      {edu.graduationYear && (
                        <div className="text-slate-500 text-[10px] mt-0.5">Class of {edu.graduationYear}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No formal degree explicitly listed in resume.</p>
              )}
            </div>

            {/* Certifications */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Certifications &amp; Credentials</span>
              </h3>
              {profile?.certifications && profile.certifications.length > 0 ? (
                <div className="space-y-2">
                  {profile.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2 text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Certifications explicitly mentioned in resume will appear here.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Drag & Drop File Upload Box */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-700/80 hover:border-violet-500/50 transition-colors text-center space-y-3">
            <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
            <div className="text-xs text-slate-200">
              <label className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer underline">
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
            <p className="text-[11px] text-slate-500">
              Currently active: <span className="text-slate-300 font-medium">{resume.name}</span> (Updated {new Date(resume.lastUpdated).toLocaleDateString()})
            </p>
          </div>

          {/* Resume Content Text Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">Resume Plain Text Content</label>
              <span className="text-slate-500 font-mono text-[11px]">{resumeText.length} characters</span>
            </div>
            <textarea
              rows={14}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-700/80 rounded-2xl text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-violet-500 resize-y"
            />
          </div>
        </div>
      )}

      {geminiSetupOpen && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="gemini-setup-title" className="w-full max-w-lg rounded-2xl border border-violet-500/40 bg-[#0B0F19] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center"><Sparkles className="w-5 h-5 text-violet-300" /></div>
              <div>
                <h3 id="gemini-setup-title" className="text-lg font-bold text-white">Connect Gemini to activate your AI agent</h3>
                <p className="text-xs text-slate-400 mt-1">Your resume is saved. Add your own Google Gemini API key for profile extraction, job matching and scheduled AI scoring.</p>
              </div>
            </div>
            <label className="block text-xs font-medium text-slate-300">Gemini API key</label>
            <input type="password" autoComplete="new-password" value={geminiSetupKey} onChange={(e) => setGeminiSetupKey(e.target.value)} placeholder="Paste Gemini API key" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-violet-500" />
            <p className="text-[11px] text-slate-500">Key is encrypted on the backend and never sent back to the browser. Do not paste it into chat or GitHub. Model fallbacks cannot bypass project-wide quota exhaustion.</p>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" onClick={() => setGeminiSetupOpen(false)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800">Later</button>
              <button type="button" onClick={handleSaveGeminiSetupKey} disabled={geminiSetupSaving || !geminiSetupKey.trim()} className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold disabled:opacity-50">{geminiSetupSaving ? 'Saving securely...' : 'Save Key & Enable Agent'}</button>
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
