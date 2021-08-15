// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: user-astronaut;

//@ts-check

// use true to initially give Scriptable calendar access
// use false to open Calendar when script is run - when tapping on the widget

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

/**
 * Authors: Ryan Stanley (stanleyrya@gmail.com)
 *
 * A set of classes that can create a word cloud image.
 *
 * This is a minified version but it can be replaced with the full version by copy pasting this code!
 * https://github.com/stanleyrya/scriptable-playground/blob/main/word-cloud/word-cloud.js
 *
 * Basic Usage:
 *  * const wordCloud = new WordCloud({width, height, wordCloudWords});
 *  * const image = await wordCloud.getImage();
 *
 */
class WordCloudWord{constructor({word:r,weight:i}){if(!r)throw"word is required!";if(!i)throw"weight is required!";this.word=r,this.weight=i}}
class WordCloudFont{constructor({fontName:s,cssUrl:o}){if(!s)throw"fontName is required!";this.fontName=s,this.cssURL=o}}
class WordCloudProcessedWord{constructor({word:o,wordCloudFont:r,fontSize:d,color:t}){if(!o)throw"word is required!";if(!r)throw"wordCloudFont is required!";if(!(r instanceof WordCloudFont))throw"wordCloudFont must be a WordCloudFont object!";if(!d)throw"fontSize is required!";if(!t)throw"color is required!";this.word=o,this.wordCloudFont=r,this.fontSize=d,this.color=t}}
class WordCloud{constructor({width:t,height:e,wordCloudWords:i,weightFunction:o=this._defaultWeightFunction,placementFunction:s=this._defaultPlacementFunction,growToFit:n=!0,growthFunction:r=this._defaultGrowthFunction,debug:h=!1}){this.providedWidth=t,this.providedHeight=e,this.placementFunction=s,this.weightFunction=o,this.growToFit=!!n,this.growthFunction=r,this.debug=!!h,this.processedWords=i.map(t=>this.weightFunction(t)),this.wordsToPlace=[...this.processedWords],this.placedWords=[],this.webView=new WebView,this.loadedCssUrls={},this.textDimensionsMap={},this.bufferRoom=10;const c=t>e?t:e;this.xRatio=t/c,this.yRatio=e/c}_defaultWeightFunction(t){return new WordCloudProcessedWord({word:t.word,wordCloudFont:new WordCloudFont({fontName:"TrebuchetMS-Bold"}),fontSize:t.weight/10*(maxFont-minFont)+minFont,color:Device.isUsingDarkAppearance()?Color.white():Color.black()})}_defaultPlacementFunction(t,e,i,o,s,n,r){let h,c,d,a;return r?(({radius:h,radiusDirection:c,angle:d,angleDirection:a}=r),h+=.75*c,d+=2*Math.PI/50*a):(h=0,d=0,c=Math.random()<.5?-1:1,a=Math.random()<.5?-1:1),{x:i+h*Math.cos(d)*s,y:o+h*Math.sin(d)*n,radius:h,angle:d,radiusDirection:c,angleDirection:a}}_defaultGrowthFunction(t,e,i,o){return{width:t+.1*t,height:e+.1*e}}_loadFontToWebView(t,e){const i='\n      // Preconnecting could decrease load time if using a Google font\n      // https://www.cdnplanet.com/blog/faster-google-webfonts-preconnect/\n      <link rel="preconnect" href="https://fonts.gstatic.com">\n\n      <link href="REPLACE_HREF" rel="stylesheet">\n\n      // Load the font so its available in the canvas\n      <div style="font-family: REPLACE_FONT_FAMILY;">.</div>\n'.replace("REPLACE_HREF",e).replace("REPLACE_FONT_FAMILY",t);return this.webView.loadHTML(i)}_getTextDimensionsUsingWebView(t,e){const i='\n      function getTextDimensions(text, font) {\n          const canvas = document.createElement("canvas");\n          const context = canvas.getContext("2d");\n          context.font = font;\n          const metrics = context.measureText(text);\n          return {\n              // I\'m not sure why yet but 3/4 is perfect for Scriptable\'s DrawContext\n              width: metrics.width * 3/4,\n              height: (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * 3/4\n          };\n      }\n\n      getTextDimensions("REPLACE_TEXT", "REPLACE_FONT");\n'.replace("REPLACE_TEXT",t).replace("REPLACE_FONT",e);return this.webView.evaluateJavaScript(i)}async _getTextDimensions(t,e,i){const o=i+"pt "+e.fontName,s=t+" "+o;if(this.textDimensionsMap[s])return this.textDimensionsMap[s];{e.cssURL&&(this.loadedCssUrls[e.cssURL]||(await this._loadFontToWebView(e.fontName,e.cssURL),this.loadedCssUrls[e.cssURL]=!0));const i=await this._getTextDimensionsUsingWebView(t,o);return this.textDimensionsMap[s]=i,i}}_checkRectCollision(t){for(const e of this.hitBoxes)if(t.minX<e.maxX+this.bufferRoom&&t.maxX>e.minX-this.bufferRoom&&t.minY<e.maxY+this.bufferRoom&&t.maxY>e.minY-this.bufferRoom)return!0;return!1}_checkRectOutsideBorders(t){return t.minX<0+this.bufferRoom||t.maxX>this.width-this.bufferRoom||t.minY<0+this.bufferRoom||t.maxY>this.height-this.bufferRoom}_checkPointCollision(t,e){for(const i of this.hitBoxes)if(t<i.maxX+this.bufferRoom&&t>i.minX-this.bufferRoom&&e<i.maxY+this.bufferRoom&&e>i.minY-this.bufferRoom)return!0;return!1}async _addTextCentered({x:t,y:e,processedWord:i,shouldDraw:o,checkHitboxes:s}){const{word:n,wordCloudFont:r,fontSize:h,color:c}=i,d=await this._getTextDimensions(n,r,h),a=t-d.width/2,l=e-d.height/2,w=new Rect(a,l,d.width,d.height);if(s&&this._checkRectCollision(w))return{textPlaced:!1,rectCollision:!0,outsideBorders:!1};if(this._checkRectOutsideBorders(w))return{textPlaced:!1,rectCollision:!1,outsideBorders:!0};if(this.debug&&console.log("writing "+n),this.hitBoxes.push(w),o){this.debug&&(this.ctx.setLineWidth(5),this.ctx.setStrokeColor(Color.red()),this.ctx.strokeRect(w));const t=d.height/4;this.ctx.setTextColor(c),this.ctx.setFont(new Font(r.fontName,h)),this.ctx.drawText(n,new Point(a,l-t))}return{textPlaced:!0,rectCollision:!1,outsideBorders:!1}}async _writeWithPlacementFunction(t,e){let i,o,s,n=!1,r=!1,h=!1,c=!1;const d=new Path;d.move(new Point(this.centerX,this.centerY));let a=!1;for(;!(n&&r&&h&&c);)if(i=this.placementFunction(this.width,this.height,this.centerX,this.centerY,this.xRatio,this.yRatio,i),({x:o,y:s}=i),this.debug&&e&&d.addLine(new Point(o,s)),!this._checkPointCollision(o,s)){if(t){const{textPlaced:i,rectCollision:n,outsideBorders:r}=await this._addTextCentered({x:o,y:s,processedWord:t,shouldDraw:e,checkHitboxes:!0});if(i){this.placedWords.push({xFromCenter:o-this.centerX,yFromCenter:s-this.centerY,processedWord:t}),this.wordsToPlace.shift(),a=!0;break}if(r&&this.growToFit)break}o<0&&(n=!0),o>this.width&&(r=!0),s<0&&(h=!0),s>this.height&&(c=!0)}return this.debug&&e&&(this.ctx.setLineWidth(.5),this.ctx.addPath(d),this.ctx.setStrokeColor(Color.cyan()),this.ctx.strokePath()),a}async _writePendingWords(t){this.debug&&console.log("writing pending words");let e=!0;const i=[...this.wordsToPlace];for(const o of i)if(!await this._writeWithPlacementFunction(o,t)&&(e=!1,this.growToFit))return!1;return e}async _writeAlreadyPlacedWords(t){this.debug&&console.log("writing already placed words");for(const e of this.placedWords)await this._addTextCentered({x:e.xFromCenter+this.centerX,y:e.yFromCenter+this.centerY,processedWord:e.processedWord,shouldDraw:t,checkHitboxes:!1})}async _getWordStats(){let t=0,e=0,i=0;for(const o of this.processedWords){const{word:s,wordCloudFont:n,fontSize:r,color:h}=o,c=await this._getTextDimensions(s,n,r);t<c.width&&(t=c.width),e<c.height&&(e=c.height),i+=c.width*c.height}return{minWidth:t,minHeight:e,minArea:i}}async _getStackedMinDimensions(t,e){let i=0,o=0;for(const s of this.processedWords){const{word:n,wordCloudFont:r,fontSize:h,color:c}=s,d=await this._getTextDimensions(n,r,h);d.width>t/2&&(i+=d.height),d.height>e/2&&(o+=d.width)}return{stackedMinWidth:o,stackedMinHeight:i}}async _preflightGrow(t,e){let i=t,o=e;const{minWidth:s,minHeight:n,minArea:r}=await this._getWordStats();for(;s>i||n>o;)console.log("increasing because of min width or height"),({width:i,height:o}=this.growthFunction(i,o,this.providedWidth,this.providedHeight));for(;r>i*o;)console.log("increasing because of min area"),({width:i,height:o}=this.growthFunction(i,o,this.providedWidth,this.providedHeight));let{stackedMinWidth:h,stackedMinHeight:c}=await this._getStackedMinDimensions(i,o);for(;h>i||c>o;)console.log("increasing because of stacked width or height"),({width:i,height:o}=this.growthFunction(i,o,this.providedWidth,this.providedHeight)),({stackedMinWidth:h,stackedMinHeight:c}=await this._getStackedMinDimensions(i,o));return{width:i,height:o}}async getImage(){let t=this.providedWidth,e=this.providedHeight;this.growToFit&&({width:t,height:e}=await this._preflightGrow(t,e));let i=!1;for(;!i&&(this.width=t,this.height=e,this.centerX=t/2,this.centerY=e/2,this.hitBoxes=[],await this._writeAlreadyPlacedWords(!1),i=await this._writePendingWords(!1),this.growToFit);)i||(console.log("increasing because words couldn't fit area"),({width:t,height:e}=this.growthFunction(t,e,this.providedWidth,this.providedHeight))),0;return this.ctx=new DrawContext,this.ctx.opaque=!1,this.ctx.size=new Size(t,e),await this._writeAlreadyPlacedWords(!0),this.debug&&(this.ctx.setLineWidth(5),this.ctx.setStrokeColor(Color.red()),this.ctx.strokeRect(new Rect(0,0,t,e)),await this._writeWithPlacementFunction(null,!0)),this.ctx.getImage()}}

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
    const wordCloudWords = convertFrequencyToWeight(frequencyMap);

    const wordCloud = new WordCloud({
        width,
        height,
        wordCloudWords
    });
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
