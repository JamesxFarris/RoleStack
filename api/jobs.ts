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
  category?: string;
  source: 'remotive' | 'jsearch' | 'arbeitnow' | 'adzuna';
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

// ============ Arbeitnow API Types ============
interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

// ============ Adzuna API Types ============
interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  contract_time?: string;
  created: string;
  redirect_url: string;
  category: { label: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
}

// ============ Caching ============
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let remotiveCache: CacheEntry<JobListing[]> | null = null;
let jsearchCache: CacheEntry<JobListing[]> | null = null;
let arbeitnowCache: CacheEntry<JobListing[]> | null = null;
let adzunaCache: CacheEntry<JobListing[]> | null = null;

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (conserve API calls)

// Job categories to fetch from JSearch (rotates to spread API usage)
const JOB_CATEGORIES = [
  'software developer',
  'marketing manager',
  'data analyst',
  'product manager',
  'graphic designer',
  'sales representative',
  'financial analyst',
  'human resources',
  'project manager',
  'customer service',
];

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

function inferCategory(title: string, tags?: string[]): string {
  const text = (title + ' ' + (tags?.join(' ') || '')).toLowerCase();
  if (text.match(/software|developer|engineer|programming|coding|frontend|backend|fullstack/)) return 'Technology';
  if (text.match(/marketing|seo|content|social media|brand/)) return 'Marketing';
  if (text.match(/design|ui|ux|graphic|creative/)) return 'Design';
  if (text.match(/sales|business development|account/)) return 'Sales';
  if (text.match(/data|analyst|analytics|scientist/)) return 'Data';
  if (text.match(/product|manager|management/)) return 'Product';
  if (text.match(/finance|accounting|financial/)) return 'Finance';
  if (text.match(/hr|human resources|recruiting|talent/)) return 'HR';
  if (text.match(/customer|support|service/)) return 'Customer Service';
  if (text.match(/healthcare|medical|nurse|doctor/)) return 'Healthcare';
  if (text.match(/legal|lawyer|attorney/)) return 'Legal';
  if (text.match(/education|teacher|instructor/)) return 'Education';
  return 'Other';
}

function mapEmploymentType(jobType: string): 'full-time' | 'part-time' | 'contract' {
  const type = jobType.toLowerCase();
  if (type.includes('part') || type.includes('part_time')) return 'part-time';
  if (type.includes('contract') || type.includes('freelance') || type.includes('contractor')) return 'contract';
  return 'full-time';
}

function formatPostedAt(dateString: string | number): string {
  const date = typeof dateString === 'number' ? new Date(dateString * 1000) : new Date(dateString);
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

function extractBenefits(description: string, highlights?: { Benefits?: string[] }): string[] {
  if (highlights?.Benefits && highlights.Benefits.length > 0) {
    return highlights.Benefits.slice(0, 5);
  }

  const cleanDesc = stripHtml(description).toLowerCase();
  const benefits: string[] = [];

  if (cleanDesc.includes('health insurance') || cleanDesc.includes('medical')) benefits.push('Health Insurance');
  if (cleanDesc.includes('401k') || cleanDesc.includes('retirement')) benefits.push('401(k)');
  if (cleanDesc.includes('pto') || cleanDesc.includes('paid time off') || cleanDesc.includes('vacation')) benefits.push('Paid Time Off');
  if (cleanDesc.includes('remote') || cleanDesc.includes('work from home')) benefits.push('Remote Work');
  if (cleanDesc.includes('equity') || cleanDesc.includes('stock')) benefits.push('Equity/Stock Options');

  if (benefits.length === 0) {
    return ['See job posting for full benefits'];
  }
  return benefits;
}

function formatSalary(min: number | null, max: number | null, currency?: string | null, period?: string | null): string | undefined {
  if (!min && !max) return undefined;

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
    benefits: extractBenefits(job.description),
    applyUrl: job.url,
    companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company_name + ' ' + job.title)}`,
    companyLogo: job.company_logo || undefined,
    tags: job.tags || [],
    category: job.category || inferCategory(job.title, job.tags),
    source: 'remotive',
  };
}

function transformJSearchJob(job: JSearchJob, category?: string): JobListing {
  let workType: 'remote' | 'hybrid' | 'onsite' = 'onsite';
  if (job.job_is_remote) {
    workType = 'remote';
  } else if (job.job_title.toLowerCase().includes('hybrid') ||
             job.job_description.toLowerCase().includes('hybrid')) {
    workType = 'hybrid';
  }

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
    benefits: extractBenefits(job.job_description, job.job_highlights),
    applyUrl: job.job_apply_link,
    companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.employer_name + ' ' + job.job_title)}`,
    companyLogo: job.employer_logo || undefined,
    tags: job.job_required_skills || [],
    category: category || inferCategory(job.job_title, job.job_required_skills || undefined),
    source: 'jsearch',
  };
}

