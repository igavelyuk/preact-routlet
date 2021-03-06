import { h, Component } from "preact";
import Path from 'path-parser';

export const routePool = [];

let defaultPath = "/";

export const getPath = () => transformHash(location.hash);

export const setDefault = path => defaultPath = path;

export const refresh = () => window.dispatchEvent(new HashChangeEvent("hashchange"));

let FIRST_COMPONENT_HAS_MOUNTED = false;
const gotoDefault = _ => {
  if(!FIRST_COMPONENT_HAS_MOUNTED) {
    if(!location.hash) setTimeout(navigate, 1, defaultPath);
    FIRST_COMPONENT_HAS_MOUNTED = true;
  }
}

const transformHash = rawHash => rawHash.split("#").pop();

export function renderOnRoute(path) {
  return function(comp) {
    routePool.push({
      path,
      parser: new Path(path),
      comp,
    });
    return comp;
  }
}

export const navigate = newUrl => location.hash = "#" + newUrl;

export class PathLookup extends Component {

  componentWillMount() {
    gotoDefault();
    const path = location.hash ? transformHash(location.hash): defaultPath;
    this.setState({
      params: null,
      path,
      current: null
    })
    this.hashChange(path);
  }


  componentDidMount() {
    window.addEventListener("hashchange", ({ newURL }) =>
      this.hashChange(transformHash(newURL || location.hash)));
  }

  hashChange(selectedRoute) {
    this.setState({ path: selectedRoute });
  }

  render({ shouldRender, children }, { path }) {
    return shouldRender(path) ? children[0]: null;
  }
}

export class RouterOutlet extends PathLookup {

  hashChange(selectedRoute) {
    const selectedMatcher = routePool.find(matcher => !!matcher.parser.test(selectedRoute));
    this.setState({
      "params": selectedMatcher ? selectedMatcher.parser.test(selectedRoute): null,
      "path": selectedRoute,
      "current": selectedMatcher ? selectedMatcher.comp: null
    });
  }

  render({ children, shouldRedirect = _ => false, redirect }, { current, params, path }) {
    const result = current ? h(current, { params, path }): children[0];

    if(shouldRedirect(path) && current) {
      navigate(redirect);
      return;
    }

    return result;
  }
}

export const Link = ({ href, children, ...props }) =>
  h("a", { href: `#${href}`, ...props }, children);
