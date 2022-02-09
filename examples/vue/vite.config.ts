import {
  buildDir,
  chunkPath,
  layoutsDir,
  ossBase,
  pagesDir,
  publicDir,
  useCdn,
} from './config'
import { excludeDeps, includeDeps } from './optimize'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Inspect from 'vite-plugin-inspect'
import Layouts from 'vite-plugin-vue-layouts'
import LinkAttributes from 'markdown-it-link-attributes'
import Markdown from 'vite-plugin-md'
import Pages from 'vite-plugin-pages'
import Prism from 'markdown-it-prism'
import { VitePWA } from 'vite-plugin-pwa'
import Vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import VueSetupExtend from 'vite-plugin-vue-setup-extend'
import WindiCSS from 'vite-plugin-windicss'
import { calcCdnPathSuffix } from './config/helpers'
import { configCompressPlugin } from './config/compress'
import { loadEnv } from './config/load-env'
import path from 'path'

export default ({ mode }: { mode: string }): Record<string, unknown> => {
  const markdownWrapperClasses = 'prose prose-sm m-auto text-left'
  const { VITE_BUILD_DROP_CONSOLE } = loadEnv(mode)

  const cdnSuffix = calcCdnPathSuffix(mode)

  // development mode
  const isDevMode = mode === 'development'

  // development will not use cdn
  const base = isDevMode || !useCdn ? '/' : `${ossBase}/${cdnSuffix}/`

  const define = {
    'process.env': process.env,
  }

  return {
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
      },
    },
    base,
    publicDir,
    envDir: './',
    define,
    plugins: [
      Vue({
        template: {
          ssr: false,
          compilerOptions: {
            isCustomElement: (tag: string) => tag.includes('micro-app'),
          },
        },
        include: [/\.vue$/, /\.md$/],
      }),

      // https://github.com/vbenjs/vite-plugin-vue-setup-extend
      VueSetupExtend(),

      // https://github.com/hannoeru/vite-plugin-pages
      Pages({
        pagesDir: [{ dir: pagesDir, baseRoute: '' }],
        extensions: ['vue', 'md'],
      }),

      // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
      Layouts({
        layoutsDir,
      }),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'vue-i18n',
          '@vueuse/head',
          '@vueuse/core',
          'vitest',
        ],
        dts: 'src/auto-imports.d.ts',
      }),

      // https://github.com/antfu/unplugin-vue-components
      Components({
        // allow auto load markdown components under `./src/components/`
        extensions: ['vue', 'md'],

        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],

        // custom resolvers
        resolvers: [
          // auto import icons
          // https://github.com/antfu/unplugin-icons
          IconsResolver({
            prefix: false,
            // enabledCollections: ['carbon']
          }),
        ],

        dts: 'src/components.d.ts',
      }),

      // https://github.com/antfu/unplugin-icons
      Icons({
        autoInstall: true,
      }),

      // https://github.com/antfu/vite-plugin-windicss
      WindiCSS({
        safelist: markdownWrapperClasses,
      }),

      // https://github.com/antfu/vite-plugin-md
      // Don't need this? Try vitesse-lite: https://github.com/antfu/vitesse-lite
      Markdown({
        wrapperClasses: markdownWrapperClasses,
        headEnabled: true,
        markdownItSetup(md) {
          // https://prismjs.com/
          md.use(Prism)
          md.use(LinkAttributes, {
            matcher: (link: string) => /^https?:\/\//.test(link),
            attrs: {
              target: '_blank',
              rel: 'noopener',
            },
          })
        },
      }),

      // https://github.com/antfu/vite-plugin-pwa
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'safari-pinned-tab.svg'],
        manifest: {
          name: 'Modern Vue',
          short_name: 'modern-vue',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),

      // https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n
      VueI18n({
        runtimeOnly: true,
        compositionOnly: true,
        include: [path.resolve(__dirname, 'locales/**')],
      }),

      // https://github.com/antfu/vite-plugin-inspect
      Inspect({
        // change this to enable inspect for debugging
        enabled: false,
      }),

      configCompressPlugin('gzip'),
    ],

    server: {
      fs: {
        strict: true,
      },
    },

    // https://github.com/antfu/vite-ssg
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
    },

    optimizeDeps: {
      include: includeDeps,
      exclude: excludeDeps,
    },

    build: {
      minify: true,
      terserOptions: {
        compress: {
          drop_console: VITE_BUILD_DROP_CONSOLE === 'YES',
          drop_debugger: !isDevMode,
        },
      },
      target: 'es2015',
      manifest: false,
      brotliSize: false,
      sourcemap: false,
      outDir: buildDir,
      chunkSizeWarningLimit: 9000,
      rollupOptions: {
        output: {
          chunkFileNames: `${chunkPath}/[name]-[hash].js`,
          entryFileNames: `${chunkPath}/[name]-[hash].js`,
          assetFileNames: `cdn/[ext]/[name]-[hash].[ext]`,
        },
      },
    },

    // https://github.com/vitest-dev/vitest
    test: {
      include: ['test/**/*.test.ts'],
      environment: 'jsdom',
      deps: {
        inline: ['@vue', '@vueuse', 'vue-demi'],
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
  }
}
