import { Job, Application, SourceHealth, AppNotification } from '../types';

export const initialJobs: Job[] = [
  {
    id: 'job-101',
    title: 'Senior Full Stack Engineer (AI & Platform)',
    company: 'Nexus AI Labs',
    location: 'San Francisco, CA (Hybrid)',
    source: 'Apify LinkedIn Actor',
    postedDate: '2026-10-24T14:30:00Z',
    matchScore: 94,
    salary: '$165,000 - $195,000 / yr',
    type: 'Full-time',
    experienceLevel: 'Mid-Senior',
    workplaceType: 'Hybrid',
    originalUrl: 'https://linkedin.com/jobs/view/101',
    description: `We are seeking a Senior Full Stack Engineer to lead the architecture of our AI-assisted developer workspace.
Key Responsibilities:
- Design and deploy scalable TypeScript, React, and Express services.
- Integrate Google Gemini models and LLM proxies for real-time document analysis.
- Build high-performance PostgreSQL queries and optimize cloud infrastructure.
- Collaborate with product designers on intuitive SaaS dashboard interfaces.

Requirements:
- 5+ years of production experience with TypeScript, Node.js, and React.
- Solid background in REST/GraphQL API design and database modeling.
- Familiarity with cloud containerization (Docker, Kubernetes) and CI/CD.`,
    skillsRequired: ['TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'Google Gemini', 'Docker'],
    verified: true,
    isStale: false,
    saved: true,
    matchResult: {
      score: 94,
      summary: 'Exceptional alignment with full-stack TypeScript, Express, and cloud architecture experience.',
      matchingEvidence: [
        '6+ years of verified production experience with TypeScript, React, and Express.',
        'Extensive database modeling and REST API design highlighted in resume.',
        'Hands-on experience with Docker, cloud deployments, and CI/CD pipelines.'
      ],
      potentialSkillGaps: [
        'Kubernetes experience is not explicitly mentioned in resume text.'
      ],
      eligibilityWarnings: []
    }
  },
  {
    id: 'job-102',
    title: 'Lead Frontend React Developer',
    company: 'Veloce Cloud Solutions',
    location: 'Remote (US / Canada)',
    source: 'RapidAPI LinkedIn',
    postedDate: '2026-10-23T09:15:00Z',
    matchScore: 89,
    salary: '$150,000 - $180,000 / yr',
    type: 'Full-time',
    experienceLevel: 'Mid-Senior',
    workplaceType: 'Remote',
    originalUrl: 'https://linkedin.com/jobs/view/102',
    description: `Veloce Cloud Solutions is hiring a Lead Frontend Developer to craft next-generation cloud monitoring applications.
Responsibilities:
- Build modular React 19 dashboards with Tailwind CSS and Framer Motion.
- Ensure strict WCAG AA accessibility, performance budget compliance, and responsive UX.
- Work closely with backend teams on WebSockets and REST data streaming.

Requirements:
- Expert proficiency in React, TypeScript, state management, and modern CSS frameworks.
- Strong understanding of browser performance profiling and web vitals.`,
    skillsRequired: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'WebSockets', 'REST APIs'],
    verified: true,
    isStale: false,
    saved: false,
    matchResult: {
      score: 89,
      summary: 'Strong frontend engineering match with React, TypeScript, and Tailwind CSS expertise.',
      matchingEvidence: [
        'Proven expertise in building complex React dashboards and state management.',
        'Strong mastery of modern CSS and responsive UI architecture.'
      ],
      potentialSkillGaps: [
        'Framer Motion / complex animation budget profiling is not explicitly mentioned in resume text.'
      ],
      eligibilityWarnings: []
    }
  },
  {
    id: 'job-103',
    title: 'Backend Systems Engineer (Node.js & Python)',
    company: 'DataPulse Technologies',
    location: 'Austin, TX (Remote)',
    source: 'Greenhouse ATS',
    postedDate: '2026-10-22T16:45:00Z',
    matchScore: 87,
    salary: '$140,000 - $170,000 / yr',
    type: 'Full-time',
    experienceLevel: 'Mid-Senior',
    workplaceType: 'Remote',
    originalUrl: 'https://boards.greenhouse.io/datapulse/jobs/103',
    description: `DataPulse is looking for a Backend Systems Engineer to build high-throughput data processing pipelines.
Requirements:
- Deep expertise in Node.js, Express, and Python microservices.
- Solid experience with relational databases (PostgreSQL/MySQL) and message queues (Redis/RabbitMQ).
- Commitment to high test coverage and clean architecture principles.`,
    skillsRequired: ['Node.js', 'Express', 'Python', 'PostgreSQL', 'Redis', 'Microservices'],
    verified: true,
    isStale: false,
    saved: true,
    matchResult: {
      score: 87,
      summary: 'High backend compatibility with Node.js, Express, Python, and PostgreSQL.',
      matchingEvidence: [
        'Demonstrated track record of building Express microservices and Python backends.',
        'Extensive experience in relational database design and query tuning.'
      ],
      potentialSkillGaps: [
        'Redis and RabbitMQ message queue management not explicitly highlighted in resume.'
      ],
      eligibilityWarnings: []
    }
  },
  {
    id: 'job-104',
    title: 'Senior Staff Software Engineer',
    company: 'Aether Microgrid Systems',
    location: 'Boston, MA (On-site)',
    source: 'Lever ATS',
    postedDate: '2026-10-20T11:00:00Z',
    matchScore: 78,
    salary: '$180,000 - $210,000 / yr',
    type: 'Full-time',
    experienceLevel: 'Director',
    workplaceType: 'On-site',
    originalUrl: 'https://jobs.lever.co/aether/104',
    description: `Lead hardware-adjacent telemetry software development for industrial energy storage devices.
Requires Active US Secret Clearance and 10+ years embedded software systems engineering.`,
    skillsRequired: ['C++', 'Rust', 'Embedded Systems', 'CAN Bus', 'Active Clearance'],
    verified: true,
    isStale: false,
    saved: false,
    matchResult: {
      score: 78,
      summary: 'Moderate general software architecture match, but missing embedded C++/Rust requirements.',
      matchingEvidence: [
        'Strong general software development background and system architecture.'
      ],
      potentialSkillGaps: [
        'Embedded Systems, C++, CAN Bus not found in web resume.',
        '10+ years executive leadership required.'
      ],
      eligibilityWarnings: [
        'Requires active US Secret Clearance.'
      ]
    }
  },
  {
    id: 'job-105',
    title: 'Full Stack AI Developer',
    company: 'Cognitive Dynamics',
    location: 'New York, NY (Hybrid)',
    source: 'Public Jobs Feed',
    postedDate: '2026-10-24T18:00:00Z',
    matchScore: 92,
    salary: '$160,000 - $190,000 / yr',
    type: 'Full-time',
    experienceLevel: 'Mid-Senior',
    workplaceType: 'Hybrid',
    originalUrl: 'https://cognitivedynamics.io/careers/105',
    description: `Cognitive Dynamics is creating autonomous workflow agents.
You will build full-stack interfaces and server-side LLM integrations using Google Gemini API, React, and Python.
Experience with agentic workflows, memory persistence, and webhooks is required.`,
    skillsRequired: ['React', 'TypeScript', 'Python', 'Google Gemini', 'LLMs', 'Express'],
    verified: true,
    isStale: false,
    saved: false,
    matchResult: {
      score: 92,
      summary: 'Outstanding match for AI full stack role utilizing React and Gemini integration.',
      matchingEvidence: [
        'Extensive experience with React, TypeScript, Python, and server-side AI integrations.',
        'Solid background in building REST APIs and asynchronous web services.'
      ],
      potentialSkillGaps: [
        'Vector database benchmarking not explicitly detailed in resume text.'
      ],
      eligibilityWarnings: []
    }
  }
];

