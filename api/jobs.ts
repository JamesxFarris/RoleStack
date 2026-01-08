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
  source: 'remotive' | 'jsearch';
}

// ============ Remotive API Types ============
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

// ============ JSearch API Types ============
interface JSearchJob {
  job_id: string;
  employer_name: string;
  employer_logo: string | null;
  job_title: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_employment_type: string;
  job_is_remote: boolean;
  job_posted_at_datetime_utc: string;
  job_description: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_apply_link: string;
  job_required_skills: string[] | null;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
}

interface JSearchResponse {
  status: string;
  data: JSearchJob[];
}

// ============ Caching ============
let remotiveCache: { data: JobListing[]; timestamp: number } | null = null;
let jsearchCache: { data: JobListing[]; query: string; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (longer to conserve API calls)

// ============ Helper Functions ============
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

function mapEmploymentType(jobType: string): 'full-time' | 'part-time' | 'contract' {
  const type = jobType.toLowerCase();
  if (type.includes('part') || type.includes('part_time')) return 'part-time';
  if (type.includes('contract') || type.includes('freelance') || type.includes('contractor')) return 'contract';
  return 'full-time';
}

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

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&bull;/g, '•')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractRequirements(description: string, highlights?: { Qualifications?: string[] }): string[] {
  // Use highlights if available (JSearch provides these)
  if (highlights?.Qualifications && highlights.Qualifications.length > 0) {
    return highlights.Qualifications.slice(0, 5);
  }

  const cleanDesc = stripHtml(description);
  const requirements: string[] = [];
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

  for (const line of lines.slice(0, 4)) {
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

function extractBenefits(highlights?: { Benefits?: string[] }): string[] {
  if (highlights?.Benefits && highlights.Benefits.length > 0) {
    return highlights.Benefits.slice(0, 5);
  }
  return ['See job posting for full benefits'];
}

function formatSalary(min: number | null, max: number | null, currency: string | null, period: string | null): string | undefined {
  if (!min && !max) return undefined;

  const curr = currency || 'USD';
  const formatNum = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return n.toString();
  };

  let salary = '';
  if (min && max) {
    salary = `$${formatNum(min)} - $${formatNum(max)}`;
  } else if (min) {
    salary = `$${formatNum(min)}+`;
  } else if (max) {
    salary = `Up to $${formatNum(max)}`;
  }

  if (period && period.toLowerCase() === 'hour') {
    salary += '/hr';
  }

  return salary || undefined;
}

// ============ Transform Functions ============
function transformRemotiveJob(job: RemotiveJob): JobListing {
  return {
    id: `remotive-${job.id}`,
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || 'Remote',
    workType: 'remote',
    employmentType: mapEmploymentType(job.job_type),
    seniority: inferSeniority(job.title),
    salary: job.salary || undefined,
    postedAt: formatPostedAt(job.publication_date),
    description: stripHtml(job.description).slice(0, 500) + '...',
    requirements: extractRequirements(job.description),
    benefits: ['Remote work', 'See job posting for full benefits'],
    applyUrl: job.url,
    companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company_name + ' ' + job.title)}`,
    companyLogo: job.company_logo || undefined,
    tags: job.tags || [],
    source: 'remotive',
  };
}

function transformJSearchJob(job: JSearchJob): JobListing {
  // Determine work type
  let workType: 'remote' | 'hybrid' | 'onsite' = 'onsite';
  if (job.job_is_remote) {
    workType = 'remote';
  } else if (job.job_title.toLowerCase().includes('hybrid') ||
             job.job_description.toLowerCase().includes('hybrid')) {
    workType = 'hybrid';
  }

  // Build location string
  let location = 'United States';
  if (job.job_city && job.job_state) {
    location = `${job.job_city}, ${job.job_state}`;
  } else if (job.job_state) {
    location = job.job_state;
  } else if (job.job_country) {
    location = job.job_country;
  }
  if (job.job_is_remote) {
    location = location ? `${location} (Remote)` : 'Remote';
  }

  return {
    id: `jsearch-${job.job_id}`,
    title: job.job_title,
    company: job.employer_name,
    location,
    workType,
    employmentType: mapEmploymentType(job.job_employment_type),
    seniority: inferSeniority(job.job_title),
    salary: formatSalary(job.job_min_salary, job.job_max_salary, job.job_salary_currency, job.job_salary_period),
    postedAt: formatPostedAt(job.job_posted_at_datetime_utc),
    description: stripHtml(job.job_description).slice(0, 500) + '...',
    requirements: extractRequirements(job.job_description, job.job_highlights),
    benefits: extractBenefits(job.job_highlights),
    applyUrl: job.job_apply_link,
    companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.employer_name + ' ' + job.job_title)}`,
    companyLogo: job.employer_logo || undefined,
    tags: job.job_required_skills || [],
    source: 'jsearch',
  };
}

