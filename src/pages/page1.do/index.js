import template from './index.html'
import './style.css'

export default class {
  mount (container) {
    document.title = 'page1.do'
    container.innerHTML = template
  }
}
