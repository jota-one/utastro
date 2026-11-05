/// <reference path="../pb_data/types.d.ts" />

routerAdd('POST', '/api/custom/auth/login', e => {
  // Pure JS SHA1 — $security only exposes md5/sha256, and must be defined inside
  // the callback since routerAdd executes in an isolated context.
  function computeSha1(msg) {
    function add32(a, b) {
      return (a + b) & 0xffffffff
    }
    function rotl(n, b) {
      return (n << b) | (n >>> (32 - b))
    }

    const bytes = []
    // UTF-8 encoding, as Node's crypto did for the legacy hashes
    for (let i = 0; i < msg.length; i++) {
      const c = msg.codePointAt(i)
      if (c > 0xffff) {
        // astral character (e.g. emoji): one code point, two UTF-16 units
        bytes.push(
          (c >> 18) | 240,
          ((c >> 12) & 63) | 128,
          ((c >> 6) & 63) | 128,
          (c & 63) | 128,
        )
        i++
      } else if (c < 128) {
        bytes.push(c)
      } else if (c < 2048) {
        bytes.push((c >> 6) | 192, (c & 63) | 128)
      } else {
        bytes.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128)
      }
    }

    const bitLen = bytes.length * 8
    bytes.push(0x80)
    while (bytes.length % 64 !== 56) {
      bytes.push(0)
    }
    bytes.push(
      0,
      0,
      0,
      0,
      (bitLen >>> 24) & 0xff,
      (bitLen >>> 16) & 0xff,
      (bitLen >>> 8) & 0xff,
      bitLen & 0xff,
    )

    let H0 = 0x67452301,
      H1 = 0xefcdab89,
      H2 = 0x98badcfe,
      H3 = 0x10325476,
      H4 = 0xc3d2e1f0

    for (let i = 0; i < bytes.length; i += 64) {
      const W = []
      for (let j = 0; j < 16; j++) {
        W[j] =
          (bytes[i + j * 4] << 24) |
          (bytes[i + j * 4 + 1] << 16) |
          (bytes[i + j * 4 + 2] << 8) |
          bytes[i + j * 4 + 3]
      }
      for (let j = 16; j < 80; j++) {
        W[j] = rotl(W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16], 1)
      }

      let a = H0,
        b = H1,
        c = H2,
        d = H3,
        e = H4

      for (let j = 0; j < 80; j++) {
        let f, k
        if (j < 20) {
          f = (b & c) | (~b & d)
          k = 0x5a827999
        } else if (j < 40) {
          f = b ^ c ^ d
          k = 0x6ed9eba1
        } else if (j < 60) {
          f = (b & c) | (b & d) | (c & d)
          k = 0x8f1bbcdc
        } else {
          f = b ^ c ^ d
          k = 0xca62c1d6
        }

        const temp = add32(add32(rotl(a, 5), f), add32(add32(e, W[j]), k))
        e = d
        d = c
        c = rotl(b, 30)
        b = a
        a = temp
      }

      H0 = add32(H0, a)
      H1 = add32(H1, b)
      H2 = add32(H2, c)
      H3 = add32(H3, d)
      H4 = add32(H4, e)
    }

    return [H0, H1, H2, H3, H4]
      .map(h => ('00000000' + (h >>> 0).toString(16)).slice(-8))
      .join('')
  }

  const body = e.requestInfo().body
  // Accounts are stored in lower case (see users.pb.js); the legacy site
  // ignored the case of the address too
  const email = (body?.email ?? '').trim().toLowerCase()
  const password = body?.password ?? ''

  if (!email || !password) {
    throw new BadRequestError('Email and password are required')
  }

  // The request log does not say who tried: without the address, a member who
  // cannot log in cannot be traced. Never log the password.
  const logRefusal = reason => {
    $app.logger().warn('Login refused', 'email', email, 'reason', reason)
  }

  let record
  try {
    record = $app.findAuthRecordByEmail('ut_users', email)
  } catch {
    logRefusal('unknown address')
    throw new UnauthorizedError('Invalid credentials')
  }

  // Each account stops the guesses on its own, whatever address they come from
  const MAX_FAILURES = 10
  const FAILURES_WINDOW = 15 * 60 * 1000
  const LOCK_DURATION = 15 * 60 * 1000
  const ALERT_INTERVAL = 24 * 60 * 60 * 1000
  const now = Date.now()
  const failuresKey = `ut_login_failures_${record.id}`
  const storedFailures = $app.store().get(failuresKey)
  const failures = storedFailures ? JSON.parse(storedFailures) : null

  if (failures?.lockedUntil > now) {
    logRefusal('account locked')
    throw new TooManyRequestsError('Account locked')
  }

  const sendLockAlert = () => {
    const alertKey = `ut_login_alert_${record.id}`
    const lastAlert = $app.store().get(alertKey)
    if (lastAlert && now - lastAlert < ALERT_INTERVAL) {
      return
    }

    const firstName = record.getString('name').split(' ')[0]
    const { senderAddress, senderName, appURL } = $app.settings().meta
    try {
      $app.newMailClient().send(
        new MailerMessage({
          from: { address: senderAddress, name: senderName },
          to: [{ address: record.email() }],
          subject: 'Tentatives de connexion à ton compte Urban Training',
          html: `<p>Bonjour ${firstName},</p>
<p>Quelqu’un a essayé plusieurs fois de se connecter à ton compte Urban Training avec un mauvais mot de passe. Par sécurité, les connexions à ton compte sont bloquées pendant 15 minutes.</p>
<p><b>Si c’était toi :</b> pas de souci. Réessaie dans 15 minutes, ou clique sur «&nbsp;Mot de passe oublié?&nbsp;» sur le site si tu ne t’en souviens plus.</p>
<p><b>Si ce n’était pas toi :</b> personne n’est entré dans ton compte. Par précaution, change ton mot de passe sur <a href="${appURL}">urban-training.ch</a> en cliquant sur «&nbsp;Connexion&nbsp;», puis «&nbsp;Mot de passe oublié?&nbsp;».</p>
<p>À bientôt,<br>L’équipe Urban Training</p>`,
        }),
      )
      $app.store().set(alertKey, now)
    } catch (err) {
      $app.logger().error('Lock alert failed', 'error', String(err))
    }
  }

  const legacyHash = record.getString('legacy_password_sha1')

  const isLegacyPassword = legacyHash && computeSha1(password) === legacyHash

  if (!isLegacyPassword && !record.validatePassword(password)) {
    logRefusal('wrong password')

    const isCounting = failures && now - failures.since < FAILURES_WINDOW
    const count = (isCounting ? failures.count : 0) + 1
    const since = isCounting ? failures.since : now
    const isLocked = count >= MAX_FAILURES
    $app.store().set(
      failuresKey,
      JSON.stringify({
        count: isLocked ? 0 : count,
        since,
        lockedUntil: isLocked ? now + LOCK_DURATION : 0,
      }),
    )
    if (isLocked) {
      sendLockAlert()
    }

    throw new UnauthorizedError('Invalid credentials')
  }

  $app.store().remove(failuresKey)

  if (legacyHash) {
    // A migrated member: either the old password, or one set since the import
    // while the old hash was left behind
    if (isLegacyPassword) {
      record.setPassword(password)
    }
    record.set('legacy_password_sha1', '')
    record.set('verified', true)
    $app.save(record)
  } else if (!record.getBool('verified')) {
    logRefusal('account not activated')
    throw new ForbiddenError('Account not verified')
  }

  return $apis.recordAuthResponse(e, record, 'password')
})

// A new password replaces the one from the legacy app, which must stop working
onRecordConfirmPasswordResetRequest(e => {
  e.record.set('legacy_password_sha1', '')
  e.next()
  $app.store().remove(`ut_login_failures_${e.record.id}`)
}, 'ut_users')

// Members log in through the route above, which holds the limits per account:
// the standard one would be a way around them
onRecordAuthWithPasswordRequest(() => {
  throw new ForbiddenError('Use the login of the site')
}, 'ut_users')
