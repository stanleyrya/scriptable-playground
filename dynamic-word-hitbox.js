// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: object-ungroup;
class WordLineChart {
  // Started with LineChart by https://kevinkub.de/

  constructor(width, height, wordData) {
    this.ctx = new DrawContext();
    this.ctx.size = new Size(width, height);
    this.values = wordData.map((item) => {return item.weight});
    this.wordData = wordData;
    this.hitBoxes = [];
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
  //     RectA.Top > RectB.Bottom &&
  //     RectA.Bottom < RectB.Top) 
  _checkCollision(newRect) {
    for (const placedRect of this.hitBoxes) {
      if (newRect.minX < newRect.maxX &&
          newRect.maxX > newRect.minX &&
          newRect.minY > newRect.maxY &&
          newRect.maxY < newRect.minY) {
        return true;
      }
    }
    return false;
  }
  
  async _addText(x, y, text, font, fontSize) {
    const dimensions = await this._getTextDimensions(text, font, fontSize);
    const rect = new Rect(x, y, dimensions.width, dimensions.height);

    if (this._checkCollision(rect)) {
      return false;
    }

    this.hitBoxes.push(rect);

    // TODO: add this as an option
    this.ctx.setFillColor(Color.red());
    this.ctx.fillRect(rect);

    this.ctx.setFont(new Font(font, fontSize));
    this.ctx.drawText(text, new Point(x, y));
    return true;
  }
  
  async _calculatePath() {
    let maxValue = Math.max(...this.values);
    let minValue = Math.min(...this.values);
    let difference = maxValue - minValue;
    let count = this.values.length;
    let step = this.ctx.size.width / (count - 1);
    let points = this.values.map((current, index, all) => {
        let x = step*index;
        let y = this.ctx.size.height - (current - minValue) / difference * this.ctx.size.height;
        return new Point(x, y);
    });
    return await this._getSmoothPath(points);
  }
      
  async _getSmoothPath(points) {
    let path = new Path();
    path.move(new Point(0, this.ctx.size.height));
    path.addLine(points[0]);
    for(let i = 0; i < points.length-1; i++) {
      let xAvg = (points[i].x + points[i+1].x) / 2;
      let yAvg = (points[i].y + points[i+1].y) / 2;
      let avg = new Point(xAvg, yAvg);
  
      // Word Code ----- //
      await this._addText(
        avg.x,
        avg.y,
        this.wordData[i].word,
        this.wordData[i].font,
        this.wordData[i].fontSize
      );
      await this._addText(
        avg.x + 10,
        avg.y,
        this.wordData[i].word,
        this.wordData[i].font,
        this.wordData[i].fontSize
      );
      await this._addText(
        avg.x + 100,
        avg.y,
        this.wordData[i].word,
        this.wordData[i].font,
        this.wordData[i].fontSize
      );
      // --------------- //
    }
  }
  
  async configure(fn) {
    await this._calculatePath();
    return this.ctx.getImage();
  }

}

const wordData = [  
    { word: "Christmas", weight: 10 },
    { word: "Snow Snow Snow", weight: 9 },
    { word: "Sleigh", weight: 6 },
    { word: "Santa", weight: 5 },
    { word: "Communism", weight: 1 },
    { word: "Candy Canes", weight: 1 }
]

async function createWidget() {
	let widget = new ListWidget();
    // Works fine
    const font = "TrebuchetMS-Bold";
//     const font = "Arial-BoldMT";
    // Needs Improvement
//     const font = "Zapfino";
    const fontSize = 20;

    for (const wordDatum of wordData) {
        const fontSize = wordDatum.weight*3;
        wordDatum.font = font;
        wordDatum.fontSize = fontSize;
    }
  
    let chart = await new WordLineChart(600, 250, wordData).configure();
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
