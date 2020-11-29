let performanceMetrics = {"getCurrentLocation":3200,"getNearbyWikiArticles":312,"getMapsPicByCurrentLocations":535}
let performanceMetrics2 = {"getCurrentLocation":3200,"getNearbyWikiArticles":312}

appendPerformanceDataToFile("test", performanceMetrics);
// appendPerformanceDataToFile("test", performanceMetrics2);

/**
 * Attempts to write the file ./storage/name-performance-metrics.csv
 * Returns false if it cannot be written.
 */
function appendPerformanceDataToFile(name, performanceMetrics) {
    let fm = FileManager.local()

    const thisScriptPath = module.filename
    const storageDir = thisScriptPath.replace(fm.fileName(thisScriptPath, true), '') + "storage"
    const metricsFilename = name + '-performance-metrics.csv';
    const metricsPath = storageDir + "/" + metricsFilename;

    if (!fm.fileExists(storageDir)) {
        console.log("Storage folder does not exist! Creating now.");
        fm.createDirectory(storageDir);
    } else if (!fm.isDirectory(storageDir)) {
        console.error("Storage folder exists but is not a directory!");
        return false;
    }

    if (fm.fileExists(metricsPath) && fm.isDirectory(metricsPath)) {
        console.error("Metrics file is a directory, please delete!");
        return false;
    }

    let headersAvailable = Object.getOwnPropertyNames(performanceMetrics);

    let headers;
    let fileData;

    if (fm.fileExists(metricsPath)) {
        console.log("File exists, reading headers. To keep things easy we're only going to write to these headers.");
        fileData = fm.readString(metricsPath);
        let firstLine = getFirstLine(fileData);
        headers = firstLine.split(',');
    } else {
        console.log("File doesn't exist, using available headers.");
        headers = headersAvailable;
        fileData = headers.toString();
    }

    // Append the data if it exists for the available headers
    fileData = fileData.concat("\n");
    for (const header of headers) {
        if (performanceMetrics[header]) {
            fileData = fileData.concat(performanceMetrics[header]);
        }
        fileData = fileData.concat(",");
    }
    fileData = fileData.slice(0, -1);

    fm.writeString(metricsPath, fileData);
}

function getFirstLine(text) {
    var index = text.indexOf("\n");
    if (index === -1) index = undefined;
    return text.substring(0, index);
}
