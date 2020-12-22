// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: cloud;
/*
 * Authors: Ryan Stanley (stanleyrya@gmail.com)
 * Description: Scriptable code to display a word cloud.
 */

const growToFit = true;
const debug = false;
const minFont = 10;
const maxFont = 60;
const wordData = [  
    { word: "Christmas", weight: 10 },
    { word: "Snow", weight: 10 },
    { word: "Sleigh", weight: 8 },
    { word: "Santa", weight: 7 },
    { word: "Presents", weight: 7},
    { word: "Candy Canes", weight: 7 },
    { word: "Advent", weight: 6},
    { word: "Carol", weight: 6},
    { word: "Chimney", weight: 5},
    { word: "Dreidel", weight: 5},
    { word: "Druid", weight: 3},
    { word: "Eggnog", weight: 3},
    { word: "Elves", weight: 3},
    { word: "Epiphany", weight: 3},
    { word: "Feliz Navidad", weight: 3},
    { word: "Frankincense", weight: 2},
    { word: "Gingerbread", weight: 2},
    { word: "Grinch", weight: 2},
    { word: "Hanukkah", weight: 1},
    { word: "Holly", weight: 1},
    { word: "Jolly", weight: 1}
];

class WordCloud {
  // Started with LineChart by https://kevinkub.de/

  constructor(width, height, wordData, weightFunction, growToFit, debug) {
    this.providedWidth = width;
    this.providedHeight = height;
    this.wordData = wordData;
    this.weightFunction = weightFunction;
    this.growToFit = !!growToFit;
    this.debug = !!debug;

    this.textDimensionsMap = {};
    
    // Stretches the spiral
    const biggestSide = width > height ? width : height;
    this.xRatio = width / biggestSide;
    this.yRatio = height / biggestSide;
    // Controls density by changing how many lines make up a single rotation
    this.partsPerCircle = 100 // 50
    // Controls density by changing the angle of the lines drawn
    this.radiusIncrement = .1 // .75
    // Controls buffer around words and edge of canvas
    this.bufferRoom = 10;
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
        height: (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * 3/4
    };
}

const text = "REPLACE_TEXT";
const font = "REPLACE_FONT";
getTextDimensions(text, font);
`;
  }

  async _getTextDimensions(text, font, fontSize) {
    const cssFont = fontSize + "pt " + font;
    const key = text + " " + cssFont;
    if (this.textDimensionsMap[key]) {
      return this.textDimensionsMap[key];
    } else {
      const javascript = this._getBaseTextDimensionJavascript().replace("REPLACE_TEXT", text).replace("REPLACE_FONT", cssFont);
      const webView = new WebView();
      const value = await webView.evaluateJavaScript(javascript, false);
      this.textDimensionsMap[key] = value;
      return value;
    }
  }
  
  // https://stackoverflow.com/a/306332
  // if (RectA.Left < RectB.Right &&
  //     RectA.Right > RectB.Left &&
  //     RectA.Top < RectB.Bottom &&
  //     RectA.Bottom > RectB.Top) 
  _checkCollision(newRect) {
    for (const placedRect of this.hitBoxes) {
      if (newRect.minX < placedRect.maxX + this.bufferRoom &&
          newRect.maxX > placedRect.minX - this.bufferRoom &&
          newRect.minY < placedRect.maxY + this.bufferRoom &&
          newRect.maxY > placedRect.minY - this.bufferRoom) {
        return true;
      }
    }
    return false;
  }

  _checkOutsideBorders(newRect) {
    if (newRect.minX < 0 + this.bufferRoom ||
        newRect.maxX > this.ctx.size.width - this.bufferRoom ||
        newRect.minY < 0 + this.bufferRoom ||
        newRect.maxY > this.ctx.size.height - this.bufferRoom) {
      return true;
    }
    return false;
  }
  
  async _addTextCentered(x, y, text, font, fontSize, color) {
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
      this.ctx.setLineWidth(5);
      this.ctx.setStrokeColor(Color.red());
      this.ctx.strokeRect(rect);
    }

    // I'm not sure why, but the text is a quarter off from the box.
    const quarterHeight = dimensions.height / 4;
    this.ctx.setTextColor(color);
    this.ctx.setFont(new Font(font, fontSize));
    this.ctx.drawText(text, new Point(topLeftX, topLeftY - quarterHeight));
    return true;
  }
  
  _getRandomDirection() {
    return Math.random() < 0.5 ? -1 : 1;
  }

  async _writeToSpiral(word, weight) {
    let breachedLeft = false;
    let breachedRight = false;
    let breachedTop = false;
    let breachedBottom = false;
    let radius = 0;
    let angle = 0;
    let radiusDirection = this._getRandomDirection();
    let angleDirection = this._getRandomDirection();
    
    const path = new Path();
    path.move(new Point(this.centerX, this.centerY));
    
    let placed = false;
    while (!(breachedLeft
           && breachedRight
           && breachedTop
           && breachedBottom)) {
        radius += this.radiusIncrement * angleDirection;
        angle += (Math.PI * 2) / this.partsPerCircle * radiusDirection;
        let x = this.centerX + radius * Math.cos(angle) * this.xRatio;
        let y = this.centerY + radius * Math.sin(angle) * this.yRatio;

        const { font, fontSize, color } = this.weightFunction(word, weight);
        if (await this._addTextCentered(
          x, y, word, font, fontSize, color
        )) {
          placed = true;
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
    }
    if (this.debug) {
      this.ctx.setLineWidth(1);
      this.ctx.addPath(path);
      this.ctx.setStrokeColor(Color.cyan());
      this.ctx.strokePath();
    }
    return placed;
  }
  
  async _writeAllWordsToSpiral() {
    let placedAll = true;
    for (const wordDatum of this.wordData) {
      if (!(await this._writeToSpiral(wordDatum.word, wordDatum.weight))) {
        placedAll = false;
        // Stop trying to place words if growToFit
        if (this.growToFit) {
          return false;
        }
      }
    }
    return placedAll;
  }
  
  async _getMinArea() {
    let minArea = 0;
    for (const wordDatum of this.wordData) {
      const { font, fontSize, color } = this.weightFunction(wordDatum.word, wordDatum.weight);
      wordDatum.size = await this._getTextDimensions(wordDatum.word, font, fontSize);
      minArea += wordDatum.size.width * wordDatum.size.height;
    }
    return minArea;
  }
  
  async getImage() {
    let ctxWidth = this.providedWidth;
    let ctxHeight = this.providedHeight;
    if (this.growToFit) {
      let minArea = await this._getMinArea();
      while (minArea > (ctxWidth * ctxHeight)) {
        ctxWidth = ctxWidth + (ctxWidth * 0.1);
        ctxHeight = ctxHeight + (ctxHeight * 0.1);
        console.log("increasing because of min area");
      }
    }

    let placedAll = false;
    while(!placedAll) {
      this.ctx = new DrawContext();
      this.ctx.opaque = false;
      this.ctx.size = new Size(ctxWidth, ctxHeight);
      this.centerX = ctxWidth / 2;
      this.centerY = ctxHeight / 2;
      this.hitBoxes = [];

      placedAll = await this._writeAllWordsToSpiral();

      if (!this.growToFit) {
        break;
      }
      
      if (!placedAll) {
        ctxWidth = ctxWidth + (this.providedWidth * 0.1);
        ctxHeight = ctxHeight + (this.providedHeight * 0.1);
        console.log("increasing because words couldn't fit area");
      }
    }
    
    if (this.debug) {
      this.ctx.setStrokeColor(Color.red());
      this.ctx.strokeRect(new Rect(0, 0, ctxWidth, ctxHeight));
    }

    return this.ctx.getImage();
  }

}

/*************************
 ***** CONFIGURATION *****
 *************************/

function weightFunction(text, weight) {
  return {
    font: "TrebuchetMS-Bold",
    fontSize: (weight / 10) * (maxFont - minFont) + minFont,
    color: Device.isUsingDarkAppearance() ? Color.white() : Color.black()
  }
}

async function createWidget(width, height) {
	let widget = new ListWidget();

    widget.backgroundImage = await new WordCloud(width, height, wordData, weightFunction, growToFit, debug).getImage();

	return widget;
}

if (config.runsInWidget) {
    const width = config.widgetFamily === "small" ? 250 : 530;
    const height = config.widgetFamily === "large" ? 530 : 250;
    const widget = await createWidget(width, height);
	Script.setWidget(widget);
	Script.complete();
} else {
    const widget = await createWidget(250, 250);
	await widget.presentSmall();
}
