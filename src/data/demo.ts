import type { ClaudeAnalysis, Company, JobOffer, JobStatus, SearchCriteria } from '../types'
import { emptyAnalysis, emptyCompany, emptyCriteria, emptyJob } from '../lib/factories'
import { addDays, today } from '../utils/dates'

interface DemoCompany {
  name: string
  sector: string
  location: string
  website: string
  description: string
}

const COMPANIES: DemoCompany[] = [
  { name: 'Nébula Systèmes', sector: 'Logiciels SaaS', location: 'Toulouse', website: 'https://nebula-systemes.example', description: 'Éditeur fictif de logiciels de gestion pour PME.' },
  { name: 'Aéroweb Studio', sector: 'Agence web', location: 'Blagnac', website: 'https://aeroweb-studio.example', description: 'Agence fictive spécialisée dans les sites e-commerce.' },
  { name: 'DataGaronne', sector: 'Data / IA', location: 'Toulouse', website: 'https://datagaronne.example', description: 'Société fictive de conseil en data et machine learning.' },
  { name: 'Pixel & Co', sector: 'Jeu vidéo', location: 'Labège', website: 'https://pixelandco.example', description: 'Studio indépendant fictif de jeux mobiles.' },
  { name: 'Occitanie Cloud', sector: 'Hébergement / Cloud', location: 'Montpellier', website: 'https://occitanie-cloud.example', description: 'Hébergeur fictif de solutions cloud souveraines.' },
]

interface DemoJob {
  company: number
  title: string
  status: JobStatus
  score: number | null
  skills: string[]
  daysAgo: number
  followInDays?: number
  interviewInDays?: number
  applied?: number
  location?: string
}

const JOBS: DemoJob[] = [
  { company: 0, title: 'Alternant développeur web full-stack', status: 'applied', score: 88, skills: ['React', 'TypeScript', 'Node.js'], daysAgo: 12, applied: 8, followInDays: -1 },
  { company: 0, title: 'Alternant DevOps', status: 'to_apply', score: 61, skills: ['Docker', 'CI/CD', 'Linux'], daysAgo: 4 },
  { company: 1, title: 'Alternant développeur front-end', status: 'interview', score: 92, skills: ['React', 'Tailwind CSS', 'Figma'], daysAgo: 20, applied: 15, interviewInDays: 3 },
  { company: 1, title: 'Alternant intégrateur web', status: 'prepared', score: 79, skills: ['HTML', 'CSS', 'JavaScript'], daysAgo: 6 },
  { company: 2, title: 'Alternant data analyst', status: 'followup', score: 73, skills: ['Python', 'SQL', 'Power BI'], daysAgo: 18, applied: 11, followInDays: 0 },
  { company: 2, title: 'Alternant ingénieur machine learning', status: 'to_analyze', score: null, skills: ['Python', 'scikit-learn'], daysAgo: 1 },
  { company: 3, title: 'Alternant développeur Unity', status: 'rejected', score: 54, skills: ['C#', 'Unity'], daysAgo: 30, applied: 25 },
  { company: 3, title: 'Alternant développeur gameplay', status: 'archived', score: 48, skills: ['C++', 'Unreal Engine'], daysAgo: 40 },
  { company: 4, title: 'Alternant administrateur systèmes et réseaux', status: 'second_interview', score: 84, skills: ['Linux', 'Ansible', 'Kubernetes'], daysAgo: 35, applied: 28, interviewInDays: 6, location: 'Montpellier' },
  { company: 4, title: 'Alternant développeur Python backend', status: 'accepted', score: 95, skills: ['Python', 'FastAPI', 'PostgreSQL'], daysAgo: 50, applied: 44 },
]

function demoAnalysis(score: number, skills: string[]): ClaudeAnalysis {
  return {
    ...emptyAnalysis(),
    compatibilityScore: score,
    scoreExplanation: `Exemple de données de démonstration : le score de ${score} reflète la proximité entre les compétences du profil et les technologies demandées (${skills.join(', ')}).`,
    matchingSkills: skills.slice(0, 2),
    missingSkills: skills.slice(2),
    strengths: ['Projets personnels pertinents', 'Motivation pour le rythme alternant'],
    weaknesses: ['Expérience professionnelle limitée'],
    keyPoints: ['Mettre en avant les projets techniques'],
    applicationArguments: ['Un projet concret utilisant la même stack'],
    recommendation: 'Postuler en personnalisant la lettre.',
  }
}

export interface DemoData {
  companies: Company[]
  jobs: JobOffer[]
  criteria: SearchCriteria[]
}

export function buildDemoData(): DemoData {
  const now = today()
  const companies = COMPANIES.map((c) => ({
    ...emptyCompany(c.name),
    sector: c.sector,
    location: c.location,
    website: c.website,
    careersUrl: `${c.website}/carrieres`,
    description: c.description,
    notes: 'Entreprise fictive (données de démonstration).',
  }))

  const jobs = JOBS.map((d, i) => {
    const company = companies[d.company]
    const job = emptyJob(`https://jobs.example/offres/${i + 1}?utm_source=demo`)
    return {
      ...job,
      companyId: company?.id ?? null,
      title: d.title,
      location: d.location ?? company?.location ?? '',
      contractType: 'Alternance',
      description: `Offre fictive : ${d.title}.`,
      skills: d.skills,
      source: 'Démonstration',
      discoveredAt: addDays(now, -d.daysAgo),
      publishedAt: addDays(now, -d.daysAgo - 2),
      status: d.status,
      compatibilityScore: d.score,
      analysis: d.score === null ? null : demoAnalysis(d.score, d.skills),
      lastActionAt: addDays(now, -Math.min(d.daysAgo, d.applied ? d.applied - 3 : d.daysAgo)),
      application: {
        ...job.application,
        appliedAt: d.applied === undefined ? null : addDays(now, -d.applied),
        followUpDate: d.followInDays === undefined ? null : addDays(now, d.followInDays),
        interviewDate: d.interviewInDays === undefined ? null : addDays(now, d.interviewInDays),
        nextAction: d.followInDays === undefined ? '' : 'Relancer par email',
      },
    }
  })

  const criteria: SearchCriteria = {
    ...emptyCriteria('Exemple : alternance développeur web Toulouse'),
    jobTitle: 'Développeur web',
    keywords: ['React', 'TypeScript', 'full-stack'],
    city: 'Toulouse',
    regions: ['Occitanie'],
    requiredTech: ['JavaScript'],
    preferredTech: ['React', 'Node.js'],
  }
  return { companies, jobs, criteria: [criteria] }
}
