import AppErrorCode from '@/AppErrorCode'
import config from '@/config'

const emailRe =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i

export const validateEmail = (input: string) => emailRe.exec(input)

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
