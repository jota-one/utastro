import AppErrorCode from '@/AppErrorCode'
import config from '@/config'

const emailRe =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i

export const validateEmail = (email: string) => {
  if (email && !emailRe.exec(email)) {
    throw new Error('Invalid email address', {
      cause: AppErrorCode.ERROR_HC_INVALID_EMAIL_ADDRESS,
    })
  }
  return true
}

export const validatePassword = (password: string, passwordConfirm: string) => {
  const { minLength } = config.signup.password

  if (password.length > 0 && password.length < minLength) {
    throw new Error('Password does not match policy', {
      cause: AppErrorCode.ERROR_HC_PASSWORD_POLICY_NOT_MATCHED,
    })
  }

  if (password && passwordConfirm && password !== passwordConfirm) {
    throw new Error('Passwords do not match', {
      cause: AppErrorCode.ERROR_HC_PASSWORD_CONFIRMATION_NOT_MATCHED,
    })
  }

  return true
}

export const validateName = (name: string) => {
  if (!name.trim()) return true
  if (name.length < 2) {
    throw new Error('Invalid name', {
      cause: AppErrorCode.ERROR_UT_INVALID_NAME,
    })
  }
  return true
}

export const validatePhone = (phone: string) => {
  if (!phone.trim()) return true
  const trimmed = phone.trim()
  let digits = ''
  if (trimmed.startsWith('+')) {
    digits = trimmed.slice(1).replace(/\D/g, '')
  } else if (trimmed.startsWith('00')) {
    digits = trimmed.slice(2).replace(/\D/g, '')
  } else {
    throw new Error('Invalid phone', {
      cause: AppErrorCode.ERROR_UT_INVALID_PHONE,
    })
  }
  if (digits.length < 11) {
    throw new Error('Invalid phone', {
      cause: AppErrorCode.ERROR_UT_INVALID_PHONE,
    })
  }
  return true
}

export const validateBirthYear = (year: number | string | undefined) => {
  if (!year) return true
  const num = Number(year)
  if (isNaN(num)) return true
  const currentYear = new Date().getFullYear()
  if (num < currentYear - 100 || num > currentYear - 5) {
    throw new Error('Invalid birth year', {
      cause: AppErrorCode.ERROR_UT_INVALID_BIRTHDATE,
    })
  }
  return true
}

export const validateCity = (city: string) => {
  if (!city.trim()) return true
  if (city.trim().length < 3) {
    throw new Error('City too short', {
      cause: AppErrorCode.ERROR_UT_INVALID_CITY,
    })
  }
  return true
}

export const validateZip = (zip: string | number | undefined) => {
  if (zip === undefined || zip === null || zip === '' || zip === 0) return true
  const digits = String(zip).replace(/\D/g, '')
  if (digits.length < 4) {
    throw new Error('Invalid zip', { cause: AppErrorCode.ERROR_UT_INVALID_ZIP })
  }
  return true
}
