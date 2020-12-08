/**
 * Class that can capture the time functions take in milliseconds then export them to a CSV.
 *
 * This is a minified version but it can be replaced with the full version by copy pasting this code!
 * https://github.com/stanleyrya/scriptable-playground/blob/main/performance-debugger/performance-debugger.js
 *
 * Usage:
 *  * wrap(fn, args): Wrap the function calls you want to monitor with this wrapper.
 *  * appendPerformanceDataToFile(relativePath): Use at the end of your script to write the metrics to the CSV file at the relative file path.
 */
class PerformanceDebugger{constructor(){this.performanceResultsInMillis={}}async wrap(e,t){const r=Date.now(),i=await e.apply(null,t),s=Date.now();return this.performanceResultsInMillis[e.name]=s-r,i}appendPerformanceDataToFile(e){const t=this.getFileManager(),r=this.getCurrentDir()+e,i=e.split("/");if(i>1){const e=i[i.length-1],s=r.replace("/"+e,"");t.createDirectory(s,!0)}if(t.fileExists(r)&&t.isDirectory(r))throw"Performance file is a directory, please delete!";let s,n,l=Object.getOwnPropertyNames(this.performanceResultsInMillis);if(t.fileExists(r)){console.log("File exists, reading headers. To keep things easy we're only going to write to these headers."),t.downloadFileFromiCloud(r),n=t.readString(r),s=this.getFirstLine(n).split(",")}else console.log("File doesn't exist, using available headers."),n=(s=l).toString();n=n.concat("\n");for(const e of s)this.performanceResultsInMillis[e]&&(n=n.concat(this.performanceResultsInMillis[e])),n=n.concat(",");n=n.slice(0,-1),t.writeString(r,n)}getFirstLine(e){var t=e.indexOf("\n");return-1===t&&(t=void 0),e.substring(0,t)}getFileManager(){try{return FileManager.iCloud()}catch(e){return FileManager.local()}}getCurrentDir(){const e=this.getFileManager(),t=module.filename;return t.replace(e.fileName(t,!0),"")}}
const performanceDebugger = new PerformanceDebugger();