/**
 * Attempts to load the file ./storage/filename.json
 * Returns null if it cannot be loaded.
 */
function loadStoredParameters() {
    let fm = FileManager.local()

    const scriptPath = module.filename
    const storageDir = scriptPath.replace(fm.fileName(scriptPath, true), '') + "storage"
    const parameterFile = Script.name() + ".json";
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

console.log(loadStoredParameters())
