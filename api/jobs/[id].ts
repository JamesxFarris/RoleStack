import type { VercelRequest, VercelResponse } from '@vercel/node';

// ============ Types ============
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

interface JSearchDetailsResponse {
  status: string;
  data: JSearchJob[];
}

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

// ============ Caching ============
let remotiveCache: { data: RemotiveJob[]; timestamp: number } | null = null;
let arbeitnowCache: { data: ArbeitnowJob[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

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
  return 'Other';
}

function mapEmploymentType(jobType: string): 'full-time' | 'part-time' | 'contract' {
  const type = jobType.toLowerCase();
  if (type.includes('part')) return 'part-time';
  if (type.includes('contract') || type.includes('freelance')) return 'contract';
  return 'full-time';
}

function formatPostedAt(dateString: string | number): string {
  const date = typeof dateString === 'number' ? new Date(dateString * 1000) : new Date(dateString);
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
  const formatNum = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : n.toString();
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

// ============ Fetch Functions ============
async function fetchRemotiveJobs(): Promise<RemotiveJob[]> {
  if (remotiveCache && Date.now() - remotiveCache.timestamp < CACHE_DURATION) {
    return remotiveCache.data;
  }

  const response = await fetch('https://remotive.com/api/remote-jobs?limit=200', {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Remotive API error: ${response.status}`);
  }

  const data: RemotiveResponse = await response.json();
  remotiveCache = { data: data.jobs, timestamp: Date.now() };
  return data.jobs;
}

async function fetchArbeitnowJobs(): Promise<ArbeitnowJob[]> {
  if (arbeitnowCache && Date.now() - arbeitnowCache.timestamp < CACHE_DURATION) {
    return arbeitnowCache.data;
  }

  const response = await fetch('https://www.arbeitnow.com/api/job-board-api', {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Arbeitnow API error: ${response.status}`);
  }

  const data: ArbeitnowResponse = await response.json();
  arbeitnowCache = { data: data.data, timestamp: Date.now() };
  return data.data;
}

async function fetchJSearchJobById(jobId: string): Promise<JSearchJob | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error('RAPIDAPI_KEY not configured');
    return null;
  }

  try {
    const url = `https://jsearch.p.rapidapi.com/job-details?job_id=${encodeURIComponent(jobId)}`;

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status}`);
    }

    const data: JSearchDetailsResponse = await response.json();

    if (data.status !== 'OK' || !data.data || data.data.length === 0) {
      return null;
    }

    return data.data[0];
  } catch (error) {
    console.error('Error fetching from JSearch:', error);
    return null;
  }
}

// ============ Main Handler ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

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

    // Handle Remotive jobs
    if (id.startsWith('remotive-')) {
      const remotiveId = id.replace('remotive-', '');
      const jobs = await fetchRemotiveJobs();
      const job = jobs.find(j => j.id.toString() === remotiveId);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const transformedJob = {
        id: `remotive-${job.id}`,
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
        companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company_name + ' ' + job.title)}`,
        companyLogo: job.company_logo || undefined,
        tags: job.tags || [],
        category: job.category || inferCategory(job.title, job.tags),
        source: 'remotive' as const,
      };

      return res.status(200).json({ job: transformedJob });
    }

    // Handle JSearch jobs
    if (id.startsWith('jsearch-')) {
      const jsearchId = id.replace('jsearch-', '');
      const job = await fetchJSearchJobById(jsearchId);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

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

      const transformedJob = {
        id: `jsearch-${job.job_id}`,
        title: job.job_title,
        company: job.employer_name,
        location,
        workType,
        employmentType: mapEmploymentType(job.job_employment_type),
        seniority: inferSeniority(job.job_title),
        salary: formatSalary(job.job_min_salary, job.job_max_salary, job.job_salary_currency, job.job_salary_period),
        postedAt: formatPostedAt(job.job_posted_at_datetime_utc),
        description: stripHtml(job.job_description),
        requirements: extractRequirements(job.job_description, job.job_highlights),
        benefits: extractBenefits(job.job_description, job.job_highlights),
        applyUrl: job.job_apply_link,
        companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.employer_name + ' ' + job.job_title)}`,
        companyLogo: job.employer_logo || undefined,
        tags: job.job_required_skills || [],
        category: inferCategory(job.job_title, job.job_required_skills || undefined),
        source: 'jsearch' as const,
      };

      return res.status(200).json({ job: transformedJob });
    }

    // Handle Arbeitnow jobs
    if (id.startsWith('arbeitnow-')) {
      const arbeitnowSlug = id.replace('arbeitnow-', '');
      const jobs = await fetchArbeitnowJobs();
      const job = jobs.find(j => j.slug === arbeitnowSlug);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const transformedJob = {
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        location: job.location || (job.remote ? 'Remote' : 'Unknown'),
        workType: job.remote ? 'remote' as const : 'onsite' as const,
        employmentType: mapEmploymentType(job.job_types?.[0] || 'full-time'),
        seniority: inferSeniority(job.title),
        postedAt: formatPostedAt(job.created_at),
        description: stripHtml(job.description),
        requirements: extractRequirements(job.description),
        benefits: extractBenefits(job.description),
        applyUrl: job.url,
        companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company_name + ' ' + job.title)}`,
        tags: job.tags || [],
        category: inferCategory(job.title, job.tags),
        source: 'arbeitnow' as const,
      };

      return res.status(200).json({ job: transformedJob });
    }

    // Handle Adzuna jobs - redirect to apply URL since we can't fetch individual jobs
    if (id.startsWith('adzuna-')) {
      // Adzuna doesn't have a single job endpoint, so we return a not found
      // The job details were already shown from the cached list data
      return res.status(404).json({ error: 'Please use the apply link to view this job' });
    }

    // Legacy ID format - try Remotive first
    const jobs = await fetchRemotiveJobs();
    const job = jobs.find(j => j.id.toString() === id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

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
      companyReviewsUrl: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company_name + ' ' + job.title)}`,
      companyLogo: job.company_logo || undefined,
      tags: job.tags || [],
      category: job.category || inferCategory(job.title, job.tags),
      source: 'remotive' as const,
    };

    return res.status(200).json({ job: transformedJob });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
}
