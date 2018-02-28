/* eslint no-console: "off" */

import template from './index.html'
import './style.css'

export default class {
  mount (container) {
    document.title = 'page2'
    console.log('看看hash变了没');
    container.innerHTML = `${template}`
  }
}
