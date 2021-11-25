# scriptable-playground

### Tips

Tips are not required but they are greatly appreciated. Please enjoy the scripts!
https://www.paypal.me/stanleyrya

### [file-logger](https://github.com/stanleyrya/scriptable-playground/blob/main/file-logger/file-logger.js)

Class that can write logs to the file system.

Usage:
 * log(line): Adds the log line to the class' internal log object.
 * writeLogs(relativePath): Writes the stored logs to the relative file path.

### [json-file-manager](https://github.com/stanleyrya/scriptable-playground/blob/main/json-file-manager/json-file-manager.js)

Class that can read and write JSON objects using the file system.

Usage:
 * write(relativePath, jsonObject): Writes JSON object to a relative path.
 * read(relativePath): Reads JSON object from a relative path.

### [performance-debugger](https://github.com/stanleyrya/scriptable-playground/blob/main/performance-debugger/performance-debugger.js)

Class that can capture the time functions take in milliseconds then export them to a CSV.

Usage:
 * wrap(fn, args): Wrap the function calls you want to monitor with this wrapper.
 * appendPerformanceDataToFile(relativePath): Use at the end of your script to write the metrics to the CSV file at the relative file path.

### [reverse-geocode-tests](https://github.com/stanleyrya/scriptable-playground/blob/main/reverse-geocode-tests.js)

A test script to play with reverse geocoding.