// ============ API Fetch Functions ============
async function fetchRemotiveJobs(): Promise<JobListing[]> {
  if (remotiveCache && Date.now() - remotiveCache.timestamp < CACHE_DURATION) {
    return remotiveCache.data;
  }

  try {
    const response = await fetch('https://remotive.com/api/remote-jobs?limit=50', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data: RemotiveResponse = await response.json();
    const jobs = data.jobs.slice(0, 50).map(transformRemotiveJob);
    remotiveCache = { data: jobs, timestamp: Date.now() };
    return jobs;
  } catch (error) {
    console.error('Error fetching from Remotive:', error);
    if (remotiveCache) return remotiveCache.data;
    return [];
  }
}

async function fetchJSearchJobs(query: string = 'software developer'): Promise<JobListing[]> {
  // Check cache - reuse if same query and not expired
  if (jsearchCache &&
      jsearchCache.query === query &&
      Date.now() - jsearchCache.timestamp < CACHE_DURATION) {
    return jsearchCache.data;
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error('RAPIDAPI_KEY not configured');
    return [];
  }

  try {
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1&date_posted=month`;

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status}`);
    }

    const data: JSearchResponse = await response.json();

    if (data.status !== 'OK' || !data.data) {
      return jsearchCache?.data || [];
    }

    const jobs = data.data.map(transformJSearchJob);
    jsearchCache = { data: jobs, query, timestamp: Date.now() };
    return jobs;
  } catch (error) {
    console.error('Error fetching from JSearch:', error);
    if (jsearchCache) return jsearchCache.data;
    return [];
  }
}

// ============ Main Handler ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const {
      q,
      location,
      workType,
      employmentType,
      seniority,
    } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;

    // Fetch from both APIs in parallel
    const [remotiveJobs, jsearchJobs] = await Promise.all([
      fetchRemotiveJobs(),
      fetchJSearchJobs(searchQuery || 'software developer USA'),
    ]);

    // Combine results
    let allJobs = [...remotiveJobs, ...jsearchJobs];

    // Apply search filter (for Remotive which doesn't support search in API)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allJobs = allJobs.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply location filter
    if (location && typeof location === 'string') {
      const loc = location.toLowerCase();
      allJobs = allJobs.filter(job =>
        job.location.toLowerCase().includes(loc)
      );
    }

    // Apply work type filter
    if (workType && workType !== 'all' && typeof workType === 'string') {
      allJobs = allJobs.filter(job => job.workType === workType);
    }

    // Apply employment type filter
    if (employmentType && employmentType !== 'all' && typeof employmentType === 'string') {
      allJobs = allJobs.filter(job => job.employmentType === employmentType);
    }

    // Apply seniority filter
    if (seniority && seniority !== 'all' && typeof seniority === 'string') {
      allJobs = allJobs.filter(job => job.seniority === seniority);
    }

    // Sort by date (most recent first) and limit
    allJobs.sort((a, b) => {
      const aDate = a.postedAt.includes('Today') ? 0 :
                    a.postedAt.includes('day') ? parseInt(a.postedAt) : 100;
      const bDate = b.postedAt.includes('Today') ? 0 :
                    b.postedAt.includes('day') ? parseInt(b.postedAt) : 100;
      return aDate - bDate;
    });

    const limitedJobs = allJobs.slice(0, 50);

    return res.status(200).json({
      jobs: limitedJobs,
      total: limitedJobs.length,
      sources: {
        remotive: remotiveJobs.length,
        jsearch: jsearchJobs.length,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch jobs',
      jobs: [],
      total: 0,
    });
  }
}
