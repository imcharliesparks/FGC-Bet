import { Webhook } from 'svix'
import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET to .env')
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', { status: 400 })
  }

  const eventType = evt.type

  // Handle user.created event
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, username, image_url } = evt.data
    const primaryEmail = email_addresses?.[0]?.email_address

    try {
      // Create user with starting chip balance
      await prisma.user.create({
        data: {
          clerkId: id,
          email: primaryEmail || '',
          username: username || primaryEmail?.split('@')[0] || id,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
          chipBalance: 10000, // Starting balance
        },
      })

      console.log(`User created: ${id}`)
    } catch (error) {
      console.error('Error creating user:', error)
      return new Response('Error creating user', { status: 500 })
    }
  }

  // Handle user.updated event
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, username, image_url } = evt.data
    const primaryEmail = email_addresses?.[0]?.email_address

    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail || '',
          username: username || primaryEmail?.split('@')[0] || undefined,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
          updatedAt: new Date(),
        },
      })

      console.log(`User updated: ${id}`)
    } catch (error) {
      console.error('Error updating user:', error)
      return new Response('Error updating user', { status: 500 })
    }
  }

  // Handle user.deleted event
  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Soft delete by removing sensitive data but keeping records for audit
      await prisma.user.update({
        where: { clerkId: id! },
        data: {
          email: `deleted_${id}@deleted.com`,
          username: `deleted_${id}`,
          firstName: null,
          lastName: null,
          imageUrl: null,
        },
      })

      console.log(`User deleted: ${id}`)
    } catch (error) {
      console.error('Error deleting user:', error)
      return new Response('Error deleting user', { status: 500 })
    }
  }

  return new Response('Webhook processed', { status: 200 })
}
