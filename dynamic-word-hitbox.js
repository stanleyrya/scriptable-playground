// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: object-ungroup;
const baseJavascript = `
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

async function getTextDimensions(text, font, fontSize) {
    const cssFont = fontSize + "pt " + font;
    const javascript = baseJavascript.replace("REPLACE_TEXT", text).replace("REPLACE_FONT", cssFont);
    const webView = new WebView();
    return await webView.evaluateJavaScript(javascript, false)
}

class WordLineChart {
  // Started with LineChart by https://kevinkub.de/

  constructor(width, height, wordData) {
    this.ctx = new DrawContext();
    this.ctx.size = new Size(width, height);
    this.values = wordData.map((item) => {return item.weight});
    this.wordData = wordData;
  }
  
  _calculatePath() {
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
    return this._getSmoothPath(points);
  }
      
  _getSmoothPath(points) {
    let path = new Path();
    path.move(new Point(0, this.ctx.size.height));
    path.addLine(points[0]);
    for(let i = 0; i < points.length-1; i++) {
      let xAvg = (points[i].x + points[i+1].x) / 2;
      let yAvg = (points[i].y + points[i+1].y) / 2;
      let avg = new Point(xAvg, yAvg);
  
      // Word Code ----- //
      this.ctx.setFont(new Font(this.wordData[i].font, this.wordData[i].fontSize));
      this.ctx.setFillColor(Color.red());
      this.ctx.fillRect(new Rect(avg.x, avg.y, wordData[i].dimensions.width, wordData[i].dimensions.height));
      this.ctx.drawText(this.wordData[i].word, avg)
      // --------------- //
    }
  }
  
  configure(fn) {
    this._calculatePath();
    return this.ctx;
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
        wordDatum.dimensions = await getTextDimensions(wordDatum.word, font, fontSize);
        wordDatum.font = font;
        wordDatum.fontSize = fontSize;
    }
  
    let chart = new WordLineChart(600, 250, wordData).configure().getImage();  
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
