import type { JobAvailability, JobOffer } from '../types'
import { today } from './dates'

/**
 * État réel d'une annonce : une vérification qui l'a trouvée expirée ou douteuse prime ;
 * sinon, une date limite dépassée suffit à la considérer comme expirée.
 */
export function effectiveAvailability(job: Pick<JobOffer, 'availability' | 'expiresAt'>): JobAvailability {
  if (job.availability === 'expired' || job.availability === 'doubtful') return job.availability
  if (job.expiresAt && job.expiresAt < today()) return 'expired'
  return job.availability
}
