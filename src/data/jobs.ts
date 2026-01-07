export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  employmentType: 'full-time' | 'part-time' | 'contract';
  salary?: string;
  postedAt: string;
  description: string;
  requirements: string[];
  benefits: string[];
  applyUrl: string;
  companyReviewsUrl: string;
}

export const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "TechFlow Solutions",
    location: "San Francisco, CA",
    workType: "remote",
    employmentType: "full-time",
    salary: "$150,000 - $200,000",
    postedAt: "2 days ago",
    description: "We are looking for a Senior Frontend Engineer to join our growing team. You will be responsible for building and maintaining our customer-facing web applications using modern technologies like React, TypeScript, and GraphQL.",
    requirements: [
      "5+ years of experience with React and TypeScript",
      "Strong understanding of web performance optimization",
      "Experience with state management solutions",
      "Excellent communication skills"
    ],
    benefits: [
      "Competitive salary and equity",
      "Unlimited PTO",
      "Health, dental, and vision insurance",
      "Remote-first culture"
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
    salary: "$120,000 - $160,000",
    postedAt: "1 week ago",
    description: "Join our innovative team building the next generation of data analytics tools. You will work across the entire stack, from React frontends to Node.js backends and PostgreSQL databases.",
    requirements: [
      "3+ years of full stack development experience",
      "Proficiency in React and Node.js",
      "Experience with SQL databases",
      "Knowledge of REST APIs and microservices"
    ],
    benefits: [
      "Flexible hybrid schedule (2 days in office)",
      "401(k) matching",
      "Professional development budget",
      "Gym membership"
    ],
    applyUrl: "https://example.com/apply/datapulse-fullstack",
    companyReviewsUrl: "https://example.com/reviews/datapulse"
  },
  {
    id: "3",
    title: "React Native Developer",
    company: "MobileFirst Labs",
    location: "Austin, TX",
    workType: "onsite",
    employmentType: "full-time",
    salary: "$110,000 - $140,000",
    postedAt: "3 days ago",
    description: "We are seeking a talented React Native developer to help us build beautiful, performant mobile applications for iOS and Android. You will collaborate closely with designers and backend engineers.",
    requirements: [
      "2+ years of React Native experience",
      "Published apps on App Store or Play Store",
      "Understanding of mobile UI/UX best practices",
      "Experience with native modules is a plus"
    ],
    benefits: [
      "Modern downtown office",
      "Catered lunches",
      "Health insurance",
      "Stock options"
    ],
    applyUrl: "https://example.com/apply/mobilefirst-rn",
    companyReviewsUrl: "https://example.com/reviews/mobilefirst"
  },
  {
    id: "4",
    title: "DevOps Engineer",
    company: "CloudScale Systems",
    location: "Seattle, WA",
    workType: "remote",
    employmentType: "full-time",
    salary: "$140,000 - $180,000",
    postedAt: "5 days ago",
    description: "Help us build and maintain robust, scalable infrastructure on AWS. You will be responsible for CI/CD pipelines, monitoring, security, and helping engineering teams ship faster.",
    requirements: [
      "4+ years of DevOps/SRE experience",
      "Strong AWS expertise (EC2, EKS, Lambda, etc.)",
      "Experience with Terraform or similar IaC tools",
      "Knowledge of Docker and Kubernetes"
    ],
    benefits: [
      "Fully remote with quarterly team meetups",
      "Top-tier health benefits",
      "Learning stipend",
      "Home office budget"
    ],
    applyUrl: "https://example.com/apply/cloudscale-devops",
    companyReviewsUrl: "https://example.com/reviews/cloudscale"
  },
  {
    id: "5",
    title: "UI/UX Designer",
    company: "DesignCraft Studio",
    location: "Los Angeles, CA",
    workType: "hybrid",
    employmentType: "contract",
    salary: "$80 - $100/hour",
    postedAt: "1 day ago",
    description: "We need a skilled UI/UX designer for a 6-month contract working on a major product redesign. You will conduct user research, create wireframes, and deliver high-fidelity designs in Figma.",
    requirements: [
      "5+ years of product design experience",
      "Strong portfolio showcasing web and mobile work",
      "Expert-level Figma skills",
      "Experience with design systems"
    ],
    benefits: [
      "Competitive hourly rate",
      "Flexible hours",
      "Potential for full-time conversion",
      "Creative team environment"
    ],
    applyUrl: "https://example.com/apply/designcraft-uiux",
    companyReviewsUrl: "https://example.com/reviews/designcraft"
  },
  {
    id: "6",
    title: "Backend Engineer (Python)",
    company: "AIVentures",
    location: "Boston, MA",
    workType: "remote",
    employmentType: "full-time",
    salary: "$130,000 - $170,000",
    postedAt: "4 days ago",
    description: "Join our AI startup building cutting-edge machine learning infrastructure. You will design and implement scalable APIs, data pipelines, and services that power our ML platform.",
    requirements: [
      "4+ years of Python development",
      "Experience with FastAPI or Django",
      "Familiarity with ML/AI concepts",
      "Strong background in distributed systems"
    ],
    benefits: [
      "100% remote work",
      "Equity package",
      "Conference attendance",
      "Sabbatical program"
    ],
    applyUrl: "https://example.com/apply/aiventures-backend",
    companyReviewsUrl: "https://example.com/reviews/aiventures"
  },
  {
    id: "7",
    title: "Junior Web Developer",
    company: "GrowthStartup",
    location: "Denver, CO",
    workType: "onsite",
    employmentType: "full-time",
    salary: "$70,000 - $90,000",
    postedAt: "1 week ago",
    description: "Great opportunity for early-career developers! You will learn from senior engineers while contributing to real projects. We use React, Node.js, and MongoDB.",
    requirements: [
      "0-2 years of professional experience",
      "Familiarity with JavaScript and React",
      "Eagerness to learn and grow",
      "Computer Science degree or bootcamp graduate"
    ],
    benefits: [
      "Mentorship program",
      "Learning budget",
      "Health insurance",
      "Team social events"
    ],
    applyUrl: "https://example.com/apply/growthstartup-junior",
    companyReviewsUrl: "https://example.com/reviews/growthstartup"
  },
  {
    id: "8",
    title: "Engineering Manager",
    company: "ScaleUp Tech",
    location: "Chicago, IL",
    workType: "hybrid",
    employmentType: "full-time",
    salary: "$180,000 - $220,000",
    postedAt: "6 days ago",
    description: "Lead a team of 8 engineers building our core platform. You will balance hands-on technical work with people management, hiring, and process improvement.",
    requirements: [
      "7+ years of software engineering experience",
      "2+ years of management experience",
      "Strong technical background in web technologies",
      "Track record of growing and mentoring engineers"
    ],
    benefits: [
      "Executive health plan",
      "Generous equity",
      "Flexible schedule",
      "Leadership coaching"
    ],
    applyUrl: "https://example.com/apply/scaleup-em",
    companyReviewsUrl: "https://example.com/reviews/scaleup"
  }
];
