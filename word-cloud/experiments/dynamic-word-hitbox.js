// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: object-ungroup;

/**
 * Author: Ryan Stanley (stanleyrya@gmail.com)
 * Tips: https://www.paypal.me/stanleyrya
 */

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

const frederickaTheGreat = new WordCloudFont(
  "Fredericka the Great",
  "https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap"
);

const arialBold = new WordCloudFont(
  "Arial-BoldMT"
);

class HitBoxTester {

  constructor(width, height) {
    this.ctx = new DrawContext();
    this.ctx.size = new Size(width, height);
    this.hitBoxes = [];
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

const text = "REPLACE_TEXT";
const font = "REPLACE_FONT";
getTextDimensions(text, font);
`.replace("REPLACE_TEXT", text)
.replace("REPLACE_FONT", cssFont);
  }

  async _getTextDimensions(text, wordCloudFont, fontSize) {
    const cssFont = fontSize + "pt " + wordCloudFont.fontName;
    const webView = new WebView();
    
    if (wordCloudFont.cssURL) {
    await webView.loadHTML(
      this._getAddFontHTML(wordCloudFont.fontName, wordCloudFont.cssURL))
    }
    
    return await webView.evaluateJavaScript(
      this._getTextDimensionJavascript(text, cssFont)
    )
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
  
  async _addTextCentered(x, y, text, wordCloudFont, fontSize) {
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

    this.ctx.setFillColor(Color.red());
    this.ctx.fillRect(rect);

    // I'm not sure why, but the text is a quarter off from the box.
    const quarterHeight = dimensions.height / 4;
    this.ctx.setFont(new Font(wordCloudFont.fontName, fontSize));
    this.ctx.drawText(text, new Point(topLeftX, topLeftY- quarterHeight));
    return true;
  }
  
  async configure(fn) {
    await this._addTextCentered(
      this.ctx.size.width / 2,
      this.ctx.size.height / 2,
      "santa santa santa",
      frederickaTheGreat,
      60
    );
    // Shouldn't get added
    await this._addTextCentered(
      this.ctx.size.width / 2 + 10,
      this.ctx.size.height / 2,
      "santa santa santa",
      arialBold,
      60
    );
    return this.ctx.getImage();
  }

}

async function createWidget() {
	let widget = new ListWidget();
  
    let chart = await new HitBoxTester(600, 250).configure();
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
