import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import type { TRPCContext } from './context'

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
      message: error.message,
    }
  },
})

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.auth.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in required' })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

const isAdmin = t.middleware(({ ctx, next }) => {
  const isAdminRole = ctx.clerkUser?.publicMetadata?.role === 'admin'

  if (!isAdminRole) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }

  return next()
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin)
export const middleware = t.middleware
export const mergeRouters = t.mergeRouters
