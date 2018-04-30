import { c3_chart_fn } from './core';
import { notEmpty } from './util';

c3_chart_fn.xgrids = function (grids) {
    var $$ = this.internal, config = $$.config;

    if (!grids) {
        return config.grid_x_lines;
    }

    config.grid_x_lines = grids;

    if (notEmpty(config.grid_x_lines) || notEmpty(config.grid_y_lines)) {
        if (!$$.gridLines) {
            $$.gridLines = $$.initGridLines();
        }

        $$.gridLines.update({
            duration: config.transition_duration,
            xLines: config.grid_x_lines,
            yLines: config.grid_y_lines,
            rotatedAxis: config.axis_rotated,
            width: $$.width,
            height: $$.height,
            xv: $$.xv.bind($$),
            yv: $$.yv.bind($$)
        });

        $$.gridLines.redraw({ withTransition: true });

    } else if ($$.gridLines) {
        $$.gridLines.remove();
        $$.gridLines = null;
    }

    return config.grid_x_lines;
};

c3_chart_fn.xgrids.add = function (grids) {
    var $$ = this.internal;
    return this.xgrids($$.config.grid_x_lines.concat(grids ? grids : []));
};

c3_chart_fn.xgrids.remove = function (params) { // TODO: multiple
    var $$ = this.internal, config = $$.config;
    return this.xgrids(config.grid_x_lines
        .filter((line) => params && ((params.value && params.value !== line.value) || (params.class && params.class !== line.class))));
};

c3_chart_fn.ygrids = function (grids) {
    var $$ = this.internal, config = $$.config;

    if (!grids) {
        return config.grid_y_lines;
    }

    config.grid_y_lines = grids;

    if (notEmpty(config.grid_x_lines) || notEmpty(config.grid_y_lines)) {
        if (!$$.gridLines) {
            $$.gridLines = $$.initGridLines();
        }

        $$.gridLines.update({
            duration: config.transition_duration,
            xLines: config.grid_x_lines,
            yLines: config.grid_y_lines,
            rotatedAxis: config.axis_rotated,
            width: $$.width,
            height: $$.height,
            xv: $$.xv.bind($$),
            yv: $$.yv.bind($$)
        });

        $$.gridLines.redraw({ withTransition: true });

    } else if ($$.gridLines) {
        $$.gridLines.remove();
        $$.gridLines = null;
    }

    return config.grid_y_lines;
};

c3_chart_fn.ygrids.add = function (grids) {
    var $$ = this.internal;
    return this.ygrids($$.config.grid_y_lines.concat(grids ? grids : []));
};

c3_chart_fn.ygrids.remove = function (params) { // TODO: multiple
    var $$ = this.internal, config = $$.config;
    return this.ygrids(config.grid_y_lines
        .filter((line) => params && ((params.value && params.value !== line.value) || (params.class && params.class !== line.class))));
};