function transformArbeitnowJob(job: ArbeitnowJob): JobListing {
  return {
    id: `arbeitnow-${job.slug}`,
    title: job.title,
    company: job.company_name,
    location: job.location || (job.remote ? 'Remote' : 'Unknown'),
    workType: job.remote ? 'remote' : 'onsite',
    employmentType: mapEmploymentType(job.job_types?.[0] || 'full-time'),
    seniority: inferSeniority(job.title),
    postedAt: formatPostedAt(job.created_at),
    description: stripHtml(job.description).slice(0, 500) + '...',
    requirements: extractRequirements(job.description),
    benefits: extractBenefits(job.description),
    applyUrl: job.url,
    companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company_name + ' ' + job.title)}`,
    tags: job.tags || [],
    category: inferCategory(job.title, job.tags),
    source: 'arbeitnow',
  };
}

function transformAdzunaJob(job: AdzunaJob): JobListing {
  const isRemote = job.title.toLowerCase().includes('remote') ||
                   job.description.toLowerCase().includes('remote');
  const isHybrid = job.title.toLowerCase().includes('hybrid') ||
                   job.description.toLowerCase().includes('hybrid');

  return {
    id: `adzuna-${job.id}`,
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    workType: isRemote ? 'remote' : isHybrid ? 'hybrid' : 'onsite',
    employmentType: mapEmploymentType(job.contract_type || job.contract_time || 'full-time'),
    seniority: inferSeniority(job.title),
    salary: formatSalary(job.salary_min || null, job.salary_max || null),
    postedAt: formatPostedAt(job.created),
    description: stripHtml(job.description).slice(0, 500) + '...',
    requirements: extractRequirements(job.description),
    benefits: extractBenefits(job.description),
    applyUrl: job.redirect_url,
    companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company.display_name + ' ' + job.title)}`,
    category: job.category?.label || inferCategory(job.title),
    source: 'adzuna',
  };
}

// ============ API Fetch Functions ============
async function fetchRemotiveJobs(): Promise<JobListing[]> {
  if (remotiveCache && Date.now() - remotiveCache.timestamp < CACHE_DURATION) {
    return remotiveCache.data;
  }

  try {
    // Fetch more jobs from Remotive (no limit on their API)
    const response = await fetch('https://remotive.com/api/remote-jobs?limit=100', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data: RemotiveResponse = await response.json();
    const jobs = data.jobs.map(transformRemotiveJob);
    remotiveCache = { data: jobs, timestamp: Date.now() };
    return jobs;
  } catch (error) {
    console.error('Error fetching from Remotive:', error);
    if (remotiveCache) return remotiveCache.data;
    return [];
  }
}

async function fetchJSearchJobs(customQuery?: string): Promise<JobListing[]> {
  if (jsearchCache && Date.now() - jsearchCache.timestamp < CACHE_DURATION && !customQuery) {
    return jsearchCache.data;
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error('RAPIDAPI_KEY not configured');
    return [];
  }

  try {
    // If custom query, just fetch that one category
    if (customQuery) {
      const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(customQuery + ' USA')}&page=1&num_pages=2&date_posted=month`;
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      });

      if (!response.ok) throw new Error(`JSearch API error: ${response.status}`);
      const data: JSearchResponse = await response.json();
      if (data.status !== 'OK' || !data.data) return [];
      return data.data.map(job => transformJSearchJob(job, inferCategory(customQuery)));
    }

    // Rotate through categories - pick 2-3 random ones per request to conserve API calls
    const shuffled = [...JOB_CATEGORIES].sort(() => Math.random() - 0.5);
    const selectedCategories = shuffled.slice(0, 3);

    const allJobs: JobListing[] = [];

    for (const category of selectedCategories) {
      try {
        const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(category + ' USA')}&page=1&num_pages=2&date_posted=month`;
        const response = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          },
        });

        if (response.ok) {
          const data: JSearchResponse = await response.json();
          if (data.status === 'OK' && data.data) {
            const jobs = data.data.map(job => transformJSearchJob(job, inferCategory(category)));
            allJobs.push(...jobs);
          }
        }
      } catch (err) {
        console.error(`Error fetching ${category}:`, err);
      }
    }

    // Deduplicate by job ID
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => j.id === job.id)
    );

    jsearchCache = { data: uniqueJobs, timestamp: Date.now() };
    return uniqueJobs;
  } catch (error) {
    console.error('Error fetching from JSearch:', error);
    if (jsearchCache) return jsearchCache.data;
    return [];
  }
}

