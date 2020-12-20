// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: redo-alt;
class Spiral {
  // Inspired by https://kevinkub.de/

  constructor(width, height) {
    this.ctx = new DrawContext();
    this.ctx.opaque = false;
    this.ctx.size = new Size(width, height);
    // Controls density by changing how many lines make up a single rotation
    this.partsPerCircle = 50
    // Controls density by changing the angle of the lines drawn
    this.radiusIncrement = .75
    // Stretches the spiral side to side
    this.xRatio = 1
    // Stretches the spiral up and down
    this.yRatio = 1
  }
  
  _drawSpiral() {
    const centerX = this.ctx.size.width / 2;
    const centerY = this.ctx.size.height / 2;

    let breachedLeft = false;
    let breachedRight = false;
    let breachedTop = false;
    let breachedBottom = false;
    let i=0;
    let radius = 0;
    let angle = 0;
    const path = new Path();
    path.move(new Point(centerX, centerY));
    while (!(breachedLeft
           && breachedRight
           && breachedTop
           && breachedBottom)) {
        radius += this.radiusIncrement;
        // make a complete circle every partsPerCicle iterations
        angle += (Math.PI * 2) / this.partsPerCircle;
        var x = centerX + radius * Math.cos(angle) * this.xRatio;
        var y = centerY + radius * Math.sin(angle) * this.yRatio;

        path.addLine(new Point(x, y));

        if (x < 0) {
          breachedLeft = true;
        }
        if (x > this.ctx.size.width) {
          breachedRight = true;
        }
        if (y < 0) {
          breachedTop = true;
        }
        if (y > this.ctx.size.height) {
          breachedBottom = true;
        }
        i++;
    }
    this.ctx.addPath(path);
    this.ctx.setStrokeColor(Color.cyan());
    this.ctx.strokePath();
  }
  
  configure(fn) {
    this._drawSpiral();
    return this.ctx.getImage();
  }

}


let widget = new ListWidget();
let chart = new Spiral(600, 250).configure();
let image = widget.addImage(chart);

Script.setWidget(widget);
if (!config.runsInWidget) {
  await widget.presentMedium();
}
Script.complete();