export const initialApplications: Application[] = [
  {
    id: 'app-1',
    jobId: 'job-101',
    jobTitle: 'Senior Full Stack Engineer (AI & Platform)',
    company: 'Nexus AI Labs',
    location: 'San Francisco, CA (Hybrid)',
    originalUrl: 'https://linkedin.com/jobs/view/101',
    status: 'Applied',
    appliedDate: '2026-10-18T10:00:00Z', // 7 days ago! Triggers follow-up indicator! (> 5 days in Applied)
    lastUpdatedDate: '2026-10-18T10:00:00Z',
    notes: 'Submitted resume via official portal. Referred by Alex from engineering team.',
    salary: '$175,000 / yr',
    contactPerson: 'Sarah Jenkins (Recruiter)',
    followUpNeeded: true
  },
  {
    id: 'app-2',
    jobId: 'job-103',
    jobTitle: 'Backend Systems Engineer (Node.js & Python)',
    company: 'DataPulse Technologies',
    location: 'Austin, TX (Remote)',
    originalUrl: 'https://boards.greenhouse.io/datapulse/jobs/103',
    status: 'Interview',
    appliedDate: '2026-10-21T14:20:00Z',
    lastUpdatedDate: '2026-10-24T16:00:00Z',
    notes: 'Completed recruiter phone screen. Technical round scheduled for Tuesday.',
    salary: '$160,000 / yr',
    contactPerson: 'David Miller (Engineering Manager)'
  },
  {
    id: 'app-3',
    jobTitle: 'Full Stack Engineer',
    company: 'CloudScale Inc',
    location: 'Remote',
    originalUrl: 'https://cloudscale.io/jobs/fullstack',
    status: 'Applied',
    appliedDate: '2026-10-23T11:00:00Z', // 2 days ago
    lastUpdatedDate: '2026-10-23T11:00:00Z',
    notes: 'Applied through company job board.',
    salary: '$155,000 / yr'
  }
];

