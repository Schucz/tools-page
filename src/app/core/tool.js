import {
  appState
} from "./global";
import {
  URLI,
  updateURL
} from "./url";
import {
  getTransitionModel
} from "./chart-transition";
import { loadJS, comparePlainObjects, deepExtend } from "./utils";
import timeLogger from "./timelogger";
import { observable } from 'mobx';

let viz;
let stateListener;

//cleanup the existing tool
function removeTool() {
  if (viz) {
    viz.deconstruct();
    viz = void 0;
  }
  d3.selectAll(".vzb-tool-config")
    .remove();
  d3.select(".vzb-placeholder")
    .remove();
}

function setTool(tool, skipTransition) {
  if (tool === appState.tool) return;
  if (!tool) tool = appState.tool;

  const toolsetEntry = toolsPage_toolset.find(f => f.id === tool);
  const toolsetEntryPrevious = toolsPage_toolset.find(f => f.id === appState.tool);
  const toolModelPrevious = {} //TODO: viz ? viz.getPersistentMinimalModel(VIZABI_PAGE_MODEL_PREVIOUS) : {};
  appState.tool = tool;

  removeTool();

  const pathToConfig = "config/toolconfigs/" + (toolsetEntry.config || toolsetEntry.tool) + ".js";
  loadJS(pathToConfig, document.body)
    .then(() => {
      d3.select(".vizabi-placeholder")
        .append("div")
        .attr("class", "vzb-placeholder")
        .attr("style", "width: 100%; height: 100%;");


      function applyDataConfigs(pageConfig) {
        const dataSourcesId = toolsetEntry.dataSources || Object.keys(toolsPage_datasources);
        const dataSources = dataSourcesId.map(ds => toolsPage_datasources[ds]);

        const urlDataConfig = (URLI.model || {}).data;
        const skipPageConfig = urlDataConfig && !comparePlainObjects(urlDataConfig, dataSources[0]);
        if (skipPageConfig) pageConfig = {};

        // apply data models from configuration to pageConfig
        const urlHasDataConfig = Object.keys(URLI.model || {}).some(f => f.includes("data"));
        if (urlHasDataConfig) {
          return Object.assign(pageConfig, dataSources.length > 1 ? 
            dataSources.reduce((result, ds, index) => {
              result["data" + (index ? "_" + dataSourcesId[index] : "")] = ds;
              return result;
            }, {})
            : { data: dataSources[0] });
        }

        return pageConfig;
      }

      function applyTransitionConfigs(pageConfig) {
        if (skipTransition || !viz) return pageConfig;
        const transitionModel = getTransitionModel(toolModelPrevious, toolsetEntryPrevious.transition, toolsetEntry.transition);
        return deepExtend({}, pageConfig, transitionModel, true); //true --> overwrite by empty
      }

      let pageConfig = VIZABI_MODEL;
      pageConfig = applyDataConfigs(pageConfig);
      pageConfig = applyTransitionConfigs(pageConfig);

      const toolPrototype = window[toolsetEntry.tool];
      viz = new toolPrototype({
        placeholder: ".vzb-placeholder",
        model: Vizabi(pageConfig.model),
        locale: {
          "id": appState.language,
          "path": "assets/translation/"
        },
        ui: observable(pageConfig.ui)
      });

      window.viz = viz;

//      timeLogger.removeAll();
//      timeLogger.add("TOTAL");
//      timeLogger.add((viz.model.ui || {}).splash ? "SPLASH" : "FULL");
//      if (gaEnabled && gtag) gtag("config", GAPMINDER_TOOLS_GA_ID_PROD, { "page_path": "/" + toolsetEntry.tool });
//      if (gtag) gtag("config", GAPMINDER_TOOLS_GA_ID_DEV, { "page_path": "/" + toolsetEntry.tool });

    })
    .catch(() => console.error("coudl not load config file: " + pathToConfig));
}

export {
  viz,
  setTool
};











      //let snapOnceDataLoaded = false;

      // pageConfig.bind = {
      //   'ready': function(evt) {
      //       var splashTime = timeLogger.snapOnce("SPLASH");
      //       if (gtag && splashTime) gtag('event', 'timing_complete', {
      //         'name' : 'splashload',
      //         'value' : splashTime,
      //         'event_category' : 'Splash data loading time'
      //       });

      //       var fullTime = timeLogger.snapOnce("FULL");
      //       if (gtag && fullTime) gtag('event', 'timing_complete', {
      //         'name' : 'allyearsload',
      //         'value' : fullTime,
      //         'event_category' : 'Complete data loading time'
      //       });

      //       if ((this.ui||{}).splash) timeLogger.add("FULL");
      //       timeLogger.add("DATA");
      //       timeLogger.update("DATA");

      //       if (snapOnceDataLoaded) {
      //         updateURL(evt);
      //       }

      //       if (!snapOnceDataLoaded && (!(this.ui||{}).splash || fullTime)) {
      //         snapOnceDataLoaded = true;
      //         updateURL(evt, true);
      //     }
      //   },
      //   'persistentChange': function(evt) {
      //       updateURL(evt); // force update
      //   },
      //   'change_hook_which': function(evt, arg) {
      //     if (gtag) gtag('event', 'indicator selected', {
      //       'event_label': arg.which,
      //       'event_category': arg.hook
      //     });
      //   },
      //   'load_error': function(evt, error) {
      //     if (gtag) gtag('event', 'error', {
      //       'event_label': JSON.stringify(error).substring(0, 500), //500 characters is the limit of GA field
      //       'event_category': this._name
      //     });
      //     if (gtag) gtag('event', 'exception', {
      //       'description': JSON.stringify(error).substr(0,150), //150 characters is the limit of GA field
      //       'fatal': true
      //     });

      //     var totalTime = timeLogger.snapOnce("TOTAL");
      //     if (gtag && totalTime) gtag('event', 'timing_complete', {
      //       'name' : 'loadtotal',
      //       'value' : totalTime,
      //       'event_category' : 'Time to error since vizabi object created'
      //     });
      //   },
      //   'dataLoaded': function() {
      //     var dataTime = timeLogger.snapOnce("DATA");
      //     if (gtag && dataTime) gtag('event', 'timing_complete', {
      //       'name' : 'gapfill',
      //       'value' : dataTime,
      //       'event_category' : 'Gap filling time'
      //     });

      //     var totalTime = timeLogger.snapOnce("TOTAL");
      //     if (gtag && totalTime) gtag('event', 'timing_complete', {
      //       'name' : 'loadtotal',
      //       'value' : totalTime,
      //       'event_category' : 'Total loading time since vizabi object created'
      //     });
      //   }
      // }