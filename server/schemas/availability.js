import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const availabilitySaveSchema = z.object({
  blocked: z.array(z.string().regex(ISO_DATE, 'Date must be YYYY-MM-DD'))
    .max(366, 'Cannot block more than 366 dates at once'),
})
