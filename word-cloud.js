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

class PerformanceDebugger {

  constructor() {
    this.performanceResultsInMillis = {};
  }

  /**
   * Times a function's execution in milliseconds and stores the results in the performanceResultsInMillis object.
   *
   * Here are two examples on how to use it, one without parameters and one with:
   * let currLocation = await performanceWrapper(getCurrentLocation);
   * let wikiArticles = await performanceWrapper(getNearbyWikiArticles, [currLocation.latitude, currLocation.longitude]);
   *
   * Here's an example of what the performanceResultsInMillis would look like after those two function calls:
   * { "getCurrentLocation": 3200, "getNearbyWikiArticles": 312 }
   */
  async wrap(fn, args, context, customName) {
    const start = Date.now();
    const result = await fn.apply(context, args);
    const end = Date.now();
    const name = customName || fn.name;
    this.performanceResultsInMillis[name] = (end - start);
    return result;
  }

  /**
   * Attempts to write the performanceResultsInMillis object to the relative file path.
   *
   * Example file output looks like this:
   * getCurrentLocation, getNearbyWikiArticles
   * 3200, 312
   * 450, 300
   */
  async appendPerformanceDataToFile(relativePath) {
    const fm = this.getFileManager();
    const metricsPath = this.getCurrentDir() + relativePath;

    const splitRelativePath = relativePath.split("/");
    if (splitRelativePath > 1) {
      const fileName = splitRelativePath[splitRelativePath.length - 1];
      const jsonDirectory = metricsPath.replace("/" + fileName, "");
      fm.createDirectory(jsonDirectory, true);
    }

    if (fm.fileExists(metricsPath) && fm.isDirectory(metricsPath)) {
      throw ("Performance file is a directory, please delete!");
    }

    let headersAvailable = Object.getOwnPropertyNames(this.performanceResultsInMillis);

    let headers;
    let fileData;

    if (fm.fileExists(metricsPath)) {
      console.log("File exists, reading headers. To keep things easy we're only going to write to these headers.");

      // Doesn't fail with local filesystem
      await fm.downloadFileFromiCloud(metricsPath);

      fileData = fm.readString(metricsPath);
      const firstLine = this.getFirstLine(fileData);
      headers = firstLine.split(',');
    } else {
      console.log("File doesn't exist, using available headers.");
      headers = headersAvailable;
      fileData = headers.toString();
    }

    // Append the data if it exists for the available headers
    fileData = fileData.concat("\n");
    for (const header of headers) {
      if (this.performanceResultsInMillis[header]) {
        fileData = fileData.concat(this.performanceResultsInMillis[header]);
      } else {
        fileData = fileData.concat(-1);
      }
      fileData = fileData.concat(",");
    }
    fileData = fileData.slice(0, -1);

    fm.writeString(metricsPath, fileData);
  }

  getFirstLine(text) {
    var index = text.indexOf("\n");
    if (index === -1) index = undefined;
    return text.substring(0, index);
  }

  getFileManager() {
    try {
      return FileManager.iCloud();
    } catch (e) {
      return FileManager.local();
    }
  }

  getCurrentDir() {
    const fm = this.getFileManager();
    const thisScriptPath = module.filename;
    return thisScriptPath.replace(fm.fileName(thisScriptPath, true), '');
  }

}
const overallPerformanceDebugger = new PerformanceDebugger();
const deeperPerformanceDebugger = new PerformanceDebugger();

class WordCloudWord {
  constructor({ word, weight }) {
    if (!word) {
      throw ("word is required!");
    }
    if (!weight) {
      throw ("weight is required!");
    }
    this.word = word;
    this.weight = weight
  }
}

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
class WordCloudFont {
  constructor({ fontName, cssUrl }) {
    if (!fontName) {
      throw ("fontName is required!");
    }
    this.fontName = fontName;
    this.cssURL = cssUrl // only for custom fonts
  }
}

class WordCloudProcessedWord {
  constructor({ word, wordCloudFont, fontSize, color }) {
    if (!word) {
      throw ("word is required!");
    }
    if (!wordCloudFont) {
      throw ("wordCloudFont is required!");
    }
    if (!(wordCloudFont instanceof WordCloudFont)) {
      throw ("wordCloudFont must be a WordCloudFont object!");
    }
    if (!fontSize) {
      throw ("fontSize is required!");
    }
    if (!color) {
      throw ("color is required!");
    }
    this.word = word;
    this.wordCloudFont = wordCloudFont;
    this.fontSize = fontSize;
    this.color = color;
  }
}

/**
 * A word cloud.
 */
class WordCloud {

  /**
   * Required:
   *
   * @param {number} width
   *   - The width of the canvas.
   * @param {number} height
   *   - The height of the canvas.
   * @param {WordCloudWord[]} wordData
   *   - The words that will be displayed on the
   *     canvas.
   *
   * Optional:
   *
   * @param {weightFunction}
   *   [weightFunction=this._defaultWeightFunction]
   *   - A function that processes words before they
   *     are placed on the canvas.
   * @param {boolean} [growToFit=true]
   *   - A boolean that determines if the word cloud
   *     should expand the canvas to fit all of the
   *     provided words.
   * @param {growthFunction}
   *   [growthFunction=this._defaultGrowthFunction]
   *   - A function that determines how the canvas
   *     should grow if growToFit is true.
   * @param {boolean} [debug=false]
   *   - A boolean that writes additional context to
   *     the canvas for debugging.
   */
  constructor({
    width,
    height,
    wordCloudWords,
    weightFunction = this._defaultWeightFunction,
    placementFunction = this._defaultPlacementFunction,
    growToFit = true,
    growthFunction = this._defaultGrowthFunction,
    debug = false
  }) {
    this.providedWidth = width;
    this.providedHeight = height;
    this.placementFunction = placementFunction;
    this.weightFunction = weightFunction;
    this.growToFit = !!growToFit;
    this.growthFunction = growthFunction;
    this.debug = !!debug;

    this.processedWords = wordCloudWords.map(wordCloudWord => this.weightFunction(wordCloudWord));
    this.wordsToPlace = [...this.processedWords];
    this.placedWords = [];

    this.webView = new WebView();
    this.loadedCssUrls = {};
    this.textDimensionsMap = {};

    // Controls buffer around words and border
    this.bufferRoom = 10;

    // Can be used to stretch the placementFunction
    const biggestSide = width > height ? width : height;
    this.xRatio = width / biggestSide;
    this.yRatio = height / biggestSide;
  }

  /**
   * This is the default weight function that gets
   * included with the WordCloud class.
   * Please use it as an example!
   *
   * @param {WordCloudWord} wordCloudWord
   *   - The word that is being processed.
   * @return {WordCloudProcessedWord}
   *   - The word after processing.
   */
  _defaultWeightFunction(wordCloudWord) {
    return new WordCloudProcessedWord({
      word: wordCloudWord.word,
      wordCloudFont: new WordCloudFont({
        fontName: "TrebuchetMS-Bold"
      }),
      fontSize: (wordCloudWord.weight / 10) * (maxFont - minFont) + minFont,
      color: Device.isUsingDarkAppearance() ? Color.white() : Color.black()
    });
  }

  /**
   * This is the default growth function that gets
   * included with the WordCloud class.
   * Please use it as an example!
   *
   * @param {number} currentWidth
   * @param {number} currentHeight
   * @param {number} originalWidth
   * @param {number} originalHeight
   * @return { number, number } { width, height }
   *   - The new width and height after processing.
   */
  _defaultGrowthFunction(currentWidth, currentHeight, originalWidth, originalHeight) {
    return {
      width: currentWidth + currentWidth * 0.1,
      height: currentHeight + currentHeight * 0.1
    }
  }

  /**
   * This is the default placement function that gets
   * included with the WordCloud class.
   * Please use it as an example!
   *
   * @param {number} width
   * @param {number} height
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} xRatio - Useful for scaling.
   * @param {number} yRatio - Useful for scaling.
   * @param {Object} previousResult
   *  - The previously returned object. Useful to
   *    store state.
   * @return { number, number, ... } { x, y, ... }
   *  - The new x and y after processing. Return
   *    any other information you may find useful!
   */
  _defaultPlacementFunction(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
    let radius, radiusDirection, angle, angleDirection;
    if (previousResult) {
      ({
        radius,
        radiusDirection,
        angle,
        angleDirection
      } = previousResult);
      // 0.1, 100
      radius += .75 * radiusDirection;
      angle += (Math.PI * 2) / 50 * angleDirection;
    } else {
      radius = 0;
      angle = 0;
      radiusDirection = Math.random() < 0.5 ? -1 : 1;
      angleDirection = Math.random() < 0.5 ? -1 : 1;
    }

    const x = centerX + radius * Math.cos(angle) * xRatio;
    const y = centerY + radius * Math.sin(angle) * yRatio;
    return { x, y, radius, angle, radiusDirection, angleDirection }
  }

  /**
   * Uses Scriptable's WebView to load a custom font.
   * iOS custom fonts aren't loaded on the HTML
   * document canvas so they have to be loaded using
   * their css stylesheet.
   *
   * @param {string} fontFamily
   *  - The font family being loaded.
   * @param {string} fontCssUrl
   *  - The css url that will be loaded.
   * @return {Promise}
   *  - A promise that the font was loaded.
   */
  _loadFontToWebView(fontFamily, fontCssUrl) {
    const html = `
      // Preconnecting could decrease load time if using a Google font
      // https://www.cdnplanet.com/blog/faster-google-webfonts-preconnect/
      <link rel="preconnect" href="https://fonts.gstatic.com">

      <link href="REPLACE_HREF" rel="stylesheet">

      // Load the font so its available in the canvas
      <div style="font-family: REPLACE_FONT_FAMILY;">.</div>
`
      .replace("REPLACE_HREF", fontCssUrl)
      .replace("REPLACE_FONT_FAMILY", fontFamily);

    return this.webView.loadHTML(html);
  }

  /**
   * Uses Scriptable's WebView to call
   * canvas.measureText on the given text of given
   * font in pixels.
   *
   * @param {string} text
   *  - The text to be rendered.
   * @param {string} font
   *  - The css font descriptor that text is to be
   *    rendered with (e.g. "bold 14px verdana").
   * @return { number, number } { width, height }
   *  - The width and height of the text.
   *
   * @see Inspired from: https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
   */
  _getTextDimensionsUsingWebView(text, cssFont) {
    const javascript = `
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
`
      .replace("REPLACE_TEXT", text)
      .replace("REPLACE_FONT", cssFont);

    return this.webView.evaluateJavaScript(javascript);
  }

  /**
   * The Scriptable WebView can use the HTML document
   * canvas to measure a word's width and height. It
   * can't return an image file so the rest of the
   * script uses the Scriptable DrawContext to create
   * the image.
   *
   * Custom fonts aren't loaded on the HTML document
   * canvas so they have to be loaded using their css
   * stylesheet.
   */
  async _getTextDimensions(text, wordCloudFont, fontSize) {
    const cssFont = fontSize + "pt " + wordCloudFont.fontName;
    const key = text + " " + cssFont;

    if (this.textDimensionsMap[key]) {
      return this.textDimensionsMap[key];
    } else {
      // If we are using a custom font and it hasn't
      // been loaded before, load it to the WebView.
      if (wordCloudFont.cssURL) {
        if (!this.loadedCssUrls[wordCloudFont.cssURL]) {
          await this._loadFontToWebView(wordCloudFont.fontName, wordCloudFont.cssURL);
          this.loadedCssUrls[wordCloudFont.cssURL] = true;
        }
      }

      const value = await this._getTextDimensionsUsingWebView(text, cssFont);
      this.textDimensionsMap[key] = value;
      return value;
    }
  }

  /**
   * if (RectA.Left < RectB.Right &&
   *     RectA.Right > RectB.Left &&
   *     RectA.Top < RectB.Bottom &&
   *     RectA.Bottom > RectB.Top)
   *
   * https://stackoverflow.com/a/306332
   */
  _checkRectCollision(newRect) {
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

  _checkRectOutsideBorders(newRect) {
    if (newRect.minX < 0 + this.bufferRoom ||
      newRect.maxX > this.width - this.bufferRoom ||
      newRect.minY < 0 + this.bufferRoom ||
      newRect.maxY > this.height - this.bufferRoom) {
      // console.log("outside borders!");
      return true;
    }
    return false;
  }

  _checkPointCollision(x, y) {
    for (const placedRect of this.hitBoxes) {
      if (x < placedRect.maxX + this.bufferRoom &&
        x > placedRect.minX - this.bufferRoom &&
        y < placedRect.maxY + this.bufferRoom &&
        y > placedRect.minY - this.bufferRoom) {
        return true;
      }
    }
    return false;
  }

  async _addTextCentered({ x, y, processedWord, shouldDraw, checkHitboxes }) {
    const { word, wordCloudFont, fontSize, color } = processedWord;
    const dimensions = await this._getTextDimensions(word, wordCloudFont, fontSize);
    const topLeftX = x - (dimensions.width / 2);
    const topLeftY = y - (dimensions.height / 2);
    const rect = new Rect(
      topLeftX,
      topLeftY,
      dimensions.width,
      dimensions.height
    );

    if (checkHitboxes && this._checkRectCollision(rect)) {
      return {
        textPlaced: false,
        rectCollision: true,
        outsideBorders: false
      };
    }
    if (this._checkRectOutsideBorders(rect)) {
      return {
        textPlaced: false,
        rectCollision: false,
        outsideBorders: true
      };
    }

    console.log("writing " + word);
    this.hitBoxes.push(rect);

    if (shouldDraw) {
      if (this.debug) {
        this.ctx.setLineWidth(5);
        this.ctx.setStrokeColor(Color.red());
        this.ctx.strokeRect(rect);
      }

      // I'm not sure why, but the text is a quarter off from the box.
      const quarterHeight = dimensions.height / 4;
      this.ctx.setTextColor(color);
      this.ctx.setFont(new Font(wordCloudFont.fontName, fontSize));
      this.ctx.drawText(word, new Point(topLeftX, topLeftY - quarterHeight));
    }
    return {
      textPlaced: true,
      rectCollision: false,
      outsideBorders: false
    };
  }

  async _writeToSpiral(processedWord, shouldDraw) {
    let breachedLeft = false;
    let breachedRight = false;
    let breachedTop = false;
    let breachedBottom = false;
    let previousResult, x, y;

    const path = new Path();
    path.move(new Point(this.centerX, this.centerY));

    let placed = false;
    while (!(breachedLeft && breachedRight && breachedTop && breachedBottom)) {
      previousResult = this.placementFunction(
        this.width,
        this.height,
        this.centerX,
        this.centerY,
        this.xRatio,
        this.yRatio,
        previousResult
      );
      ({ x, y } = previousResult);

      if (this.debug && shouldDraw) {
        path.addLine(new Point(x, y));
      }
      // TODO: Check point outside borders?
      if (this._checkPointCollision(x, y)) {
        continue;
      }

      if (processedWord) {
        const { textPlaced, rectCollision, outsideBorders } = await this._addTextCentered({
          x,
          y,
          processedWord,
          shouldDraw,
          checkHitboxes: true
        });
        if (textPlaced) {
          this.placedWords.push({
            xFromCenter: x - this.centerX,
            yFromCenter: y - this.centerY,
            processedWord
          });
          this.wordsToPlace.shift();
          placed = true;
          break;
        }
        // If we're growing to fit, break out so the word cloud is tightly packed
        if (outsideBorders && this.growToFit) {
          break;
        }
      }

      if (x < 0) {
        breachedLeft = true;
      }
      if (x > this.width) {
        breachedRight = true;
      }
      if (y < 0) {
        breachedTop = true;
      }
      if (y > this.height) {
        breachedBottom = true;
      }
    }
    if (this.debug && shouldDraw) {
      this.ctx.setLineWidth(.5);
      this.ctx.addPath(path);
      this.ctx.setStrokeColor(Color.cyan());
      this.ctx.strokePath();
    }
    return placed;
  }

  async _writePendingWords(shouldDraw) {
    console.log("writing pending words");
    let placedAll = true;
    // this.wordsToPlace is edited as words are placed
    // To be safe, copy it locally first
    const copiedWordsToPlace = [...this.wordsToPlace];
    for (const processedWord of copiedWordsToPlace) {
      if (!(await this._writeToSpiral(processedWord, shouldDraw))) {
        placedAll = false;
        // Stop trying to place words if growToFit
        if (this.growToFit) {
          return false;
        }
      }
    }
    return placedAll;
  }

  async _writeAlreadyPlacedWords(shouldDraw) {
    console.log("writing already placed words");
    for (const placedWord of this.placedWords) {
      await this._addTextCentered({
        x: placedWord.xFromCenter + this.centerX,
        y: placedWord.yFromCenter + this.centerY,
        processedWord: placedWord.processedWord,
        shouldDraw,
        checkHitboxes: false
      })
    }
  }

  /**
   * Returns some statistics about the words provided
   * so the DrawContext can be adjusted to fit them.
   *
   * @return { number, number, number }
   *         { minWidth, minHeight, minArea }
   *  - The minimum width, height, and area that the
   *    canvas needs to fit the words.
   */
  async _getWordStats() {
    let minWidth = 0;
    let minHeight = 0;
    let minArea = 0;
    for (const processedWord of this.processedWords) {
      const { word, wordCloudFont, fontSize, color } = processedWord;
      const dimensions = await this._getTextDimensions(word, wordCloudFont, fontSize);

      if (minWidth < dimensions.width) {
        minWidth = dimensions.width;
      }
      if (minHeight < dimensions.height) {
        minHeight = dimensions.height;
      }

      minArea += dimensions.width * dimensions.height;
    }
    return { minWidth, minHeight, minArea };
  }

  /**
   * All words that are more than half of the width
   * can't be placed next to each other. This means
   * they have to be stacked and their combined
   * height needs to be at least as long as the draw
   * context. The same can be said about words that
   * are larger than half of the height.
   *
   * Unlike the _getWordStats() function, this
   * function will return a different result
   * depending on the current width and height.
   *
   * @param {number} ctxWidth
   *  - The width the words are being checked
   *    against.
   * @param {number} ctxHeight
   *  - The height the words are being checked
   *    against.
   * @return { number, number }
   *         { stackedMinWidth, stackedMinHeight }
   *  - The minimum width and height the canvas needs
   *    to fit the words.
   */
  async _getStackedMinDimensions(ctxWidth, ctxHeight) {
    let stackedMinHeight = 0;
    let stackedMinWidth = 0;
    for (const processedWord of this.processedWords) {
      const { word, wordCloudFont, fontSize, color } = processedWord;
      const dimensions = await this._getTextDimensions(word, wordCloudFont, fontSize);

      if (dimensions.width > ctxWidth / 2) {
        stackedMinHeight += dimensions.height;
      }
      if (dimensions.height > ctxHeight / 2) {
        stackedMinWidth += dimensions.width;
      }
    }
    return { stackedMinWidth, stackedMinHeight }
  }

  /**
   * Before words are placed on the spiral it's
   * possible to grow the canvas using information
   * we know about the words. This is faster than
   * placing all of the words on the sprial and
   * iterating so it's preferred to run this function
   * first.
   *
   * @param {number} ctxWidth
   *  - The current width of the canvas.
   * @param {number} ctxHeight
   *  - The current height of the canvas.
   * @return { number, number } { width, height }
   *  - The new width and height for the canvas.
   */
  async _preflightGrow(ctxWidth, ctxHeight) {
    let width = ctxWidth;
    let height = ctxHeight;
    const { minWidth, minHeight, minArea } = await this._getWordStats();

    // The biggest height and width of the words have
    // to fit the DrawContext
    while (minWidth > width || minHeight > height) {
      console.log("increasing because of min width or height");
      ({ width, height } = this.growthFunction(width, height, this.providedWidth, this.providedHeight));
    }

    // The area of the words have to fit the area of
    // the drawContext
    while (minArea > (width * height)) {
      console.log("increasing because of min area");
      ({ width, height } = this.growthFunction(width, height, this.providedWidth, this.providedHeight));
    }

    // All words that are more than half of the width
    // can't be placed next to each other. This means
    // they have to be stacked and their combined
    // height needs to be at least as long as the
    // draw context. The same can be said about words
    // that are larger than half of the height.
    let { stackedMinWidth, stackedMinHeight } = await this._getStackedMinDimensions(width, height);
    while (stackedMinWidth > width || stackedMinHeight > height) {
      console.log("increasing because of stacked width or height");
      ({ width, height } = this.growthFunction(width, height, this.providedWidth, this.providedHeight));
      ({ stackedMinWidth, stackedMinHeight } = await this._getStackedMinDimensions(width, height));
    }

    return { width, height }
  }

  /**
   * If growToFit is true, the canvas will grow until
   * all of the words fit on the canvas. This is done
   * using the following algorithm:
   *
   * 1. "Preflight": The words are analyzed to see
   *    if the canvas needs growing before anything
   *    is written to the canvas.
   * 2. "Placement": The words are placed on the
   *    canvas until either:
   *    A) a word can't be placed anymore or
   *    B) a word overlaps with the outside of the
   *       canvas. We check for B so the result stays
   *       "tight". Skipping this step usually
   *       results in "tall" word clouds.
   * 3. "Grow and Repeat": The canvas is grown, the
   *    words that have already been placed before
   *    are placed in their last positions, and the
   *    "Placement" step starts over again. This
   *    repeats until all of the words are placed on
   *    the canvas.
   *
   * @return { Image } - The image of the WordCloud!
   */
  async getImage() {
    let width = this.providedWidth;
    let height = this.providedHeight;
    if (this.growToFit) {
      ({ width, height } = await deeperPerformanceDebugger.wrap(this._preflightGrow, [width, height], this));
    }

    let placedAll = false;
    let i = 0;
    while (!placedAll) {
      this.width = width;
      this.height = height;
      this.centerX = width / 2;
      this.centerY = height / 2;
      this.hitBoxes = [];

      await deeperPerformanceDebugger.wrap(this._writeAlreadyPlacedWords, [false], this, "writeAlreadyPlacedWords-" + i);
      placedAll = await deeperPerformanceDebugger.wrap(this._writePendingWords, [false], this, "writePendingWords-" + i);

      if (!this.growToFit) {
        break;
      }

      if (!placedAll) {
        console.log("increasing because words couldn't fit area");
        ({ width, height } = this.growthFunction(width, height, this.providedWidth, this.providedHeight));
      }
      i++;
    }

    this.ctx = new DrawContext();
    this.ctx.opaque = false;
    this.ctx.size = new Size(width, height);
    await deeperPerformanceDebugger.wrap(this._writeAlreadyPlacedWords, [true], this, "writeAlreadyPlacedWords-" + i);

    if (this.debug) {
      this.ctx.setLineWidth(5);
      this.ctx.setStrokeColor(Color.red());
      this.ctx.strokeRect(new Rect(0, 0, width, height));
      await this._writeToSpiral(null, true);
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

function simpleAndCleanWeightFunction(wordCloudWord) {
  return new WordCloudProcessedWord({
    word: wordCloudWord.word,
    wordCloudFont: new WordCloudFont({
      fontName: "TrebuchetMS-Bold"
    }),
    fontSize: (wordCloudWord.weight / 10) * (maxFont - minFont) + minFont,
    color: Device.isUsingDarkAppearance() ? Color.white() : Color.black()
  });
}

function builtInFestiveWeightFunction(wordCloudWord) {
  return new WordCloudProcessedWord({
    wordCloudFont: new WordCloudFont({
      fontName: "SnellRoundhand-Black"
    }),
    fontSize: (wordCloudWord.weight / 10) * (maxFont - minFont) + minFont,
    color: Math.random() < 0.5 ? Color.red() : Color.green()
  });
}

function hackerWeightFunction(wordCloudWord) {
  const color = new Color(
    Color.green().hex,
    Color.green().alpha * (wordCloudWord.weight / 10)
  );
  return new WordCloudProcessedWord({
    word: wordCloudWord.word,
    wordCloudFont: new WordCloudFont({
      fontName: "CourierNewPS-BoldMT"
    }),
    fontSize: maxFont,
    color: color
  });
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
 * [1] - https://9to5mac.com/2020/06/12/fontcase-open-source-fonts-app-iphone-ipad
 * [2] - https://apps.apple.com/us/app/fontcase-manage-your-type/id1205074470
 */

// https://fonts.google.com/specimen/Lacquer
function spookyWeightFunction(wordCloudWord) {
  return new WordCloudProcessedWord({
    word: wordCloudWord.word,
    wordCloudFont: new WordCloudFont({
      fontName: "Lacquer",
      cssUrl: "https://fonts.googleapis.com/css2?family=Lacquer&display=swap"
    }),
    fontSize: (wordCloudWord.weight / 10) * (maxFont - minFont) + minFont,
    color: Color.orange()
  });
}

// https://fonts.google.com/specimen/Cinzel+Decorative
function customFestiveWeightFunction(wordCloudWord) {
  return new WordCloudProcessedWord({
    word: wordCloudWord.word,
    wordCloudFont: new WordCloudFont({
      fontName: "Cinzel Decorative",
      cssUrl: "https://fonts.googleapis.com/css2?family=Cinzel+Decorative&display=swap"
    }),
    fontSize: (wordCloudWord.weight / 10) * (maxFont - minFont) + minFont,
    color: Math.random() < 0.5 ? Color.red() : Color.green()
  });
}

// https://fonts.google.com/specimen/Fredericka+the+Great
function stencilWeightFunction(wordCloudWord) {
  return new WordCloudProcessedWord({
    word: wordCloudWord.word,
    wordCloudFont: new WordCloudFont({
      fontName: "Fredericka the Great",
      cssUrl: "https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap"
    }),
    fontSize: (wordCloudWord.weight / 10) * (maxFont - minFont) + minFont,
    color: Color.lightGray()
  });
}

/*************************
 ***** WIDGET CONFIG *****
 *************************/

const wordCloudWords = [
  new WordCloudWord({ word: "Christmas", weight: 10 }),
  new WordCloudWord({ word: "Snow", weight: 10 }),
  new WordCloudWord({ word: "Sleigh", weight: 8 }),
  new WordCloudWord({ word: "Santa", weight: 7 }),
  new WordCloudWord({ word: "Presents", weight: 7 }),
  new WordCloudWord({ word: "Candy Canes", weight: 7 }),
  new WordCloudWord({ word: "Advent", weight: 6 }),
  new WordCloudWord({ word: "Carol", weight: 6 }),
  new WordCloudWord({ word: "Chimney", weight: 5 }),
  new WordCloudWord({ word: "Dreidel", weight: 5 }),
  new WordCloudWord({ word: "Druid", weight: 3 }),
  new WordCloudWord({ word: "Eggnog", weight: 3 }),
  new WordCloudWord({ word: "Elves", weight: 3 }),
  new WordCloudWord({ word: "Epiphany", weight: 3 }),
  new WordCloudWord({ word: "Feliz Navidad", weight: 3 }),
  new WordCloudWord({ word: "Frankincense", weight: 2 }),
  new WordCloudWord({ word: "Gingerbread", weight: 2 }),
  new WordCloudWord({ word: "Grinch", weight: 2 }),
  new WordCloudWord({ word: "Hanukkah", weight: 1 }),
  new WordCloudWord({ word: "Holly", weight: 1 }),
  new WordCloudWord({ word: "Jolly", weight: 1 })
];
// const wordCloudWords = [
//   new WordCloudWord({ word: "Christmas Chr", weight: 10 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 10 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 8 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 7 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 7 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 7 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 7 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 7 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 7 }),
//   new WordCloudWord({ word: "Christmas", weight: 3 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 3 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 3 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 2 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 2 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 2 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 1 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 1 }),
//   new WordCloudWord({ word: "Christmas Chr", weight: 1 })
// ];

function testPlacementFunction(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
  const i = previousResult ? previousResult.i + 1 : 0;
  const scale = 2;
  const dots = 10;
  const range = 234;
  const angle = Math.PI * range / 500 * i;
  const x = scale * angle * Math.cos(dots * angle) + centerX;
  const y = scale * angle * Math.sin(dots * angle) + centerY;
  return { x, y, angle, i }
}

function star(width, height, centerX, centerY, xRatio, yRatio, previousResult) {
  let i = previousResult ?
    previousResult.i + 1 :
    0;
  const scale = .25;
  const dots = 100;
  const range = 336;
  const angle = Math.PI * range / 500 * i;
  const x = scale * angle * Math.cos(dots * angle) + centerX;
  const y = scale * angle * Math.sin(dots * angle) + centerY;
  return { x, y, angle, i }
}

async function createWidget(width, height) {
  let widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);


  const wordCloud = new WordCloud({
    width,
    height,
    wordCloudWords,
    //     weightFunction: hackerWeightFunction,
    placementFunction: star,
    growToFit,
    growthFunction: undefined,
    debug
  });
  const image = await overallPerformanceDebugger.wrap(wordCloud.getImage, [], wordCloud);

  await overallPerformanceDebugger.appendPerformanceDataToFile("storage/word-cloud-performance-overview.csv");
  await deeperPerformanceDebugger.appendPerformanceDataToFile("storage/word-cloud-performance-deeper.csv");

  const widgetImage = widget.addImage(image);
  widgetImage.applyFillingContentMode();
  widgetImage.centerAlignImage();

  return widget;
}

try {
  if (config.runsInWidget) {
    const width = config.widgetFamily === "small" ? 250 : 530;
    const height = config.widgetFamily === "large" ? 530 : 250;
    const widget = await createWidget(width, height);
    Script.setWidget(widget);
    Script.complete();
  } else {
    const widget = await createWidget(530, 250);
    await widget.presentMedium();
  }
} catch (err) {
  console.log(err);
  throw err;
}
