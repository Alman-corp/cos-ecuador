/**
 * Script para verificar que Sentry captura errores.
 * Uso: npx tsx scripts/verify-sentry.ts
 */

async function verifySentry() {
  console.log('Verifying Sentry integration...\n')

  const DSN = process.env.SENTRY_DSN
  if (!DSN) {
    console.error('SENTRY_DSN not configured')
    process.exit(1)
  }

  console.log('DSN configured')

  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn: DSN,
      environment: process.env.NODE_ENV || 'development',
    })

    console.log('Sending test error...')
    const eventId = Sentry.captureException(new Error('[TEST] Sentry verification error - safe to ignore'))
    console.log(`Error captured. Event ID: ${eventId}`)

    console.log('Sending test message...')
    Sentry.captureMessage('[TEST] Sentry verification message', 'info')
    console.log('Message sent')

    await Sentry.flush(2000)
    console.log('\nVerification complete. Check your Sentry dashboard.')
  } catch (error) {
    console.error('Sentry verification failed:', error)
    process.exit(1)
  }
}

verifySentry()