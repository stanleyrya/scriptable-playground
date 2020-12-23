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

class WordCloudFont {
  /**
   * Please note that pre-installed fonts need to use
   * the name provieded here: http://iosfonts.com
   * For example: TrebuchetMS-Bold
   *
   * Custom fonts such as google's fonts need to use
   * the name of their font family and the URL to
   * their css stylesheet. Here's an example for
   * google:
   * https://fonts.google.com/specimen/Fredericka+the+Great?sidebar.open=true&selection.family=Fredericka+the+Great#about
   * -> fontName: Fredericka the Great
   * -> cssUrl: https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap
   */
  constructor(fontName, cssUrl) {
    this.fontName = fontName;
    this.cssURL = cssUrl // only for custom fonts
  }
}

class WordCloud {
  // Started with LineChart by https://kevinkub.de/

  constructor(width, height, wordData, weightFunction, growToFit, debug) {
    this.providedWidth = width;
    this.providedHeight = height;
    this.wordData = wordData;
    this.weightFunction = weightFunction;
    this.growToFit = !!growToFit;
    this.debug = !!debug;

    this.webView = new WebView();
    this.loadedCssUrls = {};
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

  _getAddFontHTML(fontFamily, fontCssUrl) {
    return `
// Preconnecting could decrease load time
// https://www.cdnplanet.com/blog/faster-google-webfonts-preconnect/
<link rel="preconnect" href="https://fonts.gstatic.com">

<link href="REPLACE_HREF" rel="stylesheet">

// Load the font so its available in the canvas
<div style="font-family: REPLACE_FONT_FAMILY;">.</div>
`.replace("REPLACE_HREF", fontCssUrl)
.replace("REPLACE_FONT_FAMILY", fontFamily);
  }

  _getTextDimensionJavascript(text, cssFont) {
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

getTextDimensions("REPLACE_TEXT", "REPLACE_FONT");
`.replace("REPLACE_TEXT", text)
.replace("REPLACE_FONT", cssFont);
  }

  async _getTextDimensions(text, wordCloudFont, fontSize) {
    const cssFont = fontSize + "pt " + wordCloudFont.fontName;
    const key = text + " " + cssFont;
    if (this.textDimensionsMap[key]) {
      return this.textDimensionsMap[key];
    } else {
      if (wordCloudFont.cssURL) {
        if (!this.loadedCssUrls[wordCloudFont.cssURL]){ 
          await this.webView.loadHTML(this._getAddFontHTML(wordCloudFont.fontName, wordCloudFont.cssURL));
          this.loadedCssUrls[wordCloudFont.cssURL] = true;
        }
      }

      const value = await this.webView.evaluateJavaScript(
        this._getTextDimensionJavascript(text, cssFont)
      );
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
  
  async _addTextCentered(x, y, text, wordCloudFont, fontSize, color) {
    const dimensions = await this._getTextDimensions(text, wordCloudFont, fontSize);
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
    this.ctx.setFont(
      new Font(wordCloudFont.fontName, fontSize)
    );
    this.ctx.drawText(
      text,
      new Point(topLeftX, topLeftY - quarterHeight)
    );
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

        const { wordCloudFont, fontSize, color } = this.weightFunction(word, weight);
        if (await this._addTextCentered(
          x, y, word, wordCloudFont, fontSize, color
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
      this.ctx.setLineWidth(.1);
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
      const { wordCloudFont, fontSize, color } = this.weightFunction(wordDatum.word, wordDatum.weight);
      wordDatum.size = await this._getTextDimensions(wordDatum.word, wordCloudFont, fontSize);
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
      this.ctx.setLineWidth(5);
      this.ctx.setStrokeColor(Color.red());
      this.ctx.strokeRect(new Rect(0, 0, ctxWidth, ctxHeight));
    }

    return this.ctx.getImage();
  }

}

/****************************
 ***** WEIGHT FUNCTIONS *****
 ****************************/

/**
 * Functions that use fonts already installed in iOS.
 *
 * Find the fonts here:
 * http://iosfonts.com
 */

function simpleAndCleanWeightFunction(text, weight) {
  return {
    wordCloudFont: new WordCloudFont(
      "TrebuchetMS-Bold"
    ),
    fontSize: (weight / 10) * (maxFont - minFont) + minFont,
    color: Device.isUsingDarkAppearance() ? Color.white() : Color.black()
  }
}

function builtInFestiveWeightFunction(text, weight) {
  return {
    wordCloudFont: new WordCloudFont(
      "SnellRoundhand-Black"
    ),
    fontSize: (weight / 10) * (maxFont - minFont) + minFont,
    color: Math.random() < 0.5 ? Color.red() : Color.green()
  }
}

function hackerWeightFunction(text, weight) {
  const color = new Color(
    Color.green().hex,
    Color.green().alpha * (weight / 10)
  );
  return {
    wordCloudFont: new WordCloudFont(
      "CourierNewPS-BoldMT"
    ),
    fontSize: minFont,
    color: color
  }
}

/**
 * Functions that use fonts installed through an app.
 * A url of the css stylesheet is still required due
 * to limitations of the system. The fontName is the
 * font family.
 *
 * This article [1] suggests this app [2] is the
 * safest way to download fonts to iOS. Be careful,
 * use at your own risk!
 *
 * [1] - https://9to5mac.com/2020/06/12/fontcase-open-source-fonts-app-iphone-ipad/?_gl=1*y6rqnk*_ga*YW1wLXQ3TjlTR2RZT2p2TmF0UG95cm1xM09SVXRmOHJwOERaaE1Za0MwQllDQjQzay11M3NDVkc4Wkh6NHVGdEgxeEc.
 * [2] - https://apps.apple.com/us/app/fontcase-manage-your-type/id1205074470
 */

// https://fonts.google.com/specimen/Lacquer
function spookyWeightFunction(text, weight) {
  return {
    wordCloudFont: new WordCloudFont(
      "Lacquer",
      "https://fonts.googleapis.com/css2?family=Lacquer&display=swap"
    ),
    fontSize: (weight / 10) * (maxFont - minFont) + minFont,
    color: Color.orange()
  }
}

// https://fonts.google.com/specimen/Cinzel+Decorative
function customFestiveWeightFunction(text, weight) {
  return {
    wordCloudFont: new WordCloudFont(
      "Cinzel Decorative",
      "https://fonts.googleapis.com/css2?family=Cinzel+Decorative&display=swap"
    ),
    fontSize: (weight / 10) * (maxFont - minFont) + minFont,
    color: Math.random() < 0.5 ? Color.red() : Color.green()
  }
}

// https://fonts.google.com/specimen/Fredericka+the+Great
function stencilWeightFunction(text, weight) {
  return {
    wordCloudFont: new WordCloudFont(
      "Fredericka the Great",
      "https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap"
    ),
    fontSize: (weight / 10) * (maxFont - minFont) + minFont,
    color: Color.lightGray()
  }
}

/*************************
 ***** WIDGET CONFIG *****
 *************************/

async function createWidget(width, height) {
  let widget = new ListWidget();
  widget.setPadding(0,0,0,0);

  const image = await new WordCloud(
    width,
    height,
    wordData,
    hackerWeightFunction,
    growToFit,
    debug
  ).getImage();
  const widgetImage = widget.addImage(image);
  widgetImage.applyFillingContentMode();
  widgetImage.centerAlignImage();

  return widget;
}

if (config.runsInWidget) {
  const width = config.widgetFamily === "small" ? 250 : 530;
  const height = config.widgetFamily === "large" ? 530 : 250;
  const widget = await createWidget(width, height);
  Script.setWidget(widget);
  Script.complete();
} else {
  const widget = await createWidget(530, 530);
  await widget.presentLarge();
}
