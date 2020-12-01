const params = {"apiKey": "testtest"};

function getCurrentDir() {
    const fm = FileManager.local();
    const thisScriptPath = module.filename;
    return thisScriptPath.replace(fm.fileName(thisScriptPath, true), '');
}

/**
 * Attempts to load the file ./storage/name.json
 * Returns null if it cannot be loaded.
 */
function loadStoredParameters(name) {
    const fm = FileManager.local();
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

    const parameterJSON = JSON.parse(fm.readString(parameterPath));
    if (parameterJSON !== null) {
        return parameterJSON;
    } else {
        console.log("Could not load parameter file as JSON!");
        return null;
    }
}

/**
 * Attempts to write the file ./storage/name.json
 */
function writeStoredParameters(name, params) {
    const fm = FileManager.local();
    const storageDir = getCurrentDir() + "storage";
    const parameterPath = storageDir + "/" + name + ".json";

    if (!fm.fileExists(storageDir)) {
        console.log("Storage folder does not exist! Creating now.");
        fm.createDirectory(storageDir);
    } else if (!fm.isDirectory(storageDir)) {
        throw("Storage folder exists but is not a directory!");
    }

    if (fm.fileExists(parameterPath) && fm.isDirectory(parameterPath)) {
        throw("Parameter file is a directory, please delete!");
    }

    fm.writeString(parameterPath, JSON.stringify(params));
}

console.log(loadStoredParameters("test"));
writeStoredParameters("test", params);
console.log(loadStoredParameters("test"));
