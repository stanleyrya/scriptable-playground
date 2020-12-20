// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: cloud;

/*
 * Authors: Ryan Stanley (stanleyrya@gmail.com)
 * Description: Scriptable code to display a word cloud.
 */

const debug = false;
const wordData = [  
    { word: "Christmas", weight: 10 },
    { word: "Snow", weight: 9 },
    { word: "Sleigh", weight: 6 },
    { word: "Santa", weight: 5 },
    { word: "Presents", weight: 3},
    { word: "Candy Canes", weight: 3 }
];

class WordCloud {
  // Started with LineChart by https://kevinkub.de/

  constructor(width, height, wordData, debug) {
    this.ctx = new DrawContext();
    this.ctx.opaque = true;
    this.ctx.size = new Size(width, height);
    this.wordData = wordData;
    this.debug = !!debug;
    this.hitBoxes = [];
    
    // Controls density by changing how many lines make up a single rotation
    this.partsPerCircle = 50 // 50
    // Controls density by changing the angle of the lines drawn
    this.radiusIncrement = .1 // .75
    // Stretches the spiral side to side
    this.xRatio = 2 // 1
    // Stretches the spiral up and down
    this.yRatio = 1 // 1
  }

  _getBaseTextDimensionJavascript() {
    return `
/**
 * Uses canvas.measureText to compute and return the dimensions of the given text of given font in pixels.
 * 
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 * 
 * @see Inspired from: https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextDimensions(text, font) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return {
        // I'm not sure why yet but 3/4 is perfect for Scriptable's DrawContext
        width: metrics.width * 3/4,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    };
}

const text = "REPLACE_TEXT";
const font = "REPLACE_FONT";
getTextDimensions(text, font);
`;
  }

  async _getTextDimensions(text, font, fontSize) {
    const cssFont = fontSize + "pt " + font;
    const javascript = this._getBaseTextDimensionJavascript().replace("REPLACE_TEXT", text).replace("REPLACE_FONT", cssFont);
    const webView = new WebView();
    return await webView.evaluateJavaScript(javascript, false)
  }
  
  // https://stackoverflow.com/a/306332
  // if (RectA.Left < RectB.Right &&
  //     RectA.Right > RectB.Left &&
  //     RectA.Top < RectB.Bottom &&
  //     RectA.Bottom > RectB.Top) 
  _checkCollision(newRect) {
    for (const placedRect of this.hitBoxes) {
      if (newRect.minX < placedRect.maxX &&
          newRect.maxX > placedRect.minX &&
          newRect.minY < placedRect.maxY &&
          newRect.maxY > placedRect.minY) {
        return true;
      }
    }
    return false;
  }

  _checkOutsideBorders(newRect) {
    if (newRect.minX < 0 ||
        newRect.maxX > this.ctx.size.width ||
        newRect.minY < 0 ||
        newRect.maxY > this.ctx.size.height) {
      return true;
    }
    return false;
  }
  
  async _addTextCentered(x, y, text, font, fontSize) {
    const dimensions = await this._getTextDimensions(text, font, fontSize);
    const topLeftX = x - (dimensions.width / 2);
    const topLeftY = y - (dimensions.height / 2);
    const rect = new Rect(
      topLeftX,
      topLeftY,
      dimensions.width,
      dimensions.height
    );

    if (this._checkCollision(rect) ||
        this._checkOutsideBorders(rect)) {
      return false;
    }

    this.hitBoxes.push(rect);

    if (this.debug) {
      this.ctx.setFillColor(Color.red());
      this.ctx.fillRect(rect);
    }

    this.ctx.setFont(new Font(font, fontSize));
    this.ctx.drawText(text, new Point(topLeftX, topLeftY));
    return true;
  }
  
  async _addWeightedTextCentered(x, y, text, weight) {
    return await this._addTextCentered(
      x, y,
      text,
      "TrebuchetMS-Bold",
      weight * 6
    )
  }
  
  async _writeToSpiral() {
    const centerX = this.ctx.size.width / 2;
    const centerY = this.ctx.size.height / 2;
    let wordIndex = 0;

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

        if (await this._addWeightedTextCentered(
          x, y,
          this.wordData[wordIndex].word,
          this.wordData[wordIndex].weight
        )) {
          wordIndex++;
        }
        if (wordIndex >= this.wordData.length) {
          break;
        }

        if (this.debug) {
          path.addLine(new Point(x, y));
        }

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
  
  async getImage() {
    await this._writeToSpiral();
    return this.ctx.getImage();
  }

}

/*****************************************
 ***** SCRIPTABLE & WIDGET FUNCTIONS *****
 *****************************************/

async function createWidget(location) {
	let widget = new ListWidget();
  
    let chart = await new WordCloud(600, 250, wordData, debug).getImage();
    let image = widget.addImage(chart);

	return widget;
}

const widget = await createWidget();
if (config.runsInWidget) {
	Script.setWidget(widget);
	Script.complete();
} else {
	await widget.presentMedium();
}
