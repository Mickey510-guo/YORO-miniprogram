import {
  injectedGuiListenerPlugin,
  injectOnErrorPlugin,
  makeTagger,
  miaodaDevPlugin
} from 'miaoda-sc-plugin'

const base = String(process.argv[process.argv.length - 1])
const publicPath = base.startsWith('http') ? base : '/'

export default {
  mini: {
    debugReact: true
  },
  h5: {},
  compiler: {
    type: 'vite',
    vitePlugins: [
      makeTagger({
        root: process.cwd()
      }),
      injectedGuiListenerPlugin({
        path: 'https://resource-static.cdn.bcebos.com/common/v2/injected.js'
      }),
      injectOnErrorPlugin(),
      miaodaDevPlugin({appType: 'miniapp', cdnBase: publicPath})
    ]
  }
}
