const async = require('async')
const React = require('react')
const ReactDOM = require('react-dom')
const queryString = require('query-string')
const createForm = require('expect-react-form')

let middlewareStack = []

const defaultFormatTitle = function (defaultTitle, title) { return defaultTitle + (title ? ' - ' + title : '') }

var browserRenderReact = function ({ RootComponent, app, formatTitle = defaultFormatTitle, rootDOMId = 'root', document, defaultTitle }) {
  RootComponent = RootComponent
    ? React.createFactory(RootComponent)
    : React.createClass({propTypes: { content: React.PropTypes.element }, render: function () { return React.createElement('div', {className: 'app-container'}, this.props.content) }})

  return (req, res, next) => {
    const Form = createForm(req, res)
    res.Form = Form

    res.navigate = function (path, query) {
      const pathname = path + '?' + queryString.stringify(query)
      app.navigate(pathname)
    }

    res.redirect = app.navigate

    res.send = function (data) {
      if (typeof data === 'object') {
        data = JSON.stringify(data)
      }
      document.getElementById(rootDOMId).innerHTML = data
    }

    res.renderReact = (content, opts) => {
      let rootProps = {}
      let contentProps = {}
      rootProps.navigate = res.navigate
      contentProps.navigate = res.navigate
      rootProps.submit = app.submit
      contentProps.submit = app.submit
      document.title = formatTitle(defaultTitle, opts ? opts.title : false)
      async.each(middlewareStack, (middlewareFunction, callback) => {
        middlewareFunction(req, res, contentProps, rootProps, callback)
      }, () => {
        contentProps.Form = Form
        const contentWithProps = typeof content.type === 'string'
          ? content
          : React.cloneElement(content, contentProps)
        rootProps.content = contentWithProps
        rootProps.opts = opts
        ReactDOM.render(React.createElement(RootComponent, rootProps), document.getElementById(rootDOMId), () => {
          if (res.onComplete) {
            res.onComplete()
          }
        })
      })
    }
    next()
  }
}

browserRenderReact.use = function (middlewareFunction) {
  middlewareStack.push(middlewareFunction)
}

module.exports = browserRenderReact
