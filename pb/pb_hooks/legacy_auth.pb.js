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
    for (let i = 0; i < msg.length; i++) {
      const c = msg.charCodeAt(i)
      if (c < 128) {
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

    return [H0, H1, H2, H3, H4].map(h => ('00000000' + (h >>> 0).toString(16)).slice(-8)).join('')
  }

  const body = e.requestInfo().body
  const email = (body?.email ?? '').trim()
  const password = body?.password ?? ''

  if (!email || !password) {
    throw new BadRequestError('Email and password are required')
  }

  let record
  try {
    record = $app.findAuthRecordByEmail('ut_users', email)
  } catch {
    throw new UnauthorizedError('Invalid credentials')
  }

  const legacyHash = record.getString('legacy_password_sha1')

  if (legacyHash) {
    if (computeSha1(password) !== legacyHash) {
      throw new UnauthorizedError('Invalid credentials')
    }

    record.setPassword(password)
    record.set('legacy_password_sha1', '')
    record.set('verified', true)
    $app.save(record)
  } else {
    if (!record.validatePassword(password)) {
      throw new UnauthorizedError('Invalid credentials')
    }
  }

  return $apis.recordAuthResponse(e, record, 'password')
})
