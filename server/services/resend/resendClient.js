import { Resend } from 'resend'

let client

export function getClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY)
  }
  return client
}
