import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

/**
 * Get the current authenticated user from the database
 * Returns null if user is not authenticated
 */
export async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  return user
}

/**
 * Require authentication - throws error if user is not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (user) {
    return user
  }

  // If Clerk session exists but DB user is missing (webhook not configured yet), create it on the fly
  const clerkUser = await currentUser()
  if (!clerkUser) {
    throw new Error('Unauthorized - Please sign in')
  }

  const created = await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      username:
        clerkUser.username ||
        clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] ||
        `user_${clerkUser.id.slice(0, 6)}`,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      chipBalance: 10000,
    },
  })

  return created
}

/**
 * Require authentication for page/server components.
 * Redirects to /unauthorized instead of throwing.
 */
export async function requirePageAuth() {
  try {
    return await requireAuth()
  } catch {
    redirect('/unauthorized')
  }
}

/**
 * Require admin role for page/server components.
 * Redirects to /unauthorized instead of throwing.
 */
export async function requirePageAdmin() {
  try {
    await requireAdmin()
  } catch {
    redirect('/unauthorized')
  }
}

/**
 * Check if current user has admin role
 * Admins are identified by role in Clerk public metadata
 */
export async function requireAdmin() {
  const clerkUser = await currentUser()
  const user = await requireAuth()

  // Check if user has admin role in Clerk metadata
  const isAdmin = clerkUser?.publicMetadata?.role === 'admin'

  if (!isAdmin) {
    throw new Error('Admin access required')
  }

  return user
}

/**
 * Check if user is an admin (without throwing error)
 */
export async function isAdmin() {
  try {
    await requireAdmin()
    return true
  } catch {
    return false
  }
}
