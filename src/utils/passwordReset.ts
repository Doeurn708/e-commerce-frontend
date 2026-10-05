const RESET_EMAIL_KEY = 'ecommerce_reset_email'
const RESET_VERIFIED_KEY = 'ecommerce_reset_verified'
const RESET_OTP_KEY = 'ecommerce_reset_otp'

export function setResetEmail(email: string) {
  sessionStorage.setItem(RESET_EMAIL_KEY, email.trim())
}

export function setResetVerified(otp: string) {
  sessionStorage.setItem(RESET_VERIFIED_KEY, '1')
  sessionStorage.setItem(RESET_OTP_KEY, otp.trim())
}

export function getResetEmail(): string {
  return (sessionStorage.getItem(RESET_EMAIL_KEY) ?? '').trim()
}

export function getResetOtp(): string {
  return (sessionStorage.getItem(RESET_OTP_KEY) ?? '').trim()
}

export function isResetVerified(): boolean {
  return sessionStorage.getItem(RESET_VERIFIED_KEY) === '1'
}

export function clearResetState() {
  sessionStorage.removeItem(RESET_EMAIL_KEY)
  sessionStorage.removeItem(RESET_VERIFIED_KEY)
  sessionStorage.removeItem(RESET_OTP_KEY)
}