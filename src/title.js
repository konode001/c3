/**
 * C3 Chart title
 *
 * @param text The title's text
 * @param padding The padding around the title ({ top, bottom, left, right })
 * @param position The position of the title (top-left, top-center, top-right)
 * @param cssClass The css class to apply to the title
 * @param container The SVG container in which to append the title
 * @param computeTextRect A function to compute the size of a text in SVG
 *
 * @constructor
 */
const C3Title = function({ text = '', padding, position = 'top-center', cssClass = '', container, computeTextRect }) {
    this.text = text;
    this.position = position;
    this.padding = Object.assign({ top: 0, bottom: 0, left: 0, right: 0 }, padding || {});
    this.cssClass = cssClass;
    this.computeTextRect = computeTextRect;
    this.element = container.append("text");
};

/**
 * Update the title text, classes and positioning
 *
 * @param currentWidth The current width of the title's container
 */
C3Title.prototype.redraw = function({ currentWidth }) {
    let yOffset = this.padding.top + this.height();

    let xOffset;
    if (this.position.indexOf('right') >= 0) {
        xOffset = currentWidth - this.width() - this.padding.right;
    } else if (this.position.indexOf('center') >= 0) {
        xOffset = (currentWidth - this.width()) / 2;
    } else {
        xOffset = this.padding.left;
    }

    this.element
        .text(this.text)
        .attr('class', this.cssClass)
        .attr('x', xOffset)
        .attr('y', yOffset);
};

/**
 * @returns The box size containing the title
 */
C3Title.prototype.getTextRect = function() {
    if (!this._rectSize) {
        this._rectSize = this.computeTextRect(this.text, this.cssClass, this.element.node());
    }
    return this._rectSize;
};

/**
 * @returns The width of the title excluding its padding
 */
C3Title.prototype.width = function() {
    return this.getTextRect().width;
};

/**
 * @returns The height of the title excluding its padding
 */
C3Title.prototype.height = function() {
    return this.getTextRect().height;
};

/**
 * @returns The height of the title including its padding
 */
C3Title.prototype.outerHeight = function() {
    return this.padding.top + this.height() + this.padding.bottom;
};

export { C3Title };
