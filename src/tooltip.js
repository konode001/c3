import CLASS from './class';
import { c3_chart_internal_fn } from './core';
import { isValue, isFunction, isArray, isString, sanitise } from './util';

c3_chart_internal_fn.initTooltip = function () {
    var $$ = this, config = $$.config, i;
    $$.tooltip = $$.selectChart
        .style("position", "relative")
      .append("div")
        .attr('class', CLASS.tooltipContainer)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("display", "none");
    // Show tooltip if needed
    if (config.tooltip_init_show) {
        if ($$.isTimeSeries() && isString(config.tooltip_init_x)) {
            config.tooltip_init_x = $$.parseDate(config.tooltip_init_x);
            for (i = 0; i < $$.data.targets[0].values.length; i++) {
                if (($$.data.targets[0].values[i].x - config.tooltip_init_x) === 0) { break; }
            }
            config.tooltip_init_x = i;
        }
        $$.tooltip.html(config.tooltip_contents.call($$, $$.data.targets.map(function (d) {
            return $$.addName(d.values[config.tooltip_init_x]);
        }), $$.axis.getXAxisTickFormat(), $$.getYFormat($$.hasArcType()), $$.color));
        $$.tooltip.style("top", config.tooltip_init_position.top)
            .style("left", config.tooltip_init_position.left)
            .style("display", "block");
    }
};
c3_chart_internal_fn.getTooltipSortFunction = function() {
    var $$ = this, config = $$.config;

    if (config.data_groups.length === 0 || config.tooltip_order !== undefined) {
        // if data are not grouped or if an order is specified
        // for the tooltip values we sort them by their values

        var order = config.tooltip_order;
        if (order === undefined) {
            order = config.data_order;
        }

        var valueOf = function(obj) {
            return obj ? obj.value : null;
        };

        // if data are not grouped, we sort them by their value
        if (isString(order) && order.toLowerCase() === 'asc') {
            return function(a, b) {
                return valueOf(a) - valueOf(b);
            };
        } else if (isString(order) && order.toLowerCase() === 'desc') {
            return function (a, b) {
                return valueOf(b) - valueOf(a);
            };
        } else if (isFunction(order)) {

            // if the function is from data_order we need
            // to wrap the returned function in order to format
            // the sorted value to the expected format

            var sortFunction = order;

            if (config.tooltip_order === undefined) {
                sortFunction = function (a, b) {
                    return order(a ? {
                        id: a.id,
                        values: [ a ]
                    } : null, b ? {
                        id: b.id,
                        values: [ b ]
                    } : null);
                };
            }

            return sortFunction;

        } else if (isArray(order)) {
            return function(a, b) {
                return order.indexOf(a.id) - order.indexOf(b.id);
            };
        }
    } else {
        // if data are grouped, we follow the order of grouped targets
        var ids = $$.orderTargets($$.data.targets).map(function(i) {
            return i.id;
        });

        return function(a, b) {
            return ids.indexOf(a.id) - ids.indexOf(b.id);
        };
    }
};

c3_chart_internal_fn.getTooltipDef = function (d, defaultTitleFormat, defaultValueFormat, color) {
    var $$ = this, config = $$.config,
        titleFormat = config.tooltip_format_title || defaultTitleFormat,
        nameFormat = config.tooltip_format_name || function (name) { return name; },
        valueFormat = config.tooltip_format_value || defaultValueFormat;

    var tooltipSortFunction = this.getTooltipSortFunction();
    if(tooltipSortFunction) {
        d.sort(tooltipSortFunction);
    }

    var def = {
        data: d.reduce(function (acc, point) {
            if (!point || point.name === null || !(point.value || point.value === 0)) {
                return acc;
            }

            var value = sanitise(valueFormat(point.value, point.ratio, point.id, point.index, point));
            if (value === undefined) {
                return acc;
            }

            acc.push({
                d: point,
                cssClass: $$.CLASS.tooltipName + '-' + $$.getTargetSelectorSuffix(point.id),
                bgColor: $$.levelColor ? $$.levelColor(point.value) : color(point.id),
                value: value,
                name: sanitise(nameFormat(point.name, point.ratio, point.id, point.index))
            });

            return acc;
        }, [])
    };

    if (def.data.length > 0) {
        var x = def.data[0].d.x;
        def.title = sanitise(titleFormat ? titleFormat(x) : x);
    }

    return def;
};