export const initialSources: SourceHealth[] = [
  {
    id: 'src-apify',
    name: 'Apify LinkedIn Jobs Actor',
    type: 'Apify LinkedIn Actor',
    status: 'Connected',
    lastCheckTime: '15 minutes ago',
    jobsIndexedCount: 142,
    allowedRefreshInterval: '1 to 24 hours',
    requiresApiKey: true,
    apiKeyName: 'APIFY_API_TOKEN'
  },
  {
    id: 'src-rapidapi',
    name: 'RapidAPI LinkedIn Data API',
    type: 'RapidAPI LinkedIn',
    status: 'Connected',
    lastCheckTime: '30 minutes ago',
    jobsIndexedCount: 98,
    allowedRefreshInterval: '1 to 12 hours',
    requiresApiKey: true,
    apiKeyName: 'RAPIDAPI_KEY'
  },
  {
    id: 'src-public',
    name: 'Public Job Boards & RSS Feeds',
    type: 'Public RSS/ATS',
    status: 'Connected',
    lastCheckTime: '5 minutes ago',
    jobsIndexedCount: 215,
    allowedRefreshInterval: '1 to 6 hours',
    requiresApiKey: false
  },
  {
    id: 'src-ats',
    name: 'Employer ATS Integrations (Greenhouse & Lever)',
    type: 'Direct Employer ATS',
    status: 'Connected',
    lastCheckTime: '1 hour ago',
    jobsIndexedCount: 84,
    allowedRefreshInterval: '2 to 24 hours',
    requiresApiKey: false
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'High Match Job Found',
    message: 'Senior Full Stack Engineer at Nexus AI Labs matches your resume with a 94% estimated fit.',
    timestamp: '2 hours ago',
    read: false,
    type: 'match',
    link: 'job-101'
  },
  {
    id: 'notif-2',
    title: 'Follow-up Recommended',
    message: 'Your application for Senior Full Stack Engineer at Nexus AI Labs was submitted 7 days ago. Consider sending a polite follow-up.',
    timestamp: '5 hours ago',
    read: false,
    type: 'followup'
  },
  {
    id: 'notif-3',
    title: 'Automated Scan Completed',
    message: 'Job discovery scan finished across 4 sources. 14 new listings indexed.',
    timestamp: 'Yesterday',
    read: true,
    type: 'scan'
  }
];
