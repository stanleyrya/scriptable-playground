/**
 * Class that can read and write JSON objects using the file system.
 *
 * This is a minified version but it can be replaced with the full version by copy pasting this code!
 * https://github.com/stanleyrya/scriptable-playground/blob/main/json-file-manager/json-file-manager.js
 *
 * Usage:
 *  * write(relativePath, jsonObject): Writes JSON object to a relative path.
 *  * read(relativePath): Reads JSON object from a relative path.
 */
class JSONFileManager{write(e,r){const t=this.getFileManager(),i=this.getCurrentDir()+e,l=e.split("/");if(l>1){const e=l[l.length-1],r=i.replace("/"+e,"");t.createDirectory(r,!0)}if(t.fileExists(i)&&t.isDirectory(i))throw"JSON file is a directory, please delete!";t.writeString(i,JSON.stringify(r))}read(e){const r=this.getFileManager(),t=this.getCurrentDir()+e;if(!r.fileExists(t))throw"JSON file does not exist! Could not load: "+t;if(r.isDirectory(t))throw"JSON file is a directory! Could not load: "+t;r.downloadFileFromiCloud(t);const i=JSON.parse(r.readString(t));if(null!==i)return i;throw"Could not read file as JSON! Could not load: "+t}getFileManager(){try{return FileManager.iCloud()}catch(e){return FileManager.local()}}getCurrentDir(){const e=this.getFileManager(),r=module.filename;return r.replace(e.fileName(r,!0),"")}}
const jsonFileManager = new JSONFileManager();