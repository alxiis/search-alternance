import { CLOSED_STATUSES, PROSPECT_WAITING } from '../data/constants'
import type { Company, FollowUpTask, JobOffer } from '../types'
import { today } from './dates'

/** Relances (offres et candidatures spontanées) et entretiens à venir, triés par date. */
export function buildTasks(jobs: JobOffer[], companies: Company[] = []): FollowUpTask[] {
  const now = today()
  const tasks: FollowUpTask[] = []
  for (const job of jobs) {
    if (CLOSED_STATUSES.includes(job.status)) continue
    const { followUpDate, interviewDate } = job.application
    if (followUpDate) {
      tasks.push({ jobId: job.id, kind: 'followup', dueDate: followUpDate, label: 'Relance', overdue: followUpDate < now })
    }
    if (interviewDate && interviewDate >= now) {
      tasks.push({ jobId: job.id, kind: 'interview', dueDate: interviewDate, label: 'Entretien', overdue: false })
    }
  }
  for (const company of companies) {
    if (!PROSPECT_WAITING.includes(company.prospectStatus) || !company.followUpDate) continue
    tasks.push({ companyId: company.id, kind: 'prospect', dueDate: company.followUpDate, label: 'Relance de candidature spontanée', overdue: company.followUpDate < now })
  }
  return tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}
