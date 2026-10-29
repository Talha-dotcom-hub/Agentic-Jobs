import { useCallback, useEffect, useMemo, useState } from 'react';
import { Job } from '../types';

const JOB_QUERY_PARAMETER = 'job';

function getJobIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(JOB_QUERY_PARAMETER);
}

export function useSelectedJob(jobs: Job[], view: string) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(getJobIdFromUrl);
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  const selectJob = useCallback((job: Job) => {
    const url = new URL(window.location.href);
    url.searchParams.set(JOB_QUERY_PARAMETER, job.id);
    window.history.pushState(
      { ...(window.history.state || {}), agenticJobsJobId: job.id },
      '',
      url
    );
    setSelectedJobId(job.id);
    try {
      window.sessionStorage.setItem(`agentic-jobs-scroll-${view}`, String(window.scrollY));
    } catch (error) {
      console.warn('Job section scroll position could not be saved:', error);
    }
  }, [view]);

  const closeJob = useCallback(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has(JOB_QUERY_PARAMETER)) {
      url.searchParams.delete(JOB_QUERY_PARAMETER);
      window.history.replaceState(
        { ...(window.history.state || {}), agenticJobsJobId: null },
        '',
        url
      );
    }
    setSelectedJobId(null);
  }, []);

  useEffect(() => {
    const syncSelectedJob = () => setSelectedJobId(getJobIdFromUrl());
    window.addEventListener('popstate', syncSelectedJob);
    return () => window.removeEventListener('popstate', syncSelectedJob);
  }, []);

  useEffect(() => {
    if (!selectedJobId || !jobs.length) return;
    if (jobs.some((job) => job.id === selectedJobId)) return;
    closeJob();
  }, [closeJob, jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJob) return;
    try {
      const key = `agentic-jobs-scroll-${view}`;
      const savedScrollY = window.sessionStorage.getItem(key);
      if (savedScrollY !== null) {
        window.sessionStorage.removeItem(key);
        const scrollY = Number(savedScrollY);
        if (Number.isFinite(scrollY)) window.scrollTo(0, scrollY);
      }
    } catch (error) {
      console.warn('Job section scroll position could not be restored:', error);
    }
  }, [selectedJob, view]);

  return { selectedJob, selectJob, closeJob };
}
