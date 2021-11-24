// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: ruler-combined;

/**
 * Author: Ryan Stanley (stanleyrya@gmail.com)
 * Tips: https://www.paypal.me/stanleyrya
 */

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

const text = "Christmas";
const font = "Arial-BoldMT";
const fontSize = 12;

const webView = new WebView();
const result = await getTextDimensions(text, font, fontSize);
console.log(result);
