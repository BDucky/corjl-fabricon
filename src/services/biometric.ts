import { Capacitor } from '@capacitor/core'
import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
} from '@aparajita/capacitor-biometric-auth'
import { SecureStorage } from '@aparajita/capacitor-secure-storage'

const REFRESH_TOKEN_KEY = 'fabricon.refreshToken'
const EMAIL_KEY = 'fabricon.email'

export type BiometryKind = 'faceId' | 'touchId' | 'fingerprint' | 'iris' | 'face' | 'none'

export interface BiometricAvailability {
  isAvailable: boolean
  kind: BiometryKind
  /** Human-friendly label, e.g. "Face ID". null when not available. */
  label: string | null
  /** Why it's unavailable, if so. */
  reason?: string
}

function mapBiometryType(type: BiometryType): BiometryKind {
  switch (type) {
    case BiometryType.faceId:
      return 'faceId'
    case BiometryType.touchId:
      return 'touchId'
    case BiometryType.fingerprintAuthentication:
      return 'fingerprint'
    case BiometryType.faceAuthentication:
      return 'face'
    case BiometryType.irisAuthentication:
      return 'iris'
    default:
      return 'none'
  }
}

function labelFor(kind: BiometryKind): string | null {
  switch (kind) {
    case 'faceId':
      return 'Face ID'
    case 'touchId':
      return 'Touch ID'
    case 'fingerprint':
      return 'Fingerprint'
    case 'face':
      return 'Face Unlock'
    case 'iris':
      return 'Iris Unlock'
    default:
      return null
  }
}

/** Native-only feature; on web we don't even prompt. */
export function isBiometricSupportedPlatform(): boolean {
  return Capacitor.isNativePlatform()
}

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  if (!isBiometricSupportedPlatform()) {
    return { isAvailable: false, kind: 'none', label: null, reason: 'Not available on web' }
  }
  try {
    const info = await BiometricAuth.checkBiometry()
    const kind = mapBiometryType(info.biometryType)
    return {
      isAvailable: info.isAvailable,
      kind,
      label: labelFor(kind),
      reason: info.reason || undefined,
    }
  } catch (e) {
    return {
      isAvailable: false,
      kind: 'none',
      label: null,
      reason: e instanceof Error ? e.message : 'Failed to query biometrics',
    }
  }
}

/**
 * Prompt the native biometric sheet. Throws if the user cancels or auth fails.
 * Caller is responsible for translating that into a UI message.
 */
export async function authenticateBiometric(reason: string): Promise<void> {
  await BiometricAuth.authenticate({
    reason,
    cancelTitle: 'Cancel',
    allowDeviceCredential: false,
    iosFallbackTitle: 'Use Passcode',
  })
}

/** Translate a BiometryError into a short user-facing message. */
export function biometricErrorMessage(err: unknown): string {
  if (err instanceof BiometryError) {
    switch (err.code) {
      case BiometryErrorType.userCancel:
      case BiometryErrorType.appCancel:
        return 'Cancelled'
      case BiometryErrorType.biometryLockout:
        return 'Too many attempts — biometrics are temporarily locked'
      case BiometryErrorType.biometryNotEnrolled:
        return 'No biometrics enrolled on this device'
      case BiometryErrorType.biometryNotAvailable:
        return 'Biometrics not available on this device'
      case BiometryErrorType.authenticationFailed:
        return "We couldn't recognize you — try again"
      default:
        return err.message || 'Biometric authentication failed'
    }
  }
  return err instanceof Error ? err.message : 'Biometric authentication failed'
}

export async function storeRefreshCredentials(email: string, refreshToken: string): Promise<void> {
  await SecureStorage.set(EMAIL_KEY, email, false, false)
  await SecureStorage.set(REFRESH_TOKEN_KEY, refreshToken, false, false)
}

export async function loadRefreshCredentials(): Promise<{ email: string; refreshToken: string } | null> {
  const [email, refreshToken] = await Promise.all([
    SecureStorage.get(EMAIL_KEY, false, false) as Promise<string | null>,
    SecureStorage.get(REFRESH_TOKEN_KEY, false, false) as Promise<string | null>,
  ])
  if (!email || !refreshToken) return null
  return { email, refreshToken }
}

export async function clearRefreshCredentials(): Promise<void> {
  await Promise.all([
    SecureStorage.remove(EMAIL_KEY).catch(() => false),
    SecureStorage.remove(REFRESH_TOKEN_KEY).catch(() => false),
  ])
}
