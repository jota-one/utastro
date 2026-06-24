/// <reference path="../pb_data/types.d.ts" />

onBootstrap(e => {
  e.next()

  const mandrillUser = $os.getenv('MANDRILL_USERNAME')
  const mandrillKey = $os.getenv('SECRETS_MANDRILL_API_KEY')
  const appUrl =
    $os.getenv('PUBLIC_ASTRO_BASE_URI') || 'https://www.urban-training.ch'

  const settings = $app.settings()

  settings.meta.appName = 'Urban Training'
  settings.meta.appURL = appUrl
  settings.meta.senderName = 'Urban Training'
  settings.meta.senderAddress = 'no-reply@urban-training.ch'

  if (mandrillUser && mandrillKey) {
    settings.smtp.enabled = true
    settings.smtp.host = 'smtp.mandrillapp.com'
    settings.smtp.port = 587
    settings.smtp.username = mandrillUser
    settings.smtp.password = mandrillKey
    settings.smtp.authMethod = 'PLAIN'
    settings.smtp.tls = false
  } else {
    settings.smtp.enabled = true
    settings.smtp.host = 'localhost'
    settings.smtp.port = 1025
    settings.smtp.username = ''
    settings.smtp.password = ''
    settings.smtp.authMethod = 'PLAIN'
    settings.smtp.tls = false
  }

  settings.batch.enabled = true

  $app.save(settings)
})

onMailerRecordVerificationSend(e => {
  const firstName = e.record.getString('name').split(' ')[0]
  if (firstName) {
    e.message.html = e.message.html.replace('Bienvenue !', `Bienvenue ${firstName} !`)
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
