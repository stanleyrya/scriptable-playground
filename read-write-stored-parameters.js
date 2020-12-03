// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: file-signature;

const params = { "apiKey": "testtest" };

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
 * Attempts to load parameters stored in the file ./storage/name.json
 * Returns null if it cannot be loaded.
 */
function loadStoredParameters(name) {
    const fm = getFileManager();
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

    // Doesn't fail with local filesystem
    fm.downloadFileFromiCloud(parameterPath);

    const parameterJSON = JSON.parse(fm.readString(parameterPath));
    if (parameterJSON !== null) {
        return parameterJSON;
    } else {
        console.log("Could not load parameter file as JSON!");
        return null;
    }
}

/**
 * Attempts to write parameters to the file ./storage/name.json
 */
function writeStoredParameters(name, params) {
    const fm = getFileManager();
    const storageDir = getCurrentDir() + "storage";
    const parameterPath = storageDir + "/" + name + ".json";

    if (!fm.fileExists(storageDir)) {
        console.log("Storage folder does not exist! Creating now.");
        fm.createDirectory(storageDir);
    } else if (!fm.isDirectory(storageDir)) {
        throw ("Storage folder exists but is not a directory!");
    }

    if (fm.fileExists(parameterPath) && fm.isDirectory(parameterPath)) {
        throw ("Parameter file is a directory, please delete!");
    }

    fm.writeString(parameterPath, JSON.stringify(params));
}

console.log(loadStoredParameters("test"));
writeStoredParameters("test", params);
console.log(loadStoredParameters("test"));
