// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: file-signature;

/**
 * Author: Ryan Stanley (stanleyrya@gmail.com)
 * Tips: https://www.paypal.me/stanleyrya
 *
 * Class that can read and write JSON objects using the file system.
 *
 * A minified version can be found here!
 * https://github.com/stanleyrya/scriptable-playground/tree/main/json-file-manager
 *
 * Usage:
 *  * write(relativePath, jsonObject): Writes JSON object to a relative path.
 *  * read(relativePath): Reads JSON object from a relative path.
 */
class JSONFileManager {

    /**
     * Attempts to write the jsonObject to the relative path.
     */
    write(relativePath, jsonObject) {
        const fm = this.getFileManager();
        const jsonPath = this.getCurrentDir() + relativePath;

        const splitRelativePath = relativePath.split("/");
        if (splitRelativePath > 1) {
            const fileName = splitRelativePath[splitRelativePath.length - 1];
            const jsonDirectory = jsonPath.replace("/" + fileName, "");
            fm.createDirectory(jsonDirectory, true);
        }

        if (fm.fileExists(jsonPath) && fm.isDirectory(jsonPath)) {
            throw ("JSON file is a directory, please delete!");
        }

        fm.writeString(jsonPath, JSON.stringify(jsonObject));
    }

    /**
     * Attempts to load JSON stored at the relative path.
     */
    read(relativePath) {
        const fm = this.getFileManager();
        const jsonPath = this.getCurrentDir() + relativePath;

        if (!fm.fileExists(jsonPath)) {
            throw ("JSON file does not exist! Could not load: " + jsonPath);
        } else if (fm.isDirectory(jsonPath)) {
            throw ("JSON file is a directory! Could not load: " + jsonPath);
        }

        // Doesn't fail with local filesystem
        fm.downloadFileFromiCloud(jsonPath);

        const loadedJSON = JSON.parse(fm.readString(jsonPath));
        if (loadedJSON !== null) {
            return loadedJSON;
        } else {
            throw ("Could not read file as JSON! Could not load: " + jsonPath);
        }
    }

    getFileManager() {
        try {
            return FileManager.iCloud();
        } catch (e) {
            return FileManager.local();
        }
    }

    getCurrentDir() {
        const fm = this.getFileManager();
        const thisScriptPath = module.filename;
        return thisScriptPath.replace(fm.fileName(thisScriptPath, true), '');
    }

}

const jsonFileManager = new JSONFileManager();
const params = { "apiKey": "testtest" };

console.log(jsonFileManager.read("storage/test.json"));
jsonFileManager.write("storage/test.json", params);
console.log(jsonFileManager.read("storage/test.json"));
