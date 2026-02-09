<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900">
          Sign in to Fabricon
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <BaseInput
            v-model="form.email"
            type="email"
            placeholder="Email address"
            label="Email"
            required
            :error="errors.email"
            @blur="validateField('email')"
          />
          <BaseInput
            v-model="form.password"
            type="password"
            placeholder="Password"
            label="Password"
            required
            :error="errors.password"
            @blur="validateField('password')"
          />
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <p class="text-sm font-medium text-red-800">
            {{ error }}
          </p>
        </div>

        <div>
          <BaseButton
            type="submit"
            variant="primary"
            class="w-full"
            :is-loading="isLoading"
          >
            Sign in
          </BaseButton>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <RouterLink to="/signup" class="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </RouterLink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import BaseInput from '@components/ui/BaseInput.vue'
import BaseButton from '@components/ui/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const error = ref('')

const validateField = (field: keyof typeof form) => {
  if (field === 'email') {
    errors.email = form.email ? '' : 'Email is required'
  } else if (field === 'password') {
    errors.password = form.password ? '' : 'Password is required'
  }
}

const handleLogin = async () => {
  validateField('email')
  validateField('password')

  if (errors.email || errors.password) return

  isLoading.value = true
  error.value = ''

  const result = await authStore.signin(form.email, form.password)

  if (result.success) {
    router.push('/projects')
  } else {
    error.value = result.error || 'Login failed'
  }

  isLoading.value = false
}
</script>
