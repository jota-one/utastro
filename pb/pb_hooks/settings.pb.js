/// <reference path="../pb_data/types.d.ts" />

onBootstrap(e => {
  e.next()

  // DOMAIN is set by the jota-one/infra deployment for every app
  const domain = $os.getenv('DOMAIN')
  const appUrl =
    $os.getenv('PUBLIC_ASTRO_BASE_URI') ||
    (domain ? `https://${domain}` : 'http://localhost:4321')

  const settings = $app.settings()

  settings.meta.appName = 'Urban Training'
  settings.meta.appURL = appUrl
  settings.meta.senderName = 'Urban Training'
  settings.meta.senderAddress = 'administration@urban-training.ch'

  // Only used when no Mandrill key is set (local dev): mails go to Mailpit.
  // With a key, onMailerSend below sends through the Mandrill API instead.
  settings.smtp.enabled = true
  settings.smtp.host = 'localhost'
  settings.smtp.port = 1025
  settings.smtp.username = ''
  settings.smtp.password = ''
  settings.smtp.authMethod = 'PLAIN'
  settings.smtp.tls = false

  settings.batch.enabled = true

  $app.save(settings)
})

// Send every PocketBase mail (account activation, password reset, ...)
// through the Mandrill API, like the coach application form and the legacy
// app. Click and open tracking stay off: the activation and reset links carry
// auth tokens that must not be logged by a third party.
onMailerSend(e => {
  const mandrillKey = $os.getenv('SECRETS_MANDRILL_API_KEY')
  if (!mandrillKey) {
    e.next()
    return
  }

  const message = e.message
  const res = $http.send({
    url: 'https://mandrillapp.com/api/1.0/messages/send',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    timeout: 30,
    body: JSON.stringify({
      key: mandrillKey,
      message: {
        html: message.html,
        text: message.text || undefined,
        subject: message.subject,
        from_email: message.from.address,
        from_name: message.from.name,
        to: message.to.map(recipient => ({
          email: recipient.address,
          name: recipient.name || recipient.address,
          type: 'to',
        })),
        track_clicks: false,
        track_opens: false,
      },
    }),
  })

  const results = Array.isArray(res.json) ? res.json : []
  const failed = results.filter(
    r => r.status === 'rejected' || r.status === 'invalid',
  )
  if (res.statusCode !== 200 || results.length === 0 || failed.length > 0) {
    const detail =
      failed.length > 0 ? JSON.stringify(failed) : toString(res.body)
    $app
      .logger()
      .error('Mandrill send failed', 'status', res.statusCode, 'detail', detail)
    throw new Error(`Mandrill send failed (${res.statusCode})`)
  }
  // e.next() is deliberately not called: the mail is already sent
})

onMailerRecordVerificationSend(e => {
  const firstName = e.record.getString('name').split(' ')[0]
  if (firstName) {
    e.message.html = e.message.html.replace(
      'Bienvenue !',
      `Bienvenue ${firstName} !`,
    )
  }
  e.next()
}, 'ut_users')

onMailerRecordPasswordResetSend(e => {
  const firstName = e.record.getString('name').split(' ')[0]
  if (firstName) {
    e.message.subject = `${firstName} - ${e.message.subject}`
  }
  e.next()
}, 'ut_users')
