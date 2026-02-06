import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'

/**
 * GET - Get job status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const job = await prisma.startGGImportJob.findUnique({
    where: { id: params.jobId },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(job)
}

/**
 * DELETE - Cancel a running job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.startGGImportJob.update({
    where: { id: params.jobId },
    data: {
      status: 'CANCELLED',
      completedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
