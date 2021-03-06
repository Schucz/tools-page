const ChartSwitcher = function (placeHolder, translator, dispatch, { tools, appState, onClick }) {
  const templateHtml = `
    <div class="chart-switcher">
      <a class="chart-switcher-button"></a>
    </div>
    <div class="chart-switcher-options" hidden>
        <div><a rel="noopener"></a></div>
    </div>
  `;
  //require("./chart-switcher.html");

  const template = d3.create("div")
  template.html(templateHtml);

  const itemTemplate = template.select(".chart-switcher-options div");
  const onlyChartTools = tools.filter(({tool}) => tool);
  for (let tool of onlyChartTools) {
    itemTemplate.clone(true)
      .datum(tool)
      .attr("hidden", tool.id === appState.tool ? true : null)
      .raise()
      .call(fillToolItem, this);
  }
  itemTemplate.remove();

  this.areToolsOpen = false;
  const switcher = template.select(".chart-switcher-button");
  switcher.on("click", () => switchTools.call(this));

  for (const elem of Array.from(template.node().children)) {
    placeHolder.append(function() { return elem;});
  }

  translate();
  dispatch.on("translate.chartSwitcher", () => {
    translate();
  });

  dispatch.on("toolChanged.chartSwitcher", d => {
    const tool = tools.filter(({id}) => id === d)[0];
    toolChanged(tool);
  })
  
  d3.select(window).on("resize.chartSwitcher", () => switchTools.call(this, false));
  d3.select(window).on("click.chartSwitcher", () => {
    const event = d3.event;
    if (this.areToolsOpen && event.target && (event.target !== switcher.node())) {
      switchTools.call(this, false);
    }
  });

  function translate() {
    const selectedToolConfig = tools.filter(({id}) => id === appState.tool)[0];
    placeHolder.select(".chart-switcher-button")
      .text(translator(selectedToolConfig.title || selectedToolConfig.id));
    placeHolder.selectAll(".chart-switcher-options div")
      .select("a").text(d => translator(d.title || d.id));
  }

  function toolChanged(tool) {
    placeHolder.select(".chart-switcher-button")
    .text(translator(tool.title || tool.id));
    placeHolder.selectAll(".chart-switcher-options div")
    .attr("hidden", _d => _d.id === tool.id ? true : null)
  }

  function switchTools(force) {
    this.areToolsOpen = force || force === false ? force : !this.areToolsOpen;
    placeHolder.select(".chart-switcher-options").attr("hidden", this.areToolsOpen ? null : true);
  }

  function getLink(tool) {
    return `${window.location.pathname}#$chart-type=${tool}`;
  }

  function fillToolItem(item, _this) {
    const tool = item.datum();
    const a = item.select("a");
    a.attr("href", getLink(tool.id))
      .on("click", d => {
        switchTools.call(_this);
        onClick(d);
      });
  }

}

export default ChartSwitcher;