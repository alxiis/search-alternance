import { CLOSED_STATUSES } from '../data/constants'
import type { FollowUpTask, JobOffer } from '../types'
import { today } from './dates'

/** Relances et entretiens à venir, triés par date. */
export function buildTasks(jobs: JobOffer[]): FollowUpTask[] {
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
  return tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}
