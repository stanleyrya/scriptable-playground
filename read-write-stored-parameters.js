const params = {"apiKey": "testtest"};

/**
 * Attempts to load the file ./storage/name.json
 * Returns null if it cannot be loaded.
 */
function loadStoredParameters(name) {
    let fm = FileManager.local()

    const thisScriptPath = module.filename
    const storageDir = thisScriptPath.replace(fm.fileName(thisScriptPath, true), '') + "storage"
    const parameterFile = name + ".json";
    const parameterPath = storageDir + "/" + parameterFile;

    if (!fm.fileExists(storageDir)) {
        console.log("Storage folder does not exist!");
        return null;
    }

    if (fm.fileExists(storageDir) && !fm.isDirectory(storageDir)) {
        console.log("Storage folder exists but is not a directory!");
        return null;
    }

    if (!fm.fileExists(parameterPath)) {
        console.log("Parameter file does not exist!");
        return null;
    }
    
    const parameterString = fm.readString(parameterPath);

    const parameterJSON = JSON.parse(parameterString)
    if (parameterJSON !== null) {
        return parameterJSON;
    } else {
        console.log("Could not load parameter file as JSON!");
        return null;
    }
}

/**
 * Attempts to write the file ./storage/name.json
 * Returns false if it cannot be written.
 */
function writeStoredParameters(name, params) {
    let fm = FileManager.local()

    const thisScriptPath = module.filename
    const storageDir = thisScriptPath.replace(fm.fileName(thisScriptPath, true), '') + "storage"
    const parameterFile = name + ".json";
    const parameterPath = storageDir + "/" + parameterFile;

    if (!fm.fileExists(storageDir)) {
        console.log("Storage folder does not exist! Creating now.");
        fm.createDirectory(storageDir);
    } else if (!fm.isDirectory(storageDir)) {
        console.error("Storage folder exists but is not a directory!");
        return false;
    }

    if (fm.fileExists(parameterPath) && fm.isDirectory(parameterPath)) {
        console.error("Parameter file is a directory, please delete!");
        return false;
    }

    fm.writeString(parameterPath, JSON.stringify(params))

    return true;
}

console.log(loadStoredParameters("test"))
console.log(writeStoredParameters("test", params))
console.log(loadStoredParameters("test"))
