/**
 * Authors: Ryan Stanley (stanleyrya@gmail.com)
 *
 * Class that can capture the time functions take in milliseconds then export them to a CSV.
 *
 * This is a minified version but it can be replaced with the full version by copy pasting this code!
 * https://github.com/stanleyrya/scriptable-playground/blob/main/performance-debugger/performance.js
 *
 * Usage:
 *  * wrap(fn, args): Wrap the function calls you want to monitor with this wrapper.
 *  * appendPerformanceDataToFile(relativePath): Use at the end of your script to write the metrics to the CSV file at the relative file path.
 */
class PerformanceDebugger{constructor(){this.performanceResultsInMillis={}}async wrap(e,t,i){const r=Date.now(),s=await e.apply(null,t),n=Date.now(),a=i||e.name;return this.performanceResultsInMillis[a]=n-r,s}async appendPerformanceDataToFile(e){const t=this.getFileManager(),i=this.getCurrentDir()+e,r=e.split("/");if(r>1){const e=r[r.length-1],s=i.replace("/"+e,"");t.createDirectory(s,!0)}if(t.fileExists(i)&&t.isDirectory(i))throw"Performance file is a directory, please delete!";let s,n,a=Object.getOwnPropertyNames(this.performanceResultsInMillis);if(t.fileExists(i)){console.log("File exists, reading headers. To keep things easy we're only going to write to these headers."),await t.downloadFileFromiCloud(i),n=t.readString(i),s=this.getFirstLine(n).split(",")}else console.log("File doesn't exist, using available headers."),n=(s=a).toString();n=n.concat("\n");for(const e of s)this.performanceResultsInMillis[e]&&(n=n.concat(this.performanceResultsInMillis[e])),n=n.concat(",");n=n.slice(0,-1),t.writeString(i,n)}getFirstLine(e){var t=e.indexOf("\n");return-1===t&&(t=void 0),e.substring(0,t)}getFileManager(){try{return FileManager.iCloud()}catch(e){return FileManager.local()}}getCurrentDir(){const e=this.getFileManager(),t=module.filename;return t.replace(e.fileName(t,!0),"")}}
const performanceDebugger = new PerformanceDebugger()