import PathHistory from 'spa-history/PathHistory'

const history = new PathHistory({
  async change (location) {
    console.log(location)
    // 使用import()将加载的js文件分开打包, 这样实现了仅加载访问的页面
    const module = await import('./pages' + location.path + '/index.js')
    // export default ... 的内容通过module.default访问
    const Page = module.default
    const page = new Page()
    page.mount(document.body)
  }
})

document.body.addEventListener('click', e => history.captureLinkClickEvent(e))

history.start()

if (DEBUG) {
  console.log('这是开发模式！')
  console.log(VERSION)
  console.log(CONFIG)
} else {
  console.log('这是生产模式！')
}
