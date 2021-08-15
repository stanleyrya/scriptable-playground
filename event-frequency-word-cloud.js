// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: user-astronaut;

//@ts-check

// use true to initially give Scriptable calendar access
// use false to open Calendar when script is run - when tapping on the widget
const debug = false;

const growToFit = true;
const minFont = 10;
const maxFont = 60;

const numDays = 90;

const blocklist = [
  "Oncall",
  "Cleaners",
  "Haircut",
  "Prep"
]

// ____________________________________________


// get widget params
const params = JSON.parse(args.widgetParameter) || loadStoredParameters(Script.name()) || {};

function getCurrentDir() {
    const fm = FileManager.local();
    const thisScriptPath = module.filename;
    return thisScriptPath.replace(fm.fileName(thisScriptPath, true), '');
}

/**
 * Attempts to load the file ./storage/name.json
 * Returns null if it cannot be loaded.
 */
function loadStoredParameters(name) {
    const fm = FileManager.local();
    const storageDir = getCurrentDir() + "storage";
    const parameterPath = storageDir + "/" + name + ".json";

    if (!fm.fileExists(storageDir)) {
        console.log("Storage folder does not exist!");
        return null;
    } else if (!fm.isDirectory(storageDir)) {
        console.log("Storage folder exists but is not a directory!");
        return null;
    } else if (!fm.fileExists(parameterPath)) {
        console.log("Parameter file does not exist!");
        return null;
    } else if (fm.isDirectory(parameterPath)) {
        console.log("Parameter file is a directory!");
        return null;
    }

    const parameterJSON = JSON.parse(fm.readString(parameterPath));
    if (parameterJSON !== null) {
        return parameterJSON;
    } else {
        console.log("Could not load parameter file as JSON!");
        return null;
    }
}


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
                if (!this.loadedCssUrls[wordCloudFont.cssURL]) {
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

    _checkInside(x, y) {
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
        while (!(breachedLeft &&
                breachedRight &&
                breachedTop &&
                breachedBottom)) {
            radius += this.radiusIncrement * angleDirection;
            angle += (Math.PI * 2) / this.partsPerCircle * radiusDirection;
            let x = this.centerX + radius * Math.cos(angle) * this.xRatio;
            let y = this.centerY + radius * Math.sin(angle) * this.yRatio;
            if (this.debug) {
                path.addLine(new Point(x, y));
            }
            if (this._checkInside(x, y)) {
                continue;
            }

            const { wordCloudFont, fontSize, color } = this.weightFunction(word, weight);
            if (await this._addTextCentered(
                    x, y, word, wordCloudFont, fontSize, color
                )) {
                placed = true;
                break;
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
        console.log("writing all words to spiral")
        for (const wordDatum of this.wordData) {
            console.log("printing " + wordDatum.word);
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

    async _getWordStats() {
        let minWidth = 0;
        let minHeight = 0;
        let minArea = 0;
        for (const wordDatum of this.wordData) {
            const { wordCloudFont, fontSize, color } = this.weightFunction(wordDatum.word, wordDatum.weight);
            const dimensions = await this._getTextDimensions(wordDatum.word, wordCloudFont, fontSize);

            if (minWidth < dimensions.width) {
                minWidth = dimensions.width;
            }
            if (minHeight < dimensions.height) {
                minHeight = dimensions.height;
            }

            minArea += dimensions.width * dimensions.height;
        }
        return {
            minWidth: minWidth,
            minHeight: minHeight,
            minArea: minArea
        };
    }

    async _getStackedMinHeight(ctxWidth) {
        console.log("getting stacked")
        let stackedMinHeight = 0;
        for (const wordDatum of this.wordData) {
            const { wordCloudFont, fontSize, color } = this.weightFunction(wordDatum.word, wordDatum.weight);
            const dimensions = await this._getTextDimensions(wordDatum.word, wordCloudFont, fontSize);

            if (dimensions.width > ctxWidth / 2) {
                console.log("bigger than half")
                stackedMinHeight += dimensions.height;
            }
        }
        console.log(stackedMinHeight);
        return stackedMinHeight;
    }

    async _preflightGrow(ctxWidth, ctxHeight) {
        let newWidth = ctxWidth;
        let newHeight = ctxHeight;
        const { minWidth, minHeight, minArea } = await this._getWordStats();

        // The biggest height and width of the words have to fit the DrawContext
        while (minWidth > newWidth ||
            minHeight > newHeight) {
            newWidth = newWidth + (newWidth * 0.1);
            newHeight = newHeight + (newHeight * 0.1);
            console.log("increasing because of min width or height");
        }

        // The area of the words have to fit the area of the drawContext
        while (minArea > (newWidth * newHeight)) {
            newWidth = newWidth + (newWidth * 0.1);
            newHeight = newHeight + (newHeight * 0.1);
            console.log("increasing because of min area");
        }

        console.log("height:" + newHeight);

        // The biggest height and width of the words have to fit the DrawContext
        let stackedMinHeight = await this._getStackedMinHeight(newWidth);
        while (stackedMinHeight > newHeight) {
            newWidth = newWidth + (newWidth * 0.1);
            newHeight = newHeight + (newHeight * 0.1);
            console.log("increasing because of stacked height");
            stackedMinHeight = await this._getStackedMinHeight(newWidth);
        }

        return {
            ctxWidth: newWidth,
            ctxHeight: newHeight
        }
    }

    async getImage() {
        let ctxWidth = this.providedWidth;
        let ctxHeight = this.providedHeight;
        if (this.growToFit) {
            ({ ctxWidth, ctxHeight } = await this._preflightGrow(ctxWidth, ctxHeight));
        }
        console.log("ctxHeight:" + ctxHeight);
        console.log("ctxWidth:" + ctxWidth);

        let placedAll = false;
        let i = 0;
        while (!placedAll) {
            this.ctx = new DrawContext();
            this.ctx.opaque = false;
            this.ctx.size = new Size(ctxWidth, ctxHeight);
            this.centerX = ctxWidth / 2;
            this.centerY = ctxHeight / 2;
            this.hitBoxes = [];

            placedAll = await this._writeAllWordsToSpiral();
            //       placedAll = await performanceDebugger.wrap(this._writeAllWordsToSpiral,  [], this, "writeAllWordsToSpiral-" + i);

            if (!this.growToFit) {
                break;
            }

            if (!placedAll) {
                ctxWidth = ctxWidth + (this.providedWidth * 0.1);
                ctxHeight = ctxHeight + (this.providedHeight * 0.1);
                console.log("increasing because words couldn't fit area");
            }
            i++;
        }

        if (this.debug) {
            this.ctx.setLineWidth(5);
            this.ctx.setStrokeColor(Color.red());
            this.ctx.strokeRect(new Rect(0, 0, ctxWidth, ctxHeight));
        }

        return this.ctx.getImage();
    }

}

function simpleAndCleanWeightFunction(text, weight) {
    return {
        wordCloudFont: new WordCloudFont(
            "TrebuchetMS-Bold"
        ),
        fontSize: (weight / 10) * (maxFont - minFont) + minFont,
        color: Device.isUsingDarkAppearance() ? Color.white() : Color.black()
    }
}


// ____________________________________________

/**
 * Adds events to the frequency map
 *
 * @param  {[CalendarEvent]} events - the events that are being processed
 * @param  {Map<String,num>} frequencyMap - a map of event names to their frequency
 * @return frequencyMap
 */
function addToFrequencyMap(events, frequencyMap) {
    for (const event of events) {
        const eventTitle = event["title"];

        if (blocklist && blocklist.includes(eventTitle)) {
            continue;
        }

        if (frequencyMap[eventTitle]) {
            frequencyMap[event["title"]]++;
        } else {
            frequencyMap[event["title"]] = 1;
        }
    }
    return frequencyMap;
}

/**
 * Creates an object that describes a calendar day. Currently contains "isBusy" and "isOncall":
 * {"isBusy":true,"isOncall":true}
 *
 * @param  {Date} date - a date object that will be described
 * @param  {Map<String,num>} frequencyMap - a map of event names to their frequency
 */
async function buildDay(date, frequencyMap) {
    let events = await CalendarEvent.between(
        new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        // quick hack to just use default calendar
    [await Calendar.defaultForEvents()]
    );

    addToFrequencyMap(events, frequencyMap);
}

/**
 * Creates a map of days in the month to a description of said day. Currently contains "isBusy" and "isOncall":
 * {"1":{"isBusy":true,"isOncall":true},"2":...}
 *
 * @param  {Date} date - a date object that holds the current month
 * @return frequencyMap
 */
async function processPreviousDays(numDays) {
    const frequencyMap = {};

    const currentDate = new Date();
    const endDate = new Date();
    endDate.setDate(currentDate.getDate() - numDays);

    for (var d = new Date(); d >= endDate; d.setDate(d.getDate() - 1)) {
        await buildDay(d, frequencyMap);
    }

    return frequencyMap;
}

function findHighestFrequency(frequencyMap) {
    let max = 0;
    for (const eventName in frequencyMap) {
        if (max < frequencyMap[eventName]) {
            max = frequencyMap[eventName];
        }
    }
    return max;
}

function convertFrequencyToWeight(frequencyMap) {
    const max = findHighestFrequency(frequencyMap);
    const weights = [];

    for (const eventName in frequencyMap) {
        weights.push({
            word: eventName,
            weight: (frequencyMap[eventName] / max) * 10
        });
    }

    return weights.sort(function (a, b) { return a.weight < b.weight });
}





async function createWidget(width, height) {
    let widget = new ListWidget();
    widget.setPadding(0, 0, 0, 0);

    const frequencyMap = await processPreviousDays(numDays);
    const weights = convertFrequencyToWeight(frequencyMap);

    const wordCloud = new WordCloud(
        width,
        height,
        weights,
        simpleAndCleanWeightFunction,
        true,
        debug
    );
    const image = await wordCloud.getImage();

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
