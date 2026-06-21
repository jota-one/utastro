type Attachment = {
  name: string
  content: string
  type: string
}

export const sendEmail = async ({
  subject,
  htmlBody,
  to,
  attachments = [],
}: {
  subject: string
  htmlBody: string
  to: { email: string; name?: string }
  attachments?: Attachment[]
}): Promise<void> => {
  const res = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: process.env.SECRETS_MANDRILL_API_KEY,
      message: {
        html: htmlBody,
        subject,
        from_email: 'noreply@urban-training.ch',
        from_name: 'Urban Training',
        to: [{ email: to.email, name: to.name || to.email, type: 'to' }],
        attachments: attachments.map(a => ({
          type: a.type || 'application/octet-stream',
          name: a.name,
          content: a.content,
        })),
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Mandrill error: ${res.status} ${res.statusText}`)
  }
}
