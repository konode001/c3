import CLASS from './class';
import { c3_chart_internal_fn } from './core';
import { isValue } from './util';

c3_chart_internal_fn.initGrid = function () {
    var $$ = this, config = $$.config, d3 = $$.d3;
    $$.grid = $$.main.append('g')
        .attr("clip-path", $$.clipPathForGrid)
        .attr('class', CLASS.grid);
    if (config.grid_x_show) {
        $$.grid.append("g").attr("class", CLASS.xgrids);
    }
    if (config.grid_y_show) {
        $$.grid.append('g').attr('class', CLASS.ygrids);
    }
    if (config.grid_focus_show) {
        $$.grid.append('g')
            .attr("class", CLASS.xgridFocus)
            .append('line')
            .attr('class', CLASS.xgridFocus);
    }
    $$.xgrid = d3.selectAll([]);
};
c3_chart_internal_fn.updateXGrid = function (withoutUpdate) {
    var $$ = this, config = $$.config, d3 = $$.d3,
        xgridData = $$.generateGridData(config.grid_x_type, $$.x),
        tickOffset = $$.isCategorized() ? $$.xAxis.tickOffset() : 0;

    $$.xgridAttr = config.axis_rotated ? {
        'x1': 0,
        'x2': $$.width,
        'y1': function (d) { return $$.x(d) - tickOffset; },
        'y2': function (d) { return $$.x(d) - tickOffset; }
    } : {
        'x1': function (d) { return $$.x(d) + tickOffset; },
        'x2': function (d) { return $$.x(d) + tickOffset; },
        'y1': 0,
        'y2': $$.height
    };

    $$.xgrid = $$.main.select('.' + CLASS.xgrids).selectAll('.' + CLASS.xgrid)
        .data(xgridData);
    $$.xgrid.enter().append('line').attr("class", CLASS.xgrid);
    if (!withoutUpdate) {
        $$.xgrid.attr($$.xgridAttr)
            .style("opacity", function () { return +d3.select(this).attr(config.axis_rotated ? 'y1' : 'x1') === (config.axis_rotated ? $$.height : 0) ? 0 : 1; });
    }
    $$.xgrid.exit().remove();
};

c3_chart_internal_fn.updateYGrid = function () {
    var $$ = this, config = $$.config,
        gridValues = $$.yAxis.tickValues() || $$.y.ticks(config.grid_y_ticks);
    $$.ygrid = $$.main.select('.' + CLASS.ygrids).selectAll('.' + CLASS.ygrid)
        .data(gridValues);
    $$.ygrid.enter().append('line')
        .attr('class', CLASS.ygrid);
    $$.ygrid.attr("x1", config.axis_rotated ? $$.y : 0)
        .attr("x2", config.axis_rotated ? $$.y : $$.width)
        .attr("y1", config.axis_rotated ? 0 : $$.y)
        .attr("y2", config.axis_rotated ? $$.height : $$.y);
    $$.ygrid.exit().remove();
    $$.smoothLines($$.ygrid, 'grid');
};

c3_chart_internal_fn.updateGrid = function () {
    var $$ = this, main = $$.main, config = $$.config;

    // hide if arc type
    $$.grid.style('visibility', $$.hasArcType() ? 'hidden' : 'visible');

    main.select('line.' + CLASS.xgridFocus).style("visibility", "hidden");
    if (config.grid_x_show) {
        $$.updateXGrid();
    }
    // Y-Grid
    if (config.grid_y_show) {
        $$.updateYGrid();
    }
};

c3_chart_internal_fn.showXGridFocus = function (selectedData) {
    var $$ = this, config = $$.config,
        dataToShow = selectedData.filter(function (d) { return d && isValue(d.value); }),
        focusEl = $$.main.selectAll('line.' + CLASS.xgridFocus),
        xx = $$.xx.bind($$);
    if (! config.tooltip_show) { return; }
    // Hide when scatter plot exists
    if ($$.hasType('scatter') || $$.hasArcType()) { return; }
    focusEl
        .style("visibility", "visible")
        .data([dataToShow[0]])
        .attr(config.axis_rotated ? 'y1' : 'x1', xx)
        .attr(config.axis_rotated ? 'y2' : 'x2', xx);
    $$.smoothLines(focusEl, 'grid');
};
c3_chart_internal_fn.hideXGridFocus = function () {
    this.main.select('line.' + CLASS.xgridFocus).style("visibility", "hidden");
};
c3_chart_internal_fn.updateXgridFocus = function () {
    var $$ = this, config = $$.config;
    $$.main.select('line.' + CLASS.xgridFocus)
        .attr("x1", config.axis_rotated ? 0 : -10)
        .attr("x2", config.axis_rotated ? $$.width : -10)
        .attr("y1", config.axis_rotated ? -10 : 0)
        .attr("y2", config.axis_rotated ? -10 : $$.height);
};
c3_chart_internal_fn.generateGridData = function (type, scale) {
    var $$ = this,
        gridData = [], xDomain, firstYear, lastYear, i,
        tickNum = $$.main.select("." + CLASS.axisX).selectAll('.tick').size();
    if (type === 'year') {
        xDomain = $$.getXDomain();
        firstYear = xDomain[0].getFullYear();
        lastYear = xDomain[1].getFullYear();
        for (i = firstYear; i <= lastYear; i++) {
            gridData.push(new Date(i + '-01-01 00:00:00'));
        }
    } else {
        gridData = scale.ticks(10);
        if (gridData.length > tickNum) { // use only int
            gridData = gridData.filter(function (d) { return ("" + d).indexOf('.') < 0; });
        }
    }
    return gridData;
};
