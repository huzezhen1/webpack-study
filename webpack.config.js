const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const url = require('url')
const pkgInfo = require('./package.json')

module.exports = (options = {}) => {
  /*
  命令行传入的值可在参数options中取得
  比如：webpack --env.dev --env.server localhost
  那么：options的值为{dev: true, server: 'localhost'}
  */
  const config =  require('./config/' + (options.config || 'default'))
  return {
    // 入口文件
    entry: {
      vendor: './src/vendor',  // 第三方代码，不常变动
      index: './src/index'     // 业务逻辑代码，常改动
    },

    // devtool: '#source-map',  // 设置Source Maps

    // 输出
    output: {
      /*
      打包完成后文件输出的位置
      */
      path: path.resolve(__dirname, 'dist'),
      /*
      entry字段配置的入口js的打包输出文件名
      [name]作为占位符, 在输出时会被替换为entry里定义的属性名
      [chunkhash]是打包后输出文件的hash值的占位符, 把[chunkhash]加入文件名可以防止浏览器使用缓存的过期内容

      options.dev是命令行传入的参数. 这里是由于使用webpack-dev-server启动开发环境时, 是没有[chunkhash]的, 用了会报错

      还有一个[hash]占位符, 这个hash是整个编译过程产生的一个总的hash值, 而不是单个文件的hash值, 项目中任何一个文件的改动, 都会造成这个hash值的改变

      使用[chunkhash]会跟热更新冲突，可在生产模式中再使用[chunkhash], 因此我们在使用webpack-dev-server启动项目时, 命令行跟上--env.dev参数, 当有该参数时, 不在文件名中加入[chunkhash]
      */
      filename: options.dev ? '[name].js' : '[name].[chunkhash].js',
      /*
      import()加载的文件会被分开打包, 我们称这个包为chunk, chunkFilename用来配置这个chunk输出的文件名.
      */
      chunkFilename: '[chunkhash].js',
      /*
      指定静态资源的url前缀
      比如我们可能要给静态资源加前缀或者在生产环境中需要配置一个CDN地址
      需要注意如果有用webpack-dev-server的话需要在historyApiFallback加上相应处理
      */
      publicPath: config.publicPath
    },

    module: {
      rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          /*
          转码，将我们写的ES6源码转成ES5
          配置在.babelrc中
          */
          use: ['babel-loader', 'eslint-loader']
        },
        {
          test: /\.html$/,
          /*
          html-loader接受attrs参数, 表示什么标签的什么属性需要调用webpack的loader进行打包.
          比如<img>标签的src属性, webpack会把<img>引用的图片打包, 然后src的属性值替换为打包后的路径.
          使用什么loader代码, 同样是在module.rules定义中使用匹配的规则.

          如果html-loader不指定attrs参数, 默认值是img:src, 意味着会默认打包<img>标签的图片.
          这里我们加上<link>标签的href属性, 用来打包入口index.html引入的favicon.png文件.
          */
          use: [{
            loader: 'html-loader',
            options: {
              // 配置根路径，使/开头的文件相对于root目录解析
              root: path.resolve(__dirname, 'src'),
              // 指定哪些标签哪些属性需要打包
              attrs: ['img:src', 'link:href']
            }
          }]
        },
        {
          test: /\.css$/,
          /*
          先使用postcss-loader处理，返回的结果交给css-loader处理, 再返回的结果交给style-loader处理.

          postcss-loader自动添加css前缀

          css-loader将css内容存为js字符串, 并且会把background, @font-face等引用的图片,字体文件交给指定的loader打包, 类似上面的html-loader,

          style-loader则将css-loader处理后的内容生成<style>标签插入到html页面,

          注意loader是从右往左执行的
          */
          use: ['style-loader', 'css-loader', 'postcss-loader']
        },
        {
          test: /favicon\.png$/,
          /*
          file-loader是将文件储存到输出目录, 并把引用的文件路径改写成输出后的路径
          */
          use: [{
            loader: 'file-loader',
            options: {
              name: '[name].[hash].[ext]'
            }
          }]
        },
        {
          /*
          匹配各种格式的图片和字体文件
          上面html-loader会把html中<img>标签的图片解析出来, 文件名匹配到这里的test的正则表达式,
          css-loader引用的图片和字体同样会匹配到这里的test条件
          */
          test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,

          /*
          排除掉favicon.png，我们在上面已经处理过了
          否则会在这里被重新处理
          */
          exclude: /favicon\.png$/,

          /*
          使用url-loader, 它接受一个limit参数, 单位为字节(byte)

          当文件体积小于limit时, url-loader把文件转为Data URI的格式内联到引用的地方
          当文件大于limit时, url-loader会调用file-loader, 把文件储存到输出目录, 并把引用的文件路径改写成输出后的路径

          比如 pages/page2/index.html中
          <img src="smallpic.png">
          会被编译成
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAA...">

          而
          <img src="largepic.png">
          会被编译成
          <img src="/f78661bef717cf2cc2c2e5158f196384.png">
          */
          use: [{
            loader: 'url-loader',
            options: {
              limit: 10000
            }
          }]
        }
      ]
    },

    /*
    配置webpack插件
    plugin和loader的区别是, loader是在import时根据不同的文件名, 匹配不同的loader对这个文件做处理,
    而plugin, 关注的不是文件的格式, 而是在编译的各个阶段, 会触发不同的事件, 让你可以干预每个编译阶段.
    */
    plugins: [
      /*
      html-webpack-plugin用来打包入口html文件
      entry配置的入口是js文件, webpack以js文件为入口, 遇到import, 用配置的loader加载引入文件
      但作为浏览器打开的入口html, 是引用入口js的文件, 它在整个编译过程的外面,
      所以, 我们需要html-webpack-plugin来打包作为入口的html文件
      */
      new HtmlWebpackPlugin({
        /*
        template参数指定入口html文件路径, 插件会把这个文件交给webpack去编译,
        webpack按照正常流程, 找到loaders中test条件匹配的loader来编译, 那么这里html-loader就是匹配的loader
        html-loader编译后产生的字符串, 会由html-webpack-plugin储存为html文件到输出目录, 默认文件名为index.html
        可以通过filename参数指定输出的文件名
        html-webpack-plugin也可以不指定template参数, 它会使用默认的html模板.
        */
        template: './src/index.html'
      }),

      /*
      webpack默认使用递增的数字作为moduleId
      如果引入了一个新文件或删掉一个文件, 会导致其他的文件的moduleId也发生改变
      这样未发生改变的文件在打包后会生成新的[chunkhash], 导致缓存失效
      
      HashedModuleIdsPlugin插件是指会根据模块的相对路径
      生成一个长度只有四位的字符串作为模块的id
      
      既隐藏了模块的路径信息, 又减少了模块id的长度

      注意此插件在Webpack1.x中并不是自带, 需要自己安装
      */
      new webpack.HashedModuleIdsPlugin(),

      /*
      CommonsChunkPlugin插件用来处理
      比如这个例子中的vendor.js和index.js都引用了spa-history，不处理的话两个文件都会带有spa-history包的代码,
      我们用CommonsChunkPlugin插件来处理重复的代码
      */
      new webpack.optimize.CommonsChunkPlugin({
        /*
        names: 将entry文件中引用的相同文件打包进指定的文件, 
        可以是新建文件（起个新的名字）, 也可以是entry中已存在的文件
        这里我们指定打包进vendor.js
        */
        name: 'vendor'
      }),

      /*
      但这样还不够, 还记得那个chunkFilename参数吗? 这个参数指定了chunk的打包输出的名字,
      我们设置为 [chunkhash].js 的格式. 那么打包时这个文件名存在哪里的呢?
      它就存在引用它的文件中. 这就意味着被引用的文件发生改变, 会导致引用的它文件也发生改变.
      
      因为CommonsChunkPlugin会在vendor（上面指定的name）中注入运行时代码, 
      其中包括所有chunk的文件名, 那么我们修改page1.do或者page2页面时, vendor.js会跟着改变, index.js不会变

      那么怎么处理这些chunk, 使得修改页面代码而不会导致entry文件改变?

      再调用CommonsChunkPlugin，抽离出这些运行时代码

      结合这两次CommonsChunkPlugin来说, 我们是先把重复引用的库打包进vendor.js, 这时候我们的代码里已经没有重复引用了, chunk文件名存在vendor.js中, 然后我们在执行一次CommonsChunkPlugin, 把所有chunk的文件名打包到manifest.js中.
      这样我们就实现了chunk文件名和代码的分离. 这样修改一个js文件不会导致其他js文件在打包时发生改变, 只有manifest.js会改变
      */
      new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',   
        chunks: ['vendor']
      }),
      /*
      定义变量
      */
      new webpack.DefinePlugin({
        DEBUG: Boolean(options.dev),
        VERSION: JSON.stringify(pkgInfo.version),
        CONFIG: JSON.stringify(config.publicPath)
      })
    ],

    resolve: {
      /*
      定义路径别名
      比如我们在文件中 import a from '../../../../components/a'
      路径太长，写起来麻烦
      我们定义了路径别名之后可以这样写 import a from '~/components/a'
      表示基于src目录来import
      */
      alias: {
        '~': path.resolve(__dirname, 'src')
      }
    },

    /*
    对应插件 webpack-dev-server
    配置开发时用的服务器, 让你可以用 http://127.0.0.1:8100/ 这样的url打开页面来调试
    */
    devServer: options.dev ? {
      port: 8100, // 端口号
      historyApiFallback: {
        index: url.parse(config.publicPath).pathname, // 如果output.publicPath有值，此处要做相应处理
        disableDotRule: true  // 忽略点号规则，针对文件夹名带点号被当作某个格式的文件
      },
      open: true, // 编译完成自动打开浏览器
      openPage: 'page1.do'  // 自动访问的url
      /*
      配置后端api的反向代理
      比如这里：
      /api/auth/*的请求会被转发到 http://api.example.dev/auth/*
      /api/pay/*的请求会被转发到  http://pay.example.dev/pay/*
      */
      // proxy: {
      //   '/api/auth/': {
      //     target: 'http://api.example.dev',
      //     changeOrigin: true, // 会修改HTTP请求头中的Host为target的域名, 这里会被改为api.example.dev
      //     pathRewrite: { '^/api': '' } // 用来改写URL, 这里我们把/api前缀去掉
      //   },

      //   '/api/pay/': {
      //     target: 'http://pay.example.dev',
      //     changeOrigin: true,
      //     pathRewrite: { '^/api': '' }
      //   }
      // }
    } : undefined,

    performance: {
      hints: options.dev ? false : 'warning'  // 开发环境中关闭一些警告warning
    }
  }
}