import CLASS from './class';

const gridTextDx = (d) =>
    d.position === 'start' ? 4 : d.position === 'middle' ? 0 : -4;

const gridTextAnchor = (d) =>
    d.position ? d.position : "end";

const xGridTextX = (height) =>
    (d) => d.position === 'start' ? -height : d.position === 'middle' ? -height / 2 : 0;

const yGridTextX = (width) =>
    (d) => d.position === 'start' ? 0 : d.position === 'middle' ? width / 2 : width;

/**
 * C3GridLines add handling of custom lines along the X or Y axis.
 *
 * @constructor
 */
const C3GridLines = function({ container, clipPath }) {
    this.gridLines = container
        .append('g')
        .attr('clip-path', clipPath)
        .attr('class', CLASS.grid + ' ' + CLASS.gridLines);

    this.xgridLines = this.gridLines
        .append('g')
        .attr('class', CLASS.xgridLines);

    this.ygridLines = this.gridLines
        .append('g')
        .attr('class', CLASS.ygridLines);
};

/**
 * Updates the displayed grid
 *
 * Should be called if the data has changed.
 *
 * @param xLines the X Grid Lines
 * @param yLines the Y Grid Lines
 * @param duration The transition duration in ms
 * @param rotatedAxis if the X and Y axis should be swapped
 * @param width The chart's width
 * @param height The chart's height
 * @param yv
 * @param xv
 */
C3GridLines.prototype.update = function({ xLines, yLines, duration, rotatedAxis, width, height, yv, xv }) {
    let xSvgLines = this.xgridLines
        .selectAll('.' + CLASS.xgridLine)
        .data(xLines);

    let xSvgLine = xSvgLines
        .enter()
        .append('g')
        .attr('class', (d) => [ CLASS.xgridLine, d.class ].filter((v) => v).join(' '));

    xSvgLine
        .append('line')
        .style('opacity', 0);

    xSvgLine
        .append('text')
        .attr("text-anchor", gridTextAnchor)
        .attr("transform", rotatedAxis ? "" : "rotate(-90)")
        .attr('dx', gridTextDx)
        .attr('dy', -5)
        .text((d) => d.text)
        .style("opacity", 0);

    xSvgLines
        .exit()
        .transition()
        .duration(duration)
        .style('opacity', 0)
        .remove();

    let ySvgLines = this.ygridLines
        .selectAll('.' + CLASS.ygridLine)
        .data(yLines);

    let ySvgLine = ySvgLines
        .enter()
        .append('g')
        .attr('class', (d) => [ CLASS.ygridLine, d.class ].filter((v) => v).join(' '));

    ySvgLine
        .append('line')
        .style('opacity', 0);

    ySvgLine
        .append('text')
        .attr("text-anchor", gridTextAnchor)
        .attr("transform", rotatedAxis ? "rotate(-90)" : "")
        .attr('dx', gridTextDx)
        .attr('dy', -5)
        .style("opacity", 0);

    ySvgLines
        .select('line')
        .transition().duration(duration)
        .attr("x1", rotatedAxis ? yv : 0)
        .attr("x2", rotatedAxis ? yv : width)
        .attr("y1", rotatedAxis ? 0 : yv)
        .attr("y2", rotatedAxis ? height : yv)
        .style("opacity", 1);

    ySvgLines
        .select('text')
        .transition().duration(duration)
        .attr("x", rotatedAxis ? xGridTextX(height) : yGridTextX(width))
        .attr("y", yv)
        .text((d) => d.text)
        .style("opacity", 1);

    ySvgLines
        .exit()
        .transition()
        .duration(duration)
        .style("opacity", 0)
        .remove();

    this.rotatedAxis = rotatedAxis;
    this.width = width;
    this.height = height;
    this.xv = xv;
    this.yv = yv;
};

/**
 * Redraw the grid to the newly updated scale/size
 */
C3GridLines.prototype.redraw = function ({ withTransition }) {
    let lines = this.xgridLines
        .selectAll('line');

    let texts = this.xgridLines
        .selectAll('text');

    return [
        (withTransition ? lines.transition() : lines)
            .attr("x1", this.rotatedAxis ? 0 : this.xv)
            .attr("x2", this.rotatedAxis ? this.width : this.xv)
            .attr("y1", this.rotatedAxis ? this.xv : 0)
            .attr("y2", this.rotatedAxis ? this.xv : this.height)
            .style("opacity", 1),
        (withTransition ? texts.transition() : texts)
            .attr("x", this.rotatedAxis ? yGridTextX(this.width) : xGridTextX(this.height))
            .attr("y", this.xv)
            .style("opacity", 1)
    ];
};

/**
 * Removes C3GridLines from DOM
 */
C3GridLines.prototype.remove = function() {
  this.gridLines.remove();
};

export { C3GridLines };
