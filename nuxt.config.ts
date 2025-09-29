// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/eslint'
  ],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: true
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    openaiApiKey: '',
    openaiModel: 'gpt-4o',

    // Public keys (exposed to client-side)
    public: {
      // Add public runtime config here if needed
    }
  },

  // Server-side API configuration
  nitro: {
    experimental: {
      wasm: true
    },
    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    // Server runtime configuration
    serverAssets: [],
    rollupConfig: {
      onwarn(warning, warn) {
        // Suppress OpenAI 'this' keyword warnings
        if (warning.code === 'THIS_IS_UNDEFINED' && warning.id?.includes('openai')) {
          return
        }
        warn(warning)
      }
    }
  },

  // Build configuration
  build: {
    transpile: ['openai']
  },

  vite: {
    optimizeDeps: {
      exclude: ['openai']
    },
    define: {
      global: 'globalThis'
    },
    ssr: {
      noExternal: ['openai']
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress OpenAI 'this' keyword warnings
          if (warning.code === 'THIS_IS_UNDEFINED' && warning.id?.includes('openai')) {
            return
          }
          warn(warning)
        }
      }
    }
  }
})