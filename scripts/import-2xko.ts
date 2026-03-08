#!/usr/bin/env bun
import { MassImportService } from '../apps/web/lib/startgg/mass-import'
import {
  TWOXKO_IMPORT_START_DATE,
  TWOXKO_VIDEOGAME_NAME,
} from '../apps/web/lib/startgg/constants'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

async function main() {
  const apiKey = process.env.STARTGG_API_KEY

  if (!apiKey) {
    console.error('Error: STARTGG_API_KEY environment variable is required')
    console.error('')
    console.error('Set it with:')
    console.error('  export STARTGG_API_KEY=your_api_key')
    process.exit(1)
  }

  console.log('')
  console.log('============================================================')
  console.log('           2XKO Tournament Mass Import')
  console.log('============================================================')
  console.log(
    `  Start Date: ${TWOXKO_IMPORT_START_DATE.toISOString().split('T')[0]}`
  )
  console.log('  Source: start.gg API')
  console.log('============================================================')
  console.log('')

  const service = new MassImportService(apiKey, {
    startDate: TWOXKO_IMPORT_START_DATE,
    videogameName: TWOXKO_VIDEOGAME_NAME,
  })

  const startTime = Date.now()

  process.on('SIGINT', () => {
    console.log('\n')
    console.log('Cancelling import... Please wait.')
    service.cancel()
  })

  let lastPhase = ''
  const progressInterval = setInterval(() => {
    const progress = service.getProgress()

    if (progress.phase !== lastPhase) {
      console.log('')
      console.log(`--- Phase: ${progress.phase.toUpperCase()} ---`)
      lastPhase = progress.phase
    }

    type PhaseKey = 'tournaments' | 'events' | 'sets' | 'participants'
    const phaseKey = progress.phase as PhaseKey
    const totalKey = `total${capitalize(phaseKey)}` as keyof typeof progress
    const processedKey = `processed${capitalize(phaseKey)}` as keyof typeof progress

    const total = (progress[totalKey] as number) || 0
    const processed = (progress[processedKey] as number) || 0
    const percent = total > 0 ? Math.round((processed / total) * 100) : 0

    const barWidth = 40
    const filled = Math.floor((percent / 100) * barWidth)
    const bar = '#'.repeat(filled) + '-'.repeat(barWidth - filled)

    const currentItem = progress.currentItem.slice(0, 35).padEnd(35)
    const elapsed = formatDuration(Date.now() - startTime)

    process.stdout.write(
      `\r  [${bar}] ${percent.toString().padStart(3)}% | ${processed}/${total} | ${currentItem} | ${elapsed}`
    )
  }, 500)

  try {
    const result = await service.run()
    clearInterval(progressInterval)

    console.log('\n')
    console.log('============================================================')
    console.log('                    Import Complete')
    console.log('============================================================')
    console.log(`  Tournaments:   ${result.processedTournaments}`)
    console.log(`  Events:        ${result.processedEvents}`)
    console.log(`  Sets:          ${result.processedSets}`)
    console.log(`  Participants:  ${result.processedParticipants}`)
    console.log(`  Errors:        ${result.errorCount}`)
    console.log(`  Duration:      ${formatDuration(Date.now() - startTime)}`)
    console.log('============================================================')
    console.log('')

    if (result.errorCount > 0) {
      console.log('Recent errors:')
      result.recentErrors.slice(0, 5).forEach((err) => {
        console.log(`  * ${err.item}: ${err.message}`)
      })
      console.log('')
    }
  } catch (error) {
    clearInterval(progressInterval)
    console.error('\n')
    console.error('============================================================')
    console.error('                    Import Failed')
    console.error('============================================================')
    console.error('')
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
