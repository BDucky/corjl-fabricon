/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type {
  SignUpCommandInput,
  InitiateAuthCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import type { User } from '@/types'

// Auth error types matching native mobile app pattern
type AuthErrorType =
  | 'InvalidCredentials'
  | 'UserNotFound'
  | 'UserNotConfirmed'
  | 'NetworkError'
  | 'UsernameExists'
  | 'InvalidPassword'
  | 'InvalidParameter'
  | 'CodeMismatch'
  | 'CodeExpired'

const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  InvalidCredentials: 'Invalid email or password',
  UserNotFound: 'User not found',
  UserNotConfirmed: 'Please verify your email address',
  NetworkError: 'Network error. Please try again.',
  UsernameExists: 'An account with this email already exists',
  InvalidPassword: 'Password does not meet requirements',
  InvalidParameter: 'Invalid input',
  CodeMismatch: 'Invalid verification code. Please try again.',
  CodeExpired: 'Verification code has expired. Please request a new one.',
}

const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-west-2'
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || ''

// Token refresh constants (matching native SessionManager)
const PROACTIVE_REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
const BACKGROUND_CHECK_INTERVAL_MS = 60 * 1000 // 60 seconds

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const idToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const tokenExpiresAt = ref<number | null>(null)
  const orgId = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  let backgroundCheckInterval: ReturnType<typeof setInterval> | null = null

  // Cognito client
  const cognitoClient = new CognitoIdentityProviderClient({
    region: AWS_REGION,
  })

  // Computed
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => user.value?.displayName || user.value?.email?.split('@')[0] || '')

  // --- Error mapping (matches native CognitoAuthService pattern) ---
  const mapAuthError = (err: any): { type: AuthErrorType; message: string } => {
    const message = err.message || ''
    const name = err.name || ''
    const fullError = `${name} ${message}`

    if (fullError.includes('NotAuthorizedException') || fullError.includes('Incorrect username or password')) {
      return { type: 'InvalidCredentials', message: AUTH_ERROR_MESSAGES.InvalidCredentials }
    }
    if (fullError.includes('UserNotFoundException') || fullError.includes('User does not exist')) {
      return { type: 'UserNotFound', message: AUTH_ERROR_MESSAGES.UserNotFound }
    }
    if (fullError.includes('UserNotConfirmedException') || fullError.includes('User is not confirmed')) {
      return { type: 'UserNotConfirmed', message: AUTH_ERROR_MESSAGES.UserNotConfirmed }
    }
    if (fullError.includes('UsernameExistsException') || fullError.includes('already exists')) {
      return { type: 'UsernameExists', message: AUTH_ERROR_MESSAGES.UsernameExists }
    }
    if (fullError.includes('InvalidPasswordException') || fullError.includes('Password did not conform')) {
      return { type: 'InvalidPassword', message: message || AUTH_ERROR_MESSAGES.InvalidPassword }
    }
    if (fullError.includes('InvalidParameterException')) {
      return { type: 'InvalidParameter', message: message || AUTH_ERROR_MESSAGES.InvalidParameter }
    }
    if (fullError.includes('CodeMismatchException') || fullError.includes('Invalid verification code')) {
      return { type: 'CodeMismatch', message: AUTH_ERROR_MESSAGES.CodeMismatch }
    }
    if (fullError.includes('ExpiredCodeException') || fullError.includes('code has expired')) {
      return { type: 'CodeExpired', message: AUTH_ERROR_MESSAGES.CodeExpired }
    }

    return { type: 'NetworkError', message: AUTH_ERROR_MESSAGES.NetworkError }
  }

  // --- JWT helpers (matching native extractOrgIdFromToken) ---
  const decodeJwtPayload = (jwt: string): Record<string, any> | null => {
    try {
      const parts = jwt.split('.')
      if (parts.length < 2) return null
      const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      return JSON.parse(payload)
    } catch {
      return null
    }
  }

  const extractOrgIdFromIdToken = (jwt: string): string | null => {
    const payload = decodeJwtPayload(jwt)
    if (!payload) return null

    const customOrgs = payload['custom:orgs'] || ''
    if (!customOrgs) return null

    const orgIds = customOrgs.split('|')
    // Prefer designer org (starts with GD) matching native pattern
    return orgIds.find((id: string) => id.toUpperCase().startsWith('GD')) || orgIds[0] || null
  }

  // --- Token storage ---
  const saveTokens = (access: string, id: string, refresh: string) => {
    token.value = access
    idToken.value = id
    refreshToken.value = refresh
    tokenExpiresAt.value = Date.now() + 3600 * 1000 // 1 hour

    localStorage.setItem('accessToken', access)
    localStorage.setItem('idToken', id)
    localStorage.setItem('refreshToken', refresh)
    localStorage.setItem('tokenExpiresAt', String(tokenExpiresAt.value))

    // Extract orgId from idToken
    const extracted = extractOrgIdFromIdToken(id)
    if (extracted) {
      orgId.value = extracted
      localStorage.setItem('orgId', extracted)
    }
  }

  const loadTokens = () => {
    token.value = localStorage.getItem('accessToken')
    idToken.value = localStorage.getItem('idToken')
    refreshToken.value = localStorage.getItem('refreshToken')
    orgId.value = localStorage.getItem('orgId')
    const expiresStr = localStorage.getItem('tokenExpiresAt')
    tokenExpiresAt.value = expiresStr ? Number(expiresStr) : null
  }

  // Helper: Extract user from attributes
  const extractUserFromAttributes = (attributes: any[] = []): Partial<User> => {
    const newUser: Partial<User> = {}
    attributes.forEach((attr) => {
      if (attr.Name === 'sub') newUser.id = attr.Value
      if (attr.Name === 'email') newUser.email = attr.Value
      if (attr.Name === 'given_name') newUser.displayName = attr.Value
      if (attr.Name === 'name') newUser.displayName = attr.Value
    })
    return newUser
  }

  // Helper: Clear auth state
  const clearAuth = () => {
    user.value = null
    token.value = null
    idToken.value = null
    refreshToken.value = null
    tokenExpiresAt.value = null
    orgId.value = null
    isAuthenticated.value = false
    error.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('idToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('tokenExpiresAt')
    localStorage.removeItem('orgId')
    localStorage.removeItem('user')
    stopSessionMonitor()
  }

  // --- Session management (matching native SessionManager) ---
  const isTokenExpiringSoon = (): boolean => {
    if (!tokenExpiresAt.value) return true
    return Date.now() + PROACTIVE_REFRESH_THRESHOLD_MS >= tokenExpiresAt.value
  }

  const refreshSession = async (): Promise<boolean> => {
    if (!refreshToken.value) return false

    try {
      const command = new InitiateAuthCommand({
        ClientId: COGNITO_CLIENT_ID,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: refreshToken.value,
        },
      })
      const response = await cognitoClient.send(command)
      const result = response.AuthenticationResult

      if (result?.AccessToken && result?.IdToken) {
        saveTokens(
          result.AccessToken,
          result.IdToken,
          refreshToken.value!, // refresh token stays the same
        )
        return true
      }
      return false
    } catch (err: any) {
      const fullError = `${err.name || ''} ${err.message || ''}`
      // If refresh token is invalid/expired, force logout
      if (
        fullError.includes('NotAuthorizedException') ||
        fullError.includes('Invalid refresh token') ||
        fullError.includes('Refresh Token has expired')
      ) {
        clearAuth()
      }
      return false
    }
  }

  const performBackgroundCheck = async () => {
    if (!isAuthenticated.value) return
    if (isTokenExpiringSoon()) {
      await refreshSession()
    }
  }

  const startSessionMonitor = () => {
    stopSessionMonitor()
    backgroundCheckInterval = setInterval(performBackgroundCheck, BACKGROUND_CHECK_INTERVAL_MS)
  }

  const stopSessionMonitor = () => {
    if (backgroundCheckInterval) {
      clearInterval(backgroundCheckInterval)
      backgroundCheckInterval = null
    }
  }

  // Initialize auth from stored session
  const initializeAuth = async () => {
    if (isInitialized.value) return

    try {
      isLoading.value = true
      error.value = null

      loadTokens()

      if (token.value) {
        // Check if token needs refresh first
        if (isTokenExpiringSoon() && refreshToken.value) {
          const refreshed = await refreshSession()
          if (!refreshed) {
            clearAuth()
            return
          }
        }

        // Fetch user profile
        const command = new GetUserCommand({
          AccessToken: token.value,
        })
        const response = await cognitoClient.send(command)
        const userData = extractUserFromAttributes(response.UserAttributes)

        user.value = {
          id: userData.id || '',
          email: userData.email || '',
          displayName: userData.displayName || '',
          subscriptionTier: 'FREE',
          createdAt: new Date().toISOString(),
        }
        isAuthenticated.value = true
        startSessionMonitor()
      } else {
        clearAuth()
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err)
      clearAuth()
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  // Sign up
  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      isLoading.value = true
      error.value = null

      const params: SignUpCommandInput = {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
        ],
      }

      if (displayName) {
        params.UserAttributes!.push({ Name: 'name', Value: displayName })
      }

      const command = new SignUpCommand(params)
      await cognitoClient.send(command)

      return {
        success: true,
        nextStep: 'CONFIRM_SIGN_UP',
        userSub: email,
      }
    } catch (err: any) {
      const mapped = mapAuthError(err)
      error.value = mapped.message
      return { success: false, error: mapped.message }
    } finally {
      isLoading.value = false
    }
  }

  // Confirm sign up (verify code)
  const confirmSignup = async (email: string, code: string) => {
    try {
      isLoading.value = true
      error.value = null

      const command = new ConfirmSignUpCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      })

      await cognitoClient.send(command)
      return { success: true }
    } catch (err: any) {
      const mapped = mapAuthError(err)
      error.value = mapped.message
      return { success: false, error: mapped.message }
    } finally {
      isLoading.value = false
    }
  }

  // Resend confirmation code
  const resendCode = async (email: string) => {
    try {
      isLoading.value = true
      error.value = null

      const command = new ResendConfirmationCodeCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
      })
      await cognitoClient.send(command)
      return { success: true }
    } catch (err: any) {
      const mapped = mapAuthError(err)
      error.value = mapped.message
      return { success: false, error: mapped.message }
    } finally {
      isLoading.value = false
    }
  }

  // Sign in
  const signin = async (email: string, password: string) => {
    try {
      isLoading.value = true
      error.value = null

      const params: InitiateAuthCommandInput = {
        ClientId: COGNITO_CLIENT_ID,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }

      const command = new InitiateAuthCommand(params)
      const response = await cognitoClient.send(command)

      if (response.AuthenticationResult?.AccessToken) {
        const result = response.AuthenticationResult

        // Save all tokens (matching native saveTokensToSecureStorage)
        saveTokens(
          result.AccessToken!,
          result.IdToken || '',
          result.RefreshToken || '',
        )

        // Load user profile
        const getUserCommand = new GetUserCommand({
          AccessToken: result.AccessToken,
        })
        const userResponse = await cognitoClient.send(getUserCommand)
        const userData = extractUserFromAttributes(userResponse.UserAttributes)

        const authUser: User = {
          id: userData.id || '',
          email: userData.email || email,
          displayName: userData.displayName || email.split('@')[0],
          subscriptionTier: 'FREE',
          createdAt: new Date().toISOString(),
        }

        user.value = authUser
        isAuthenticated.value = true
        startSessionMonitor()

        return { success: true, user: authUser }
      }

      return { success: false, error: 'Authentication failed' }
    } catch (err: any) {
      const mapped = mapAuthError(err)
      error.value = mapped.message
      return { success: false, error: mapped.message }
    } finally {
      isLoading.value = false
    }
  }

  // Sign out (matching native logout)
  const signout = async () => {
    try {
      isLoading.value = true
      error.value = null

      if (token.value) {
        const command = new GlobalSignOutCommand({
          AccessToken: token.value,
        })
        await cognitoClient.send(command)
      }

      clearAuth()
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Sign out failed'
      clearAuth() // Clear locally even if remote fails
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Keep `logout` as alias for backward compat
  const logout = signout

  // Initiate password reset
  const startPasswordReset = async (email: string) => {
    try {
      isLoading.value = true
      error.value = null

      const command = new ForgotPasswordCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
      })

      await cognitoClient.send(command)
      return { success: true, nextStep: 'CONFIRM_FORGOT_PASSWORD' }
    } catch (err: any) {
      const mapped = mapAuthError(err)
      error.value = mapped.message
      return { success: false, error: mapped.message }
    } finally {
      isLoading.value = false
    }
  }

  // Confirm password reset
  const confirmPasswordReset = async (email: string, code: string, newPassword: string) => {
    try {
      isLoading.value = true
      error.value = null

      const command = new ConfirmForgotPasswordCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      })

      await cognitoClient.send(command)
      return { success: true }
    } catch (err: any) {
      const mapped = mapAuthError(err)
      error.value = mapped.message
      return { success: false, error: mapped.message }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    user,
    token,
    idToken,
    refreshToken,
    orgId,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,

    // Computed
    userEmail,
    userName,

    // Actions
    initializeAuth,
    signup,
    confirmSignup,
    resendCode,
    signin,
    signout,
    logout,
    startPasswordReset,
    confirmPasswordReset,
    refreshSession,
  }
})
