// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: file-import;
let logs = "";

function log(line) {
  if (line instanceof Error) {
    console.error(line);
  } else {
    console.log(line);
  }
  logs += new Date() + " - " + line + "\n";
}

function getFileManager() {
    try {
        return FileManager.iCloud();
    } catch (e) {
        return FileManager.local();
    }
}

function getCurrentDir() {
    const fm = getFileManager();
    const thisScriptPath = module.filename;
    return thisScriptPath.replace(fm.fileName(thisScriptPath, true), '');
}

/**
 * Attempts to write logs to the file ./storage/name-logs.txt
 */
function writeLogs(name, logs) {
    const fm = getFileManager();
    const storageDir = getCurrentDir() + "storage";
    const logPath = storageDir + "/" + name + "-logs.txt";

    if (!fm.fileExists(storageDir)) {
        console.log("Storage folder does not exist! Creating now.");
        fm.createDirectory(storageDir);
    } else if (!fm.isDirectory(storageDir)) {
        throw ("Storage folder exists but is not a directory!");
    }

    if (fm.fileExists(logPath) && fm.isDirectory(logPath)) {
        throw ("Log file is a directory, please delete!");
    }

    fm.writeString(logPath, logs);
}


log("testing here");
log("also testing here");

try {
  throw("error!")
} catch (err) {
  log(err)
}

writeLogs("test", logs);
