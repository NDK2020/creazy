import type { PluginOption } from 'vite'
import unocss from './unocss'
import unplugin from './unplugin'
import vue from './vue'

/**
 * setup vite plugins
 */
export function setup_vite_plugins(): PluginOption[] {
  return [unocss, ...unplugin, vue]
}
