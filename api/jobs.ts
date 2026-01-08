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
  companyLogo?: string;
  tags?: string[];
}

// Remotive API response types
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

// Simple in-memory cache
let cache: { data: JobListing[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Infer seniority from job title
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
    lowerTitle.includes('vp ') ||
    lowerTitle.includes('manager')
  ) {
    return 'senior';
  }

  if (
    lowerTitle.includes('junior') ||
    lowerTitle.includes('entry') ||
    lowerTitle.includes('intern') ||
    lowerTitle.includes('associate') ||
    lowerTitle.includes('trainee') ||
    lowerTitle.includes('graduate')
  ) {
    return 'entry';
  }

  return 'mid';
}

// Map Remotive job_type to our employmentType
function mapEmploymentType(jobType: string): 'full-time' | 'part-time' | 'contract' {
  const type = jobType.toLowerCase();
  if (type.includes('part') || type.includes('part_time')) return 'part-time';
  if (type.includes('contract') || type.includes('freelance')) return 'contract';
  return 'full-time';
}

// Format date to relative time
function formatPostedAt(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

// Strip HTML tags from description
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

// Extract requirements from description (basic extraction)
function extractRequirements(description: string): string[] {
  const cleanDesc = stripHtml(description);
  const requirements: string[] = [];

  // Look for bullet points or numbered items that might be requirements
  const lines = cleanDesc.split(/[.!?]/).filter(line => {
    const lower = line.toLowerCase();
    return (
      lower.includes('experience') ||
      lower.includes('knowledge') ||
      lower.includes('proficient') ||
      lower.includes('familiar') ||
      lower.includes('degree') ||
      lower.includes('years') ||
      lower.includes('skill')
    );
  });

  // Take first 4 requirement-like sentences
  for (const line of lines.slice(0, 4)) {
    const trimmed = line.trim();
    if (trimmed.length > 20 && trimmed.length < 200) {
      requirements.push(trimmed);
    }
  }

  // Default requirements if none found
  if (requirements.length === 0) {
    return ['See full job description for requirements'];
  }

  return requirements;
}

// Transform Remotive job to our format
function transformJob(job: RemotiveJob): JobListing {
  return {
    id: job.id.toString(),
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || 'Remote',
    workType: 'remote', // Remotive is all remote jobs
    employmentType: mapEmploymentType(job.job_type),
    seniority: inferSeniority(job.title),
    salary: job.salary || undefined,
    postedAt: formatPostedAt(job.publication_date),
    description: stripHtml(job.description).slice(0, 500) + '...',
    requirements: extractRequirements(job.description),
    benefits: ['Remote work', 'See job posting for full benefits'],
    applyUrl: job.url,
    companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company_name)}`,
    companyLogo: job.company_logo || undefined,
    tags: job.tags || [],
  };
}

// Fetch jobs from Remotive API
async function fetchRemotiveJobs(searchQuery?: string): Promise<JobListing[]> {
  // Check cache first
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  try {
    // Build URL with optional search
    let url = 'https://remotive.com/api/remote-jobs';
    if (searchQuery) {
      url += `?search=${encodeURIComponent(searchQuery)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data: RemotiveResponse = await response.json();
    const jobs = data.jobs.map(transformJob);

    // Update cache
    cache = { data: jobs, timestamp: Date.now() };

    return jobs;
  } catch (error) {
    console.error('Error fetching from Remotive:', error);
    // Return cached data if available, even if expired
    if (cache) {
      return cache.data;
    }
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters
    const {
      q,
      location,
      workType,
      employmentType,
      seniority,
    } = req.query;

    // Fetch jobs from Remotive
    const searchQuery = typeof q === 'string' ? q : undefined;
    let jobs = await fetchRemotiveJobs(searchQuery);

    // Apply client-side filters
    if (location && typeof location === 'string') {
      const loc = location.toLowerCase();
      jobs = jobs.filter(job =>
        job.location.toLowerCase().includes(loc)
      );
    }

    // workType filter - Remotive only has remote jobs, so skip if not 'remote' or 'all'
    if (workType && workType !== 'all' && workType !== 'remote') {
      // Return empty since Remotive only has remote jobs
      jobs = [];
    }

    if (employmentType && employmentType !== 'all' && typeof employmentType === 'string') {
      jobs = jobs.filter(job => job.employmentType === employmentType);
    }

    if (seniority && seniority !== 'all' && typeof seniority === 'string') {
      jobs = jobs.filter(job => job.seniority === seniority);
    }

    // Limit results
    const limitedJobs = jobs.slice(0, 50);

    return res.status(200).json({
      jobs: limitedJobs,
      total: limitedJobs.length,
      source: 'remotive',
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch jobs',
      jobs: [],
      total: 0,
      source: 'error',
    });
  }
}
