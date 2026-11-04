import { useCallback, useEffect, useMemo, useState } from 'react';
import { Job } from '../types';

const JOB_QUERY_PARAMETER = 'job';

function getJobIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(JOB_QUERY_PARAMETER);
}

function getScrollKey(view: string): string {
  return `agentic-jobs-scroll-${view}`;
}

export function useSelectedJob(jobs: Job[], view: string) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(getJobIdFromUrl);

  const syncSelectedJobFromUrl = useCallback(() => {
    const nextJobId = getJobIdFromUrl();
    setSelectedJobId((current) => (current === nextJobId ? current : nextJobId));
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  const selectJob = useCallback((job: Job) => {
    const url = new URL(window.location.href);
    const key = getScrollKey(view);
    const currentScrollY = Number.isFinite(window.scrollY) ? window.scrollY : 0;

    if (url.searchParams.get(JOB_QUERY_PARAMETER) !== job.id) {
      url.searchParams.set(JOB_QUERY_PARAMETER, job.id);
      window.history.pushState(
        { ...(window.history.state || {}), agenticJobsJobId: job.id, agenticJobsView: view },
        '',
        url
      );
    }

    setSelectedJobId(job.id);

    try {
      window.sessionStorage.setItem(key, String(currentScrollY));
    } catch (error) {
      console.warn('Job section scroll position could not be saved:', error);
    }
  }, [view]);

  const closeJob = useCallback(() => {
    const url = new URL(window.location.href);
    const key = getScrollKey(view);
    if (url.searchParams.has(JOB_QUERY_PARAMETER)) {
      url.searchParams.delete(JOB_QUERY_PARAMETER);
      window.history.replaceState(
        { ...(window.history.state || {}), agenticJobsJobId: null, agenticJobsView: view },
        '',
        url
      );
    }

    try {
      const savedScrollY = window.sessionStorage.getItem(key);
      if (savedScrollY !== null) {
        const scrollY = Number(savedScrollY);
        if (Number.isFinite(scrollY)) {
          requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }));
        }
      }
    } catch (error) {
      console.warn('Previous job-list scroll position could not be restored:', error);
    }

    setSelectedJobId(null);
  }, [view]);

  useEffect(() => {
    const syncSelectedJob = () => {
      syncSelectedJobFromUrl();
      const key = getScrollKey(view);
      const savedScrollY = window.sessionStorage.getItem(key);
      if (savedScrollY && !getJobIdFromUrl()) {
        const scrollY = Number(savedScrollY);
        if (Number.isFinite(scrollY)) {
          requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }));
        }
      }
    };

    window.addEventListener('popstate', syncSelectedJob);
    return () => window.removeEventListener('popstate', syncSelectedJob);
  }, [syncSelectedJobFromUrl, view]);

  useEffect(() => {
    if (!selectedJobId || !jobs.length) return;
    if (jobs.some((job) => job.id === selectedJobId)) return;
    closeJob();
  }, [closeJob, jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJob) return;
    try {
      const key = getScrollKey(view);
      const savedScrollY = window.sessionStorage.getItem(key);
      if (savedScrollY !== null) {
        window.sessionStorage.removeItem(key);
        const scrollY = Number(savedScrollY);
        if (Number.isFinite(scrollY)) window.scrollTo({ top: scrollY, behavior: 'auto' });
      }
    } catch (error) {
      console.warn('Job section scroll position could not be restored:', error);
    }
  }, [selectedJob, view]);

  return { selectedJob, selectJob, closeJob };
}
