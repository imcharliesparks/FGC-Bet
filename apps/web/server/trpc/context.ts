import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export type TRPCContext = {
  req: Request
  prisma: typeof prisma
  auth: Awaited<ReturnType<typeof auth>>
  clerkUser: Awaited<ReturnType<typeof currentUser>> | null
  user: Awaited<ReturnType<typeof prisma.user.findUnique>> | null
}

/**
  * Build request-scoped context for tRPC.
  * - Auth is optional; protected procedures enforce it.
  * - If a Clerk user exists but no DB row, we create one to mirror requireAuth().
  */
export async function createTRPCContext(opts: { req: Request }): Promise<TRPCContext> {
  const authResult = await auth()
  const clerkUser = authResult.userId ? await currentUser() : null

  let user = null
  if (authResult.userId) {
    user = await prisma.user.findUnique({
      where: { clerkId: authResult.userId },
    })

    if (!user && clerkUser) {
      user = await prisma.user.create({
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
    }
  }

  return {
    req: opts.req,
    prisma,
    auth: authResult,
    clerkUser,
    user,
  }
}
