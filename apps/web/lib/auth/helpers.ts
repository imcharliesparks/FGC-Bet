import { auth, currentUser } from '@clerk/nextjs/server'
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

  if (!user) {
    throw new Error('Unauthorized - Please sign in')
  }

  return user
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
