import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  employmentType: 'full-time' | 'part-time' | 'contract';
  seniority: 'entry' | 'mid' | 'senior';
  salary?: string;
  postedAt: string;
  description: string;
  requirements: string[];
  benefits: string[];
  applyUrl: string;
  companyReviewsUrl: string;
}

// For now, return mock data - will be replaced with real API calls
const mockJobs: JobListing[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "TechFlow Solutions",
    location: "San Francisco, CA",
    workType: "remote",
    employmentType: "full-time",
    seniority: "senior",
    salary: "$150,000 - $200,000",
    postedAt: "2 days ago",
    description: "We are looking for a Senior Frontend Engineer to join our growing team.",
    requirements: [
      "5+ years of experience with React and TypeScript",
      "Strong understanding of web performance optimization"
    ],
    benefits: [
      "Competitive salary and equity",
      "Unlimited PTO"
    ],
    applyUrl: "https://example.com/apply/techflow-senior-fe",
    companyReviewsUrl: "https://example.com/reviews/techflow"
  },
  {
    id: "2",
    title: "Full Stack Developer",
    company: "DataPulse Inc",
    location: "New York, NY",
    workType: "hybrid",
    employmentType: "full-time",
    seniority: "mid",
    salary: "$120,000 - $160,000",
    postedAt: "1 week ago",
    description: "Join our innovative team building the next generation of data analytics tools.",
    requirements: [
      "3+ years of full stack development experience",
      "Proficiency in React and Node.js"
    ],
    benefits: [
      "Flexible hybrid schedule",
      "401(k) matching"
    ],
    applyUrl: "https://example.com/apply/datapulse-fullstack",
    companyReviewsUrl: "https://example.com/reviews/datapulse"
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract query parameters for filtering
  const {
    q,           // search query
    location,    // location filter
    workType,    // remote/hybrid/onsite
    employmentType,
    seniority,
    salaryRange
  } = req.query;

  let filteredJobs = [...mockJobs];

  // Apply filters
  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    filteredJobs = filteredJobs.filter(job =>
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query)
    );
  }

  if (location && typeof location === 'string') {
    const loc = location.toLowerCase();
    filteredJobs = filteredJobs.filter(job =>
      job.location.toLowerCase().includes(loc) ||
      (loc.includes('remote') && job.workType === 'remote')
    );
  }

  if (workType && workType !== 'all' && typeof workType === 'string') {
    filteredJobs = filteredJobs.filter(job => job.workType === workType);
  }

  if (employmentType && employmentType !== 'all' && typeof employmentType === 'string') {
    filteredJobs = filteredJobs.filter(job => job.employmentType === employmentType);
  }

  if (seniority && seniority !== 'all' && typeof seniority === 'string') {
    filteredJobs = filteredJobs.filter(job => job.seniority === seniority);
  }

  return res.status(200).json({
    jobs: filteredJobs,
    total: filteredJobs.length,
    source: 'mock' // Will change to 'api' when we add real job APIs
  });
}
