import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

interface RemotiveResponse {
  'job-count': number;
  jobs: RemotiveJob[];
}

// Cache for all jobs
let cache: { data: RemotiveJob[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function inferSeniority(title: string): 'entry' | 'mid' | 'senior' {
  const lowerTitle = title.toLowerCase();
  if (
    lowerTitle.includes('senior') ||
    lowerTitle.includes('lead') ||
    lowerTitle.includes('principal') ||
    lowerTitle.includes('staff') ||
    lowerTitle.includes('architect') ||
    lowerTitle.includes('head of') ||
    lowerTitle.includes('director') ||
    lowerTitle.includes('manager')
  ) {
    return 'senior';
  }
  if (
    lowerTitle.includes('junior') ||
    lowerTitle.includes('entry') ||
    lowerTitle.includes('intern') ||
    lowerTitle.includes('associate')
  ) {
    return 'entry';
  }
  return 'mid';
}

function mapEmploymentType(jobType: string): 'full-time' | 'part-time' | 'contract' {
  const type = jobType.toLowerCase();
  if (type.includes('part')) return 'part-time';
  if (type.includes('contract') || type.includes('freelance')) return 'contract';
  return 'full-time';
}

function formatPostedAt(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractRequirements(description: string): string[] {
  const cleanDesc = stripHtml(description);
  const requirements: string[] = [];
  const lines = cleanDesc.split(/[.!?]/).filter(line => {
    const lower = line.toLowerCase();
    return (
      lower.includes('experience') ||
      lower.includes('knowledge') ||
      lower.includes('proficient') ||
      lower.includes('degree') ||
      lower.includes('years') ||
      lower.includes('skill')
    );
  });
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (trimmed.length > 20 && trimmed.length < 200) {
      requirements.push(trimmed);
    }
  }
  if (requirements.length === 0) {
    return ['See full job description for requirements'];
  }
  return requirements;
}

function extractBenefits(description: string): string[] {
  const cleanDesc = stripHtml(description);
  const benefits: string[] = ['Remote work'];
  const lines = cleanDesc.split(/[.!?]/).filter(line => {
    const lower = line.toLowerCase();
    return (
      lower.includes('benefit') ||
      lower.includes('insurance') ||
      lower.includes('pto') ||
      lower.includes('vacation') ||
      lower.includes('401k') ||
      lower.includes('equity') ||
      lower.includes('stock')
    );
  });
  for (const line of lines.slice(0, 4)) {
    const trimmed = line.trim();
    if (trimmed.length > 10 && trimmed.length < 150) {
      benefits.push(trimmed);
    }
  }
  return benefits;
}

async function fetchAllJobs(): Promise<RemotiveJob[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  const response = await fetch('https://remotive.com/api/remote-jobs', {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Remotive API error: ${response.status}`);
  }

  const data: RemotiveResponse = await response.json();
  cache = { data: data.jobs, timestamp: Date.now() };
  return data.jobs;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const jobs = await fetchAllJobs();
    const job = jobs.find(j => j.id.toString() === id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Transform to our format with full description
    const transformedJob = {
      id: job.id.toString(),
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      workType: 'remote' as const,
      employmentType: mapEmploymentType(job.job_type),
      seniority: inferSeniority(job.title),
      salary: job.salary || undefined,
      postedAt: formatPostedAt(job.publication_date),
      description: stripHtml(job.description),
      requirements: extractRequirements(job.description),
      benefits: extractBenefits(job.description),
      applyUrl: job.url,
      companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company_name)}`,
      companyLogo: job.company_logo || undefined,
      tags: job.tags || [],
    };

    return res.status(200).json({ job: transformedJob });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
}
