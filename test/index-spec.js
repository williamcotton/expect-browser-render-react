const test = require('tape')
const React = require('react')
const browserExpress = require('browser-express')
const jsdom = require('jsdom')

const browserRenderReact = require('../src')

const g = (path, cb) => [path, cb]

global.document = jsdom.jsdom('<!doctype html><html><body><div id="root"></div></body></html>')
global.window = global.document.defaultView
global.navigator = {
  userAgent: 'node.js'
}

jsdom.jQueryify(global.window, 'http://code.jquery.com/jquery-2.1.1.js', () => {
  test('expect-browser-render-react', t => {
    t.test('res.renderReact', t => {
      const start = ({ route, middlewareOpts = {} }) => new Promise((resolve, reject) => {
        const app = browserExpress({
          document: global.document,
          window: global.window,
          interceptLinks: true,
          interceptFormSubmit: true,
          silent: true
        })
        middlewareOpts.app = app
        middlewareOpts.document = global.document
        middlewareOpts.rootDOMId = 'root'
        app.use(browserRenderReact(middlewareOpts))
        if (route) app.get.apply(app, route)
        const server = app.listen()
        const get$ = (route) => new Promise((resolve, reject) => {
          app.navigate(route)
          resolve(global.window.$)
        })
        resolve({server, get$})
      })

      const innerHTML = 'test'
      const elementType = 'h1'
      const component = React.createElement(elementType, {}, innerHTML)

      t.test('should render component with correct elementType and innerHTML', t => {
        const route = g('/', (req, res) => res.renderReact(component))

        start({ route }).then(({server, get$}) => get$('/')
          .then($ => t.equal($(elementType).text(), innerHTML, 'should have equal component'))
          .then(() => server.close())
          .then(() => t.end()))
      })

      t.test('should render with correct defaultTitle', t => {
        const route = g('/', (req, res) => res.renderReact(component))
        const middlewareOpts = { defaultTitle: 'test-title' }

        start({ route, middlewareOpts }).then(({server, get$}) => get$('/')
          .then($ => t.equal($('title').text(), middlewareOpts.defaultTitle, 'should have equal title'))
          .then(() => server.close())
          .then(() => t.end()))
      })

      t.test('should render with correct defaultTitle and defaultFormatTitle', t => {
        const title = 'sub-title'

        const route = g('/', (req, res) => res.renderReact(component, { title }))
        const middlewareOpts = { defaultTitle: 'test-title' }

        start({ route, middlewareOpts }).then(({server, get$}) => get$('/')
          .then($ => t.equal($('title').text(), `${middlewareOpts.defaultTitle} - ${title}`, 'should have properly formatted title and sub-title'))
          .then(() => server.close())
          .then(() => t.end()))
      })

      t.test('should render TestComponentBasic with correct className and divContents', t => {
        const TestComponentBasic = ({ className, divContents }) => React.createElement(React.createClass({
          render: function () {
            return React.createElement('div', { className }, divContents)
          }
        }))

        const divContents = 'test-test'
        const className = 'test-class'

        const route = g('/', (req, res) => res.renderReact(TestComponentBasic({ className, divContents })))

        start({ route }).then(({server, get$}) => get$('/')
          .then($ => {
            t.equal($('#root').children().length, 1, 'should have equal root component')
            t.equal($('.' + className).text(), divContents, 'should have equal child component')
          })
          .then(() => server.close())
          .then(() => t.end()))
      })

      t.test('should render TestComponentForm', t => {
        const TestComponentForm = ({ className, action, method, encType, defaultValue }) => React.createElement(React.createClass({
          render: function () {
            const Input = React.createElement('input', {key: 1, defaultValue})
            const Form = React.createElement(this.props.Form, { className, action, method, encType }, [Input])
            return React.createElement('div', {}, Form)
          }
        }))

        const className = 'test-class'
        const action = '/test'
        const method = 'post'
        const defaultValue = 'test-value'
        const encType = 'multipart/form-data'

        const route = g('/', (req, res) => res.renderReact(TestComponentForm({ className, action, method, defaultValue, encType })))

        start({ route }).then(({server, get$}) => get$('/')
          .then($ => {
            t.equal($('form').attr('class'), className, 'should have equal class')
            t.equal($('form').attr('action'), action, 'should have equal action')
            t.equal($('form').attr('method'), method, 'should have equal method')
            t.equal($('form').attr('enctype'), encType, 'should have equal encType')
            t.equal($('form input').val(), defaultValue, 'should have equal input component defaultValue')
          })
          .then(() => server.close())
          .then(() => t.end()))
      })

      t.test('should render res.Form', t => {
        const className = 'test-class'

        const route = g('/', (req, res) => res.renderReact(React.createElement(res.Form, { className })))

        start({ route }).then(({server, get$}) => get$('/')
          .then($ => t.equal($('form').attr('class'), className, 'should have equal class'))
          .then(() => server.close())
          .then(() => t.end()))
      })
    })

    t.test('browserRenderReact.use', t => {
      t.plan(4)

      const browserRenderReact = require('../src')

      const className = 'test-class'

      const path = '/test123'

      const propertyName = 'test-prop'
      const propertyValue = 'test-value'

      browserRenderReact.use((req, res, contentProps, rootProps, next) => {
        contentProps[propertyName] = propertyValue
        contentProps.path = req.path
        rootProps[propertyName] = propertyValue
        next()
      })

      const RootComponent = React.createClass({propTypes: { content: React.PropTypes.element },
        render: function () {
          t.equal(this.props[propertyName], propertyValue, 'should have Root component props[propertyName] equal propertyValue')
          return React.createElement('div', {className: 'app-container'}, this.props.content)
        }})

      const start = ({ route, middlewareOpts = {} }) => new Promise((resolve, reject) => {
        const app = browserExpress({
          document: global.document,
          window: global.window,
          interceptLinks: true,
          interceptFormSubmit: true,
          silent: true
        })
        middlewareOpts.app = app
        middlewareOpts.document = global.document
        middlewareOpts.rootDOMId = 'root'
        app.use(browserRenderReact(middlewareOpts))
        if (route) app.get.apply(app, route)
        const server = app.listen()
        const get$ = (route) => new Promise((resolve, reject) => {
          app.navigate(route)
          resolve(global.window.$)
        })
        resolve({server, get$})
      })

      const TestComponentBasic = ({ className }) => React.createElement(React.createClass({
        render: function () {
          t.equal(this.props[propertyName], propertyValue, 'should have child component props[propertyName] equal propertyValue')
          t.equal(this.props.path, path, 'has path from request')
          return React.createElement('div', { className }, path)
        }
      }))

      const route = g(path, (req, res) => res.renderReact(TestComponentBasic({ className })))

      start({ route, middlewareOpts: {RootComponent} }).then(({server, get$}) => get$(path)
        .then($ => {
          t.equal($('.' + className).text(), path, 'should have equal req.path in child component')
        })
        .then(() => server.close()))
    })
  })
})

