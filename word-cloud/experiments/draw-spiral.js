// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: redo-alt;

/**
 * Author: Ryan Stanley (stanleyrya@gmail.com)
 * Tips: https://www.paypal.me/stanleyrya
 */

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

  _draw(placementFunction) {
    const centerX = this.ctx.size.width / 2;
    const centerY = this.ctx.size.height / 2;

    let breachedLeft = false;
    let breachedRight = false;
    let breachedTop = false;
    let breachedBottom = false;
    let i =0;
    let x, y, previousResult;
    let pathSet = false;
    const path = new Path();
    while (!(breachedLeft
           && breachedRight
           && breachedTop
           && breachedBottom)& i < 600) {
        previousResult = placementFunction(
          this.ctx.size.width,
          this.ctx.size.height,
          centerX,
          centerY,
          this.xRatio,
          this.yRatio,
          previousResult
        );
        ({ x, y } = previousResult);

        if (!pathSet) {
          path.move(new Point(x, y));
          pathSet = true;
        }

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

  configure(placementFunction) {
    this._draw(placementFunction);
    return this.ctx.getImage();
  }

}

function spiral(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
  let radius = previousResult ?
    previousResult.radius + .75 :
    0;
  let angle = previousResult ?
    previousResult.angle + (Math.PI * 2) / 50 :
    0;
  const x = centerX + radius * Math.cos(angle) * xRatio;
  const y = centerY + radius * Math.sin(angle) * yRatio;
  return { x, y, radius, angle }
}

function  topLeftSpiral(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let radius = previousResult ?
      previousResult.radius + .75 :
      0;
    let angle = previousResult ?
      previousResult.angle + (Math.PI * 2) / 50 :
      0;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return { x, y, radius, angle }
  }

  // https://www.codeproject.com/Articles/1213518/Dancing-with-Spirals
function  trippy(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    let angle = Math.PI/360*i*200;
    let radius = 30+1.4*angle;
    const x = radius * Math.cos(angle) + centerX;
    const y = radius * Math.sin(angle) + centerY;
    return { x, y, radius, angle, i }
  }

    // Logarithmic
  function tightCenterSpiral(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    let angle = Math.PI/360*i*10;
    let radius = 3*Math.exp(.1*angle);
    const x = radius * Math.cos(angle) + centerX;
    const y = radius * Math.sin(angle) + centerY;
    return { x, y, radius, angle, i }
  }

  // Super
function   trippy2(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    let angle = Math.PI/360*i*100;
    let radius = 10000*Math.sqrt(i/600000);
    const x = radius * Math.cos(angle) + centerX;
    const y = radius * Math.sin(angle) + centerY;
    return { x, y, radius, angle, i }
  }

  // Atomic
function  thread(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    let angle = Math.PI/360*i*10;
    let radius = angle / (angle - 2);
    const x = 30 * radius * Math.cos(angle) + centerX;
    const y = 30 * radius * Math.sin(angle) + centerY;
    return { x, y, radius, angle, i }
  }

  // Cochleoid
function  openStar(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    let angle = Math.PI/360*i*100;
    let radius = Math.sin(angle) // / angle;
    const x = 100 * radius * Math.cos(angle) + centerX;
    const y = 100 * radius * Math.sin(angle) + centerY;
    return { x, y, radius, angle, i }
  }

    // Cochleoid
  function tron(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    let angle = Math.PI/360*i*100;
    let radius = Math.tan(angle);
    const x = 100 * radius * Math.sin(angle) + centerX;
    const y = 100 * radius * Math.cos(angle) + centerY;
    return { x, y, radius, angle, i }
  }

function  trippy3(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    const scale = 5;
    const dots = 100;
    const range = 21.4;
    const angle=(Math.PI*range)*i/centerX;
    const x = scale * angle * Math.cos(dots*angle) + centerX;
    const y = scale * angle * Math.sin(dots*angle) + centerY;
    return { x, y, angle, i }
  }

function  star(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    const scale = .25;
    const dots = 100;
    const range = 336;
    const angle=Math.PI*range/centerX*i;
    const x = scale * angle * Math.cos(dots*angle) + centerX;
    const y = scale * angle * Math.sin(dots*angle) + centerY;
    return { x, y, angle, i }
  }

function  mess(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    const scale = 2;
    const dots = 10;
    const range = 2345;
    const angle=Math.PI*range/centerX*i;
    const x = scale * angle * Math.cos(dots*angle) + centerX;
    const y = scale * angle * Math.sin(dots*angle) + centerY;
    return { x, y, angle, i }
  }

function  trippy4(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let i = previousResult ?
      previousResult.i + 1 :
      0;
    const scale = 2;
    const dots = 10;
    const range = 234;
    const angle=Math.PI*range/centerX*i;
    const x = scale * angle * Math.cos(dots*angle) + centerX;
    const y = scale * angle * Math.sin(dots*angle) + centerY;
    return { x, y, angle, i }
  }

let widget = new ListWidget();
let chart = new Spiral(1000, 1000).configure(trippy4);
let image = widget.addImage(chart);

Script.setWidget(widget);
if (!config.runsInWidget) {
  await widget.presentLarge();
}
Script.complete();
