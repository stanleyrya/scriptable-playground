// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: redo-alt;
class Spiral {
  // Inspired by https://kevinkub.de/

  constructor(width, height) {
    this.ctx = new DrawContext();
    this.ctx.opaque = false;
    this.ctx.size = new Size(width, height);
    this.spacing = 50;
  }
  
  _drawSpiral() {
    const centerX = this.ctx.size.width / 2;
    const centerY = this.ctx.size.height / 2;

    let radius = 0;
    let angle = 0;
    const path = new Path();
    path.move(new Point(centerX, centerY));
    for (let i = 0; i < 150; i++) {
        radius += 0.75;
        // make a complete circle every 50 iterations
        angle += (Math.PI * 2) / this.spacing;
        var x = centerX + radius * Math.cos(angle);
        var y = centerY + radius * Math.sin(angle);
        path.addLine(new Point(x, y));
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
