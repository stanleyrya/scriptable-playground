// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: file-import;

/**
 * Author: Ryan Stanley (stanleyrya@gmail.com)
 * Tips: https://www.paypal.me/stanleyrya
 *
 * Class that can write logs to the file system.
 *
 * A minified version can be found here!
 * https://github.com/stanleyrya/scriptable-playground/tree/main/file-logger
 *
 * Usage:
 *  * log(line): Adds the log line to the class' internal log object.
 *  * writeLogs(relativePath): Writes the stored logs to the relative file path.
 */
class FileLogger {

	constructor() {
		this.logs = "";
	}

	/**
	 * Stores the log line in the class so it can be written to a file later.
	 */
	log(line) {
		if (line instanceof Error) {
			console.error(line);
		} else {
			console.log(line);
		}
		this.logs += new Date() + " - " + line + "\n";
	}

	/**
	 * Attempts to write the stored logs to the relative path.
	 */
	writeLogs(relativePath) {
		const fm = this.getFileManager();
		const logPath = this.getCurrentDir() + relativePath;

		const splitRelativePath = relativePath.split("/");
		if (splitRelativePath > 1) {
			const fileName = splitRelativePath[splitRelativePath.length - 1];
			const jsonDirectory = logPath.replace("/" + fileName, "");
			fm.createDirectory(jsonDirectory, true);
		}

		if (fm.fileExists(logPath) && fm.isDirectory(logPath)) {
			throw ("Log file is a directory, please delete!");
		}

		fm.writeString(logPath, this.logs);
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

const logger = new FileLogger();

logger.log("testing here");
logger.log("also testing here");

try {
	throw ("error!")
} catch (err) {
	logger.log(err)
}

logger.writeLogs("storage/" + Script.name() + ".txt");