c3_chart_internal_fn.getTooltipContent = function (d, defaultTitleFormat, defaultValueFormat, color) {
    var $$ = this,
        config = $$.config,
        def = $$.getTooltipDef(d, defaultTitleFormat, defaultValueFormat, color);

    var drawRow = function(row) {
        return '<tr class="' + row.cssClass + '">' +
                    '<td class="name">' +
                        '<span style="background-color:' + row.bgColor + ';"></span> ' +
                        row.name +
                    '</td>' +
                    '<td class="value">' +
                        row.value +
                    '</td>' +
                '</tr>';
    };

    var colspan;
    var html = '';
    if (config.tooltip_columns_enabled) {
        var columnsSize = Math.ceil(def.data.length / Math.ceil(def.data.length / config.tooltip_columns_maxSize));

        colspan = Math.ceil(def.data.length / columnsSize);

        html += '<tr style="border:none;">';
        def.data.map(function(item, index) {
            return index % columnsSize === 0 ? def.data.slice(index, index + columnsSize) : null;
        }).filter(function(item) {
            return item;
        }).forEach(function(column) {
            html += '<td style="vertical-align:top;padding:0;border:none;background:none;"><table>';
            for (var i = 0; i < column.length; i++) {
                html += drawRow(column[i]);
            }
            html += '</table></td>';
        });
        html += '</tr>';
    } else {
        colspan = 2;
        html = def.data.reduce(function(html, row) {
            return html + drawRow(row);
        }, html);
    }

    return '<table class="' + $$.CLASS.tooltip + '">' +
            ((def.title || def.title === 0) ? '<tr><th colspan="' + colspan + '">' + def.title + '</th></tr>' : '') +
            html +
            '</table>';
};

c3_chart_internal_fn.tooltipPosition = function (dataToShow, tWidth, tHeight, element) {
    var $$ = this, config = $$.config, d3 = $$.d3;
    var svgLeft, tooltipLeft, tooltipRight, tooltipTop, chartRight;
    var forArc = $$.hasArcType(),
        mouse = d3.mouse(element);
  // Determin tooltip position
    if (forArc) {
        tooltipLeft = (($$.width - ($$.isLegendRight ? $$.getLegendWidth() : 0)) / 2) + mouse[0];
        tooltipTop = ($$.hasType('gauge') ? $$.height : $$.height / 2) + mouse[1] + 20;
    } else {
        svgLeft = $$.getSvgLeft(true);
        if (config.axis_rotated) {
            tooltipLeft = svgLeft + mouse[0] + 100;
            tooltipRight = tooltipLeft + tWidth;
            chartRight = $$.currentWidth - $$.getCurrentPaddingRight();
            tooltipTop = $$.x(dataToShow[0].x) + 20;
        } else {
            tooltipLeft = svgLeft + $$.getCurrentPaddingLeft(true) + $$.x(dataToShow[0].x) + 20;
            tooltipRight = tooltipLeft + tWidth;
            chartRight = svgLeft + $$.currentWidth - $$.getCurrentPaddingRight();
            tooltipTop = mouse[1] + 15;
        }

        if (tooltipRight > chartRight) {
            // 20 is needed for Firefox to keep tooltip width
            tooltipLeft -= tooltipRight - chartRight + 20;
        }
        if (tooltipTop + tHeight > $$.currentHeight) {
            tooltipTop -= tHeight + 30;
        }
    }
    if (tooltipTop < 0) {
        tooltipTop = 0;
    }
    return {top: tooltipTop, left: tooltipLeft};
};
c3_chart_internal_fn.showTooltip = function (selectedData, element) {
    var $$ = this, config = $$.config;
    var tWidth, tHeight, position;
    var forArc = $$.hasArcType(),
        dataToShow = selectedData.filter(function (d) { return d && isValue(d.value); }),
        positionFunction = config.tooltip_position || c3_chart_internal_fn.tooltipPosition;
    if (dataToShow.length === 0 || !config.tooltip_show) {
        return;
    }
    $$.tooltip.html(config.tooltip_contents.call($$, selectedData, $$.axis.getXAxisTickFormat(), $$.getYFormat(forArc), $$.color)).style("display", "block");

    // Get tooltip dimensions
    tWidth = $$.tooltip.property('offsetWidth');
    tHeight = $$.tooltip.property('offsetHeight');

    position = positionFunction.call(this, dataToShow, tWidth, tHeight, element);
    // Set tooltip
    $$.tooltip
        .style("top", position.top + "px")
        .style("left", position.left + 'px');
};
c3_chart_internal_fn.hideTooltip = function () {
    this.tooltip.style("display", "none");
};
