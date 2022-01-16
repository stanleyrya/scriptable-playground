// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: calendar-check;
const numDays = 90;
const blocklist = [
  "Oncall",
  "Cleaners",
  "Haircut",
  "Prep"
]

// get widget params
const params = JSON.parse(args.widgetParameter) || {};

/**
 * Author: Ryan Stanley (stanleyrya@gmail.com)
 * Tips: https://www.paypal.me/stanleyrya
 *
 * Adds events to the frequency map
 *
 * @param  {[CalendarEvent]} events - the events that are being processed
 * @param  {Map<String,num>} frequencyMap - a map of event names to their frequency
 * @return frequencyMap
 */
function addToFrequencyMap(events, frequencyMap) {
    for (const event of events) {
        const eventTitle = event["title"];

        if (blocklist && blocklist.includes(eventTitle)) {
            continue;
        }

        if (frequencyMap[eventTitle]) {
            frequencyMap[event["title"]]++;
        } else {
            frequencyMap[event["title"]] = 1;
        }
    }
    return frequencyMap;
}

/**
 * Creates an object that describes a calendar day. Currently contains "isBusy" and "isOncall":
 * {"isBusy":true,"isOncall":true}
 *
 * @param  {Date} date - a date object that will be described
 * @param  {Map<String,num>} frequencyMap - a map of event names to their frequency
 */
async function buildDay(date, frequencyMap) {
    let events = await CalendarEvent.between(
        new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        // quick hack to just use default calendar
    [await Calendar.defaultForEvents()]
    );

    addToFrequencyMap(events, frequencyMap);
}

/**
 * Creates a map of days in the month to a description of said day. Currently contains "isBusy" and "isOncall":
 * {"1":{"isBusy":true,"isOncall":true},"2":...}
 *
 * @param  {Date} date - a date object that holds the current month
 * @return frequencyMap
 */
async function processPreviousDays(numDays) {
    const frequencyMap = {};

    const currentDate = new Date();
    const endDate = new Date();
    endDate.setDate(currentDate.getDate() - numDays);

    for (var d = new Date(); d >= endDate; d.setDate(d.getDate() - 1)) {
        await buildDay(d, frequencyMap);
    }

    return frequencyMap;
}

if (params) {
  console.log("Using params: " + JSON.stringify(params))
  const frequencyMap = await processPreviousDays(numDays);
  console.log(frequencyMap);
} else {
  console.log("No valid parameters!")
}
