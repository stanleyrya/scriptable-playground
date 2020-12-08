// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: file-medical-alt;

/**
 * Class that can capture the time functions take in milliseconds then export them to a CSV.
 *
 * This is a minified version but it can be replaced with the full version by copy pasting this code!
 * https://github.com/stanleyrya/scriptable-playground/blob/main/append-to-performance-metrics.js
 *
 * Usage:
 *  * wrap(fn, args): Wrap the function calls you want to monitor with this wrapper.
 *  * appendPerformanceDataToFile(relativePath): Use at the end of your script to write the metrics to the CSV file at the relative file path.
 */
class PerformanceDebugger {

	constructor() {
		this.performanceResultsInMillis = {};
	}

	/**
	 * Times a function's execution in milliseconds and stores the results in the performanceResultsInMillis object.
	 *
	 * Here are two examples on how to use it, one without parameters and one with:
	 * let currLocation = await performanceWrapper(getCurrentLocation);
	 * let wikiArticles = await performanceWrapper(getNearbyWikiArticles, [currLocation.latitude, currLocation.longitude]);
	 *
	 * Here's an example of what the performanceResultsInMillis would look like after those two function calls:
	 * { "getCurrentLocation": 3200, "getNearbyWikiArticles": 312 }
	 */
	async wrap(fn, args) {
		const start = Date.now();
		const result = await fn.apply(null, args);
		const end = Date.now();
		this.performanceResultsInMillis[fn.name] = (end - start);
		return result;
	}

	/**
	 * Attempts to write the performanceResultsInMillis object to the relative file path.
	 *
	 * Example file output looks like this:
	 * getCurrentLocation, getNearbyWikiArticles
	 * 3200, 312
	 * 450, 300
	 */
	appendPerformanceDataToFile(relativePath) {
        const fm = this.getFileManager();
        const metricsPath = this.getCurrentDir() + relativePath;

        const splitRelativePath = relativePath.split("/");
        if (splitRelativePath > 1) {
            const fileName = splitRelativePath[splitRelativePath.length - 1];
            const jsonDirectory = metricsPath.replace("/" + fileName, "");
            fm.createDirectory(jsonDirectory, true);
        }

        if (fm.fileExists(metricsPath) && fm.isDirectory(metricsPath)) {
            throw ("Performance file is a directory, please delete!");
        }

		let headersAvailable = Object.getOwnPropertyNames(this.performanceResultsInMillis);

		let headers;
		let fileData;

		if (fm.fileExists(metricsPath)) {
			console.log("File exists, reading headers. To keep things easy we're only going to write to these headers.");

			// Doesn't fail with local filesystem
			fm.downloadFileFromiCloud(metricsPath);

			fileData = fm.readString(metricsPath);
			const firstLine = this.getFirstLine(fileData);
			headers = firstLine.split(',');
		} else {
			console.log("File doesn't exist, using available headers.");
			headers = headersAvailable;
			fileData = headers.toString();
		}

		// Append the data if it exists for the available headers
		fileData = fileData.concat("\n");
		for (const header of headers) {
			if (this.performanceResultsInMillis[header]) {
				fileData = fileData.concat(this.performanceResultsInMillis[header]);
			}
			fileData = fileData.concat(",");
		}
		fileData = fileData.slice(0, -1);

		fm.writeString(metricsPath, fileData);
	}

	getFirstLine(text) {
		var index = text.indexOf("\n");
		if (index === -1) index = undefined;
		return text.substring(0, index);
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

function testFunction1() {
    console.log("hi");
}

function testFunction2(arg1) {
    console.log(arg1);
}

const performanceDebugger = new PerformanceDebugger();

await performanceDebugger.wrap(testFunction1);
await performanceDebugger.wrap(testFunction2, ["hello"]);

performanceDebugger.appendPerformanceDataToFile("storage/test-performance-metrics.csv");
