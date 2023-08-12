import { defineConfig, presetUno, transformerVariantGroup } from 'unocss'
import presetRemToPx from '@unocss/preset-rem-to-px'

const my_color_scheme = {
  blue: {
    DEFAULT: '#00c8ff',
    '50': '#c0f3ff',
    '100': '#5cdfff',
    '200': '#00c8ff',
    '300': '#008bff',
  },
  green: {
    DEFAULT: '#3BA676',
    '50': '#B4E4CF',
    '100': '#A5DFC5',
    '200': '#87D4B2',
    '300': '#69CA9E',
    '400': '#4BBF8B',
    '500': '#3BA676',
    '600': '#2C7D59',
    '700': '#1E533B',
    '800': '#0F2A1E',
    '900': '#000000',
  },
  red: {
    DEFAULT: '#ff3177',
    '100': '#f70064',
    '200': '#d70061',
    '300': '#c1004f'
  },
  dark: {
    DEFAULT: '#000',
    '100': '#d5d5d5',
    '200': '#c1c1c1',
    '300': '#2c2c2c'
  },
  violet: {
    DEFAULT: '#5c00e2',
    '100': '#8645e8',
    '200': '#4600af',
    '300': '#2e1a65'
  },
  white: {
    DEFAULT: '#fffdf9',
  },
}
export default defineConfig({
  content: {
    pipeline: {
      // include: [
      //   // the default
      //   /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
      //   // include js/ts files
      //   'src/**/*.{js,ts}',
      // ],
      // exclude files
      exclude: ['node_modules', '.git', 'dist'],
    }
  },
  presets: [presetUno(), presetRemToPx({ baseFontSize: 4 })],
  transformers: [transformerVariantGroup()],

  theme: {
    colors: {
      black: 'var(--color-black)',
      dark: my_color_scheme.dark,
      white: 'var(--color-white)',
      blue: my_color_scheme.blue,
      green: my_color_scheme.green,
      red: my_color_scheme.red,
      violet: my_color_scheme.violet,
    },
    breakpoints: {
      sm: '320px',
      md: '640px',
      lg: '1024px',
      // 'xl': {'min': '1280px', 'max': '1535px'},
      // '2xl': {'min': '1536px'},
    }
  },
  shortcuts: {
    'flex-col': 'flex flex-col',
    'flex-row': 'flex flex-row',
    'flex-col-center': 'flex-center flex-col',
    'flex-center': 'flex justify-center items-center',
    'flex-x-center': 'flex justify-center',
    'flex-y-center': 'flex items-center',
    'flex-start': 'flex justify-start items-center',
    'flex-end': 'flex justify-end items-center',
    'flex-between': 'flex justify-between items-center',
    'flex-evenly': 'flex justify-evenly items-center',
    'flex-around': 'flex justify-around items-center',
  },
})
