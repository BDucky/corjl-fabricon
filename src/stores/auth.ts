/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
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

const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'ap-southeast-1'
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || ''

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // Cognito client
  const cognitoClient = new CognitoIdentityProviderClient({
    region: AWS_REGION,
  })

  // Computed
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => user.value?.displayName || user.value?.email?.split('@')[0] || '')

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
    isAuthenticated.value = false
    error.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiration')
  }

  // Initialize auth from stored session
  const initializeAuth = async () => {
    if (isInitialized.value) return

    try {
      isLoading.value = true
      error.value = null

      // Load from localStorage
      const accessToken = localStorage.getItem('accessToken')
      if (accessToken) {
        token.value = accessToken

        // Try to load user profile
        const command = new GetUserCommand({
          AccessToken: accessToken,
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
        params.UserAttributes!.push({ Name: 'given_name', Value: displayName })
      }

      const command = new SignUpCommand(params)
      await cognitoClient.send(command)

      return {
        success: true,
        nextStep: 'CONFIRM_SIGN_UP',
        userSub: email,
      }
    } catch (err: any) {
      error.value = err.message || 'Signup failed'
      return {
        success: false,
        error: error.value,
      }
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
      error.value = err.message || 'Confirmation failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Resend sign up code - not available with basic Cognito, skip for now
  const resendCode = async (_email: string) => {
    error.value = 'Resend code not implemented'
    return { success: false, error: error.value }
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
        const accessToken = response.AuthenticationResult.AccessToken
        token.value = accessToken
        localStorage.setItem('accessToken', accessToken)

        // Load user profile
        const getUserCommand = new GetUserCommand({
          AccessToken: accessToken,
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

        return {
          success: true,
          user: authUser,
        }
      }

      return { success: false, error: 'Authentication failed' }
    } catch (err: any) {
      error.value = err.message || 'Sign in failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Sign out
  const logout = async () => {
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
      return {
        success: true,
        nextStep: 'CONFIRM_FORGOT_PASSWORD',
      }
    } catch (err: any) {
      error.value = err.message || 'Password reset failed'
      return { success: false, error: error.value }
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
      error.value = err.message || 'Password confirmation failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    user,
    token,
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
    logout,
    startPasswordReset,
    confirmPasswordReset,
  }
})
