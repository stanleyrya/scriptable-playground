/**
 * Author: Ryan Stanley (stanleyrya@gmail.com)
 * Tips: https://www.paypal.me/stanleyrya
 *
 * Class that can write logs to the file system.
 *
 * This is a minified version but it can be replaced with the full version here!
 * https://github.com/stanleyrya/scriptable-playground/tree/main/file-logger
 *
 * Usage:
 *  * log(line): Adds the log line to the class' internal log object.
 *  * writeLogs(relativePath): Writes the stored logs to the relative file path.
 */
class FileLogger{constructor(){this.logs=""}log(e){e instanceof Error?console.error(e):console.log(e),this.logs+=new Date+" - "+e+"\n"}writeLogs(e){const r=this.getFileManager(),t=this.getCurrentDir()+e,i=e.split("/");if(i>1){const e=i[i.length-1],l=t.replace("/"+e,"");r.createDirectory(l,!0)}if(r.fileExists(t)&&r.isDirectory(t))throw"Log file is a directory, please delete!";r.writeString(t,this.logs)}getFileManager(){try{return FileManager.iCloud()}catch(e){return FileManager.local()}}getCurrentDir(){const e=this.getFileManager(),r=module.filename;return r.replace(e.fileName(r,!0),"")}}
const logger = new FileLogger();