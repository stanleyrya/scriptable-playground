// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: user-astronaut;

const blocklist = [
  "Oncall",
  "Cleaners",
  "Haircut",
  "Prep"
]

/**
 * Checks if a list of events are considered "busy". Uses the blocklist.
 *
 * @param  {[CalendarEvent]} events - the events that are being processed
 * @return boolean isBusy
 */
function areEventsBusy(events) {
    for (const event of events) {
        if (blocklist && blocklist.includes(event["title"])) {
            continue;
        }

        return true;
    }
    return false;
}

/**
 * For a given Date object, check if the day is considered "busy".
 *
 * @param  {Date} date - the date that will be processed
 * @return boolean isBusy
 */
async function isDateBusy(date) {
    let events = await CalendarEvent.between(
        new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        // quick hack to just use default calendar
        [await Calendar.defaultForEvents()]
    );

    return areEventsBusy(events);
}

/**
 * Checks each day going backwards until one day is "not busy".
 * Returns the number of days since that free day, capping out at 365.
 *
 * @return number daysSinceLastFreeDay
 */
async function getNumberOfDaysSinceLastFree() {
    const frequencyMap = {};

    const dateIterator = new Date();
    let i = 0;
    while (await isDateBusy(dateIterator)) {
        if (i > 365) {
            return 365
        }

        i++;
        dateIterator.setDate(dateIterator.getDate() - 1);
    }

    return i;
}


async function createWidget(width, height) {
    let widget = new ListWidget();
    widget.setPadding(0, 0, 0, 0);

    widget.addSpacer(20);

    const titleText = widget.addText("Days Since Last Free:");
    titleText.centerAlignText();
    titleText.font = Font.boldRoundedSystemFont(12);

    widget.addSpacer();

    const i = await getNumberOfDaysSinceLastFree();
    const widgetText = widget.addText(i + "");
    widgetText.centerAlignText();
    widgetText.font = Font.boldRoundedSystemFont(100);

    widget.addSpacer();
    widget.addSpacer();

    return widget;
}

if (config.runsInWidget) {
    const width = config.widgetFamily === "small" ? 250 : 530;
    const height = config.widgetFamily === "large" ? 530 : 250;
    const widget = await createWidget(width, height);
    Script.setWidget(widget);
    Script.complete();
} else {
    const widget = await createWidget(250, 250);
    await widget.presentLarge();
}
