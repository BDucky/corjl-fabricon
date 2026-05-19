import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CapacitorConfig } from '@capacitor/cli'

// Load CAPACITOR_SERVER_URL from .env if present, without pulling in dotenv.
// Runs at `cap sync` / `cap run` time; ignored if .env is missing or var is unset.
//
// Uses process.cwd() rather than import.meta.url so the file stays CommonJS-
// transpilable — Capacitor 5's CLI loads this via require() with ts-CJS output,
// and import.meta.url forces Node to treat the compiled file as ESM (which then
// blows up with "exports is not defined").
function loadDevServerUrl(): string | undefined {
  if (process.env.CAPACITOR_SERVER_URL) return process.env.CAPACITOR_SERVER_URL
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*CAPACITOR_SERVER_URL\s*=\s*(.+?)\s*$/)
      if (match) return match[1].replace(/^["']|["']$/g, '')
    }
  } catch {
    // .env not present — that's fine, just means no live reload.
  }
  return undefined
}

const devServerUrl = loadDevServerUrl()

const config: CapacitorConfig = {
  appId: 'com.corjl.fabricon',
  appName: 'Try-It-On',
  webDir: 'dist',
  server: {
    // When CAPACITOR_SERVER_URL is set, the app loads from that URL (Vite dev
    // server on your Mac) for live reload on the phone. Otherwise it loads the
    // bundled webDir — required for release builds / TestFlight.
    ...(devServerUrl ? { url: devServerUrl, cleartext: true } : {}),
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 3000,
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1e1e1e',
      overlaysWebView: true,
    },
    Camera: {
      presentationStyle: 'popover',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    captureInput: true,
  },
}

export default config