async function fetchArbeitnowJobs(): Promise<JobListing[]> {
  if (arbeitnowCache && Date.now() - arbeitnowCache.timestamp < CACHE_DURATION) {
    return arbeitnowCache.data;
  }

  try {
    const response = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Arbeitnow API error: ${response.status}`);
    }

    const data: ArbeitnowResponse = await response.json();
    const jobs = data.data.slice(0, 100).map(transformArbeitnowJob);
    arbeitnowCache = { data: jobs, timestamp: Date.now() };
    return jobs;
  } catch (error) {
    console.error('Error fetching from Arbeitnow:', error);
    if (arbeitnowCache) return arbeitnowCache.data;
    return [];
  }
}

async function fetchAdzunaJobs(): Promise<JobListing[]> {
  if (adzunaCache && Date.now() - adzunaCache.timestamp < CACHE_DURATION) {
    return adzunaCache.data;
  }

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    // Adzuna not configured, skip silently
    return [];
  }

  try {
    // Fetch from multiple categories
    const categories = ['it-jobs', 'marketing-jobs', 'sales-jobs', 'healthcare-nursing-jobs'];
    const allJobs: JobListing[] = [];

    for (const category of categories) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=25&what=${category}&max_days_old=30`;
        const response = await fetch(url);

        if (response.ok) {
          const data: AdzunaResponse = await response.json();
          if (data.results) {
            allJobs.push(...data.results.map(transformAdzunaJob));
          }
        }
      } catch (err) {
        console.error(`Error fetching Adzuna ${category}:`, err);
      }
    }

    adzunaCache = { data: allJobs, timestamp: Date.now() };
    return allJobs;
  } catch (error) {
    console.error('Error fetching from Adzuna:', error);
    if (adzunaCache) return adzunaCache.data;
    return [];
  }
}

// ============ Main Handler ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

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
      category,
    } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;

    // Fetch from all APIs in parallel
    const [remotiveJobs, jsearchJobs, arbeitnowJobs, adzunaJobs] = await Promise.all([
      fetchRemotiveJobs(),
      fetchJSearchJobs(searchQuery),
      fetchArbeitnowJobs(),
      fetchAdzunaJobs(),
    ]);

    // Combine all results
    let allJobs = [...remotiveJobs, ...jsearchJobs, ...arbeitnowJobs, ...adzunaJobs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allJobs = allJobs.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
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

    // Apply category filter
    if (category && category !== 'all' && typeof category === 'string') {
      allJobs = allJobs.filter(job =>
        job.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Deduplicate by title + company (cross-source duplicates)
    const seen = new Set<string>();
    allJobs = allJobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date (most recent first)
    allJobs.sort((a, b) => {
      const getScore = (posted: string) => {
        if (posted.includes('Today')) return 0;
        if (posted.includes('1 day')) return 1;
        if (posted.includes('day')) return parseInt(posted) || 7;
        if (posted.includes('week')) return parseInt(posted) * 7 || 14;
        return 100;
      };
      return getScore(a.postedAt) - getScore(b.postedAt);
    });

    // Return more jobs (up to 200)
    const limitedJobs = allJobs.slice(0, 200);

    return res.status(200).json({
      jobs: limitedJobs,
      total: allJobs.length,
      sources: {
        remotive: remotiveJobs.length,
        jsearch: jsearchJobs.length,
        arbeitnow: arbeitnowJobs.length,
        adzuna: adzunaJobs.length,
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
