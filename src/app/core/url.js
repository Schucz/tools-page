//ADAPTED CODE FROM: http://blog.vjeux.com/2011/javascript/urlon-url-object-notation.html
import {
  viz,
  setTool
} from "./tool";
import {
  setLanguage
} from "./language";
import {
  appState,
  dispatch
} from "./global";
import {
  debounce,
  deepExtend,
  diffObject,
  comparePlainObjects
} from "./utils";

let poppedModel = {};
let URLI = {};
let minModel;

let popStateLoopFlag = false;
const resetPopStateLoopFlag = debounce(() => {
  popStateLoopFlag = false;
}, 500);

window.addEventListener("popstate", e => {
  //console.log(e, diffObject());
  if (!e.state) {
    parseURL();
    window.history.replaceState({
      tool: URLI["chart-type"],
      model: deepExtend({}, URLI.model, true)
    }, "Title");
    poppedModel = {};
    return;
  }

  console.log("model diff", diffObject(e.state.model, viz.getModel()));
  poppedModel = e.state.model;
  if (e.state.tool !== appState.tool) {
    parseURL();
    setTool(e.state.tool, true);
    dispatch.call("toolChanged", null, e.state.tool);
  } else {
    //FIX ME
    //We have problem with possible infinite loop of
    //updating vizabi model - updating url - updating vizabi model and so on…
    //because hook.spaceRef is not model prop from init
    popStateLoopFlag = true;
    viz.setModel(poppedModel);
  }

  const localeId = ((poppedModel || {}).locale || {}).id || "en";
  if (localeId !== appState.language) {
    setLanguage(localeId);
    dispatch.call("languageChanged", null, localeId);
  }
});

//grabs width, height, tabs open, and updates the url
function updateURL(event, replaceInsteadPush) {
  resetPopStateLoopFlag();
  if (popStateLoopFlag || (poppedModel && comparePlainObjects(viz.getModel(), poppedModel))) {
    //popStateLoopFlag = false;
    return;
  }

  poppedModel = viz.getModel();

  let model;
  if (typeof viz !== "undefined") {
    minModel = viz.getPersistentMinimalModel(VIZABI_PAGE_MODEL);
  }

  const url = {};
  if (minModel && Object.keys(minModel).length > 0) {
    Object.assign(url, minModel);
  }
  url["chart-type"] = appState.tool;

  console.log("pushing state", poppedModel, event);
  window.history[replaceInsteadPush ? "replaceState" : "pushState"]({
    tool: url["chart-type"],
    model: poppedModel
  //need to encode symbols like # in color codes because urlon can't handle them properly
  }, "Title", "#" + urlon.stringify(url).replace(/=#/g, "=%23"));
}

function parseURL() {
  const loc = window.location.toString();
  let hash = null;
  URLI = {
  };
  if (loc.indexOf("#") >= 0) {
    hash = loc.substring(loc.indexOf("#") + 1);

    if (hash) {
      //need to decode symbols like # in color codes because urlon can't handle them properly
      const parsedUrl = urlon.parse(hash.replace(/=%2523/g, "=%23").replace(/=%23/g, "=#"));

      URLI.model = parsedUrl || {};
      URLI["chart-type"] = parsedUrl["chart-type"];
      delete parsedUrl["chart-type"];

    }
  }
}

function resetURL() {
  //var href = location.href + "#";

  window.history.replaceState("Object", "Title", "#");
  //location.href = href.substring(0, href.indexOf('#'));
}

export {
  URLI,
  updateURL,
  parseURL,
  resetURL
};
