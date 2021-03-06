// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;
/*
 * SETUP
 * Use this section to set up the widget.
 * ======================================
 */

// Get a free API key here: openweathermap.org/appid
const apiKey = "812738429b0b97f4d746b0c4a3f8affd"

// Set to true for fixed location, false to update location as you move around
const lockLocation = false

// Set to imperial for Fahrenheit, or metric for Celsius
const units = "imperial"

// The size of the widget preview in the app.
const widgetPreview = "medium"

// Set to true for an image background, false for no image.
const imageBackground = false

// Set to true and run the script once to update the image manually.
const forceImageUpdate = false

// Set the two-letter locale code for the date and weather formatting.
const locale = "en"

// You can change the language or wording of any other text in the widget.
const localizedText = {
  
  // The text shown if you add a greeting item to the layout.
  nightGreeting: "Good night."
  ,morningGreeting: "Conquering the day."
  ,afternoonGreeting: "Wrapping up tasks."
  ,eveningGreeting: "Winding down."
  
  // The text shown if you add a future weather item to the layout, or tomorrow's events.
  ,nextHourLabel: "Next hour"
  ,tomorrowLabel: "Tomorrow"

  // The text shown in an events item when no events remain.
  // Change to blank "" if you don't want to show a message.
  ,noEventMessage: "Share joy."
  
//   Reminders header text

,remindersHeader: "Reminders:"
     
}


/*
 * LAYOUT
 * Decide what elements to show on the widget.
 * ===========================================
 */

// Set the width of the column, or set to 0 for an automatic width.

// You can add items to the column: 
// date, greeting, events, current, future, text("Your text here"), tasks
// You can also add a left, center, or right to the list. Everything after it will be aligned that way.

// Make sure to always put a comma after each item.

const columns = [{
  
  // Settings for the left column.
  width: 0,
  items: [
    
    left,
    
    
    date,
    greeting,
    events,
    
end]}, {

  // Settings for the right column.
  width: 80,
  items: [
    
    right,
    current,
    right,
    future,
    
    
  
end]}]

/*
 * FORMATTING
 * Choose how each element is displayed.
 * =====================================
 */  

// EVENTS
// ======

// How many events to show.
const numberOfEvents = 3

// Show all-day events.
const showAllDay = false

// Show tomorrow's events.
const showTomorrow = false

// Can be blank "" or set to "duration" or "time" to display how long an event is.
const showEventLength = "duration"

// REMINDERS
// =========

// How many reminders to show.
const numberOfTasks = 2

// WEATHER
// =======

// Show today's high and low temperatures.
const showHighLow = true

// Set the hour (in 24-hour time) to switch to tomorrow's weather. Set to 24 to never show it.
const tomorrowShownAtHour = 14

// DATE
// ====

// If set to true, date will become smaller when events are displayed.
const dynamicDateSize = true

// If the date is not dynamic, should it be large or small?
const staticDateSize = "small"

// Determine the date format for each element. See docs.scriptable.app/dateformatter
const smallDateFormat = "EEEE, MMMM dd"
const largeDateLineOne = "EEEE,"
const largeDateLineTwo = "MMMM d"

// In this section, set the font, size, and color. Use iosfonts.com to find fonts to use. If you want to use the default iOS font, set the font name to one of the following: ultralight, light, regular, medium, semibold, bold, heavy, black, or italic.
const textFormat = {
  
  // Set the default font and color.
  defaultText: { size: 8, color: "ffffff", font: "regular" },
  
  // Any blank values will use the default.
  smallDate:   { size: 10, color: "", font: "semibold" },
  largeDate1:  { size: 30, color: "", font: "light" },
  largeDate2:  { size: 30, color: "", font: "light" },
  
  greeting:    { size: 18, color: "", font: "bold" },
  eventTitle:  { size: 10, color: "", font: "semibold" },
  eventTime:   { size: 8, color: "ffffff", font: "light" },
  
  overdueTask:   { size: 10, color: "FFffff", font: "regular" },
  
  largeTemp:   { size: 24, color: "", font: "light" },
  smallTemp:   { size: 10, color: "", font: "" },
  tinyTemp:    { size: 8, color: "", font: "light" },
  
  customText:  { size: 10, color: "", font: "" },
  
}

/*
 * WIDGET CODE
 * Be more careful editing this section. 
 * =====================================
 */

// Set up the date and event information.
const currentDate = new Date()
const todayEvents = await CalendarEvent.thisWeek([])
const tomorrowEvents = await CalendarEvent.tomorrow([])
const futureEvents = enumerateEvents()
const eventsAreVisible = (futureEvents.length > 0) && (numberOfEvents > 0)


// Get incomplete reminders for today
const allTasks = await Reminder.allIncomplete()

// Set up the file manager.
const files = FileManager.local()

// Set up the location logic.
const locationPath = files.joinPath(files.documentsDirectory(), "weather-cal-location")
var latitude, longitude

// If we're locking our location and it's saved already, read from the file.
if (lockLocation && files.fileExists(locationPath)) {
  const locationStr = files.readString(locationPath).split(",")
  latitude = locationStr[0]
  longitude = locationStr[1]

// Otherwise, get the location from the system.
} else {
  const location = await Location.current()
  latitude = location.latitude
  longitude = location.longitude
  files.writeString(locationPath, latitude + "," + longitude)
}

// Set up the cache.
const cachePath = files.joinPath(files.documentsDirectory(), "weather-cal-cache")
const cacheExists = files.fileExists(cachePath)
const cacheDate = cacheExists ? files.modificationDate(cachePath) : 0
var data

// If cache exists and it's been less than 60 seconds since last request, use cached data.
if (cacheExists && (currentDate.getTime() - cacheDate.getTime()) < 60000) {
  const cache = files.readString(cachePath)
  data = JSON.parse(cache)

// Otherwise, use the API to get new weather data.
} else {
  const weatherReq = "https://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude + "&exclude=minutely,alerts&units=" + units + "&lang=" + locale + "&appid=" + apiKey
  data = await new Request(weatherReq).loadJSON()
  files.writeString(cachePath, JSON.stringify(data))
}

// Store the weather values.
const currentTemp = data.current.temp
const currentCondition = data.current.weather[0].id
const todayHigh = data.daily[0].temp.max
const todayLow = data.daily[0].temp.min

const nextHourTemp = data.hourly[1].temp
const nextHourCondition = data.hourly[1].weather[0].id

const tomorrowHigh = data.daily[1].temp.max
const tomorrowLow = data.daily[1].temp.min
const tomorrowCondition = data.daily[1].weather[0].id

// Set up the sunrise/sunset cache.
const sunCachePath = files.joinPath(files.documentsDirectory(), "weather-cal-sun")
const sunCacheExists = files.fileExists(sunCachePath)
const sunCacheDate = sunCacheExists ? files.modificationDate(sunCachePath) : 0
var sunData

// If cache exists and it was created today, use cached data.
if (sunCacheExists && sameDay(currentDate, sunCacheDate)) {
  const sunCache = files.readString(sunCachePath)
  sunData = JSON.parse(sunCache)

// Otherwise, use the API to get sunrise and sunset times.
} else {
  const sunReq = "https://api.sunrise-sunset.org/json?lat=" + latitude + "&lng=" + longitude + "&formatted=0&date=" + currentDate.getFullYear() + "-" + (currentDate.getMonth()+1) + "-" + currentDate.getDate()
  sunData = await new Request(sunReq).loadJSON()
  files.writeString(sunCachePath, JSON.stringify(sunData))
}

// Store the timing values.
const sunrise = new Date(sunData.results.sunrise).getTime()
const sunset = new Date(sunData.results.sunset).getTime()
const utcTime = currentDate.getTime()

/*
 * COLUMNS AND PADDING
 * ===================
 */

// Set up the widget and the main stack.
let widget = new ListWidget()
widget.setPadding(0, 0, 0, 0)

let mainStack = widget.addStack()
mainStack.layoutHorizontally()
mainStack.setPadding(5, 10, 5, 10)

// Set up alignment
var currentAlignment = left

// Set up our columns.
for (var x = 0; x < columns.length; x++) {

  let column = columns[x]
  let columnStack = mainStack.addStack()
  columnStack.layoutVertically()
  
  // Only add padding on the first or last column.
  columnStack.setPadding(0, x == 0 ? 0 : 0, 0, x == columns.length-1 ? 0 : 0)
  columnStack.size = new Size(column.width,0)
  
  // Add the items to the column.
  for (var i = 0; i < column.items.length; i++) {
    column.items[i](columnStack)
  }
}

/*
 * BACKGROUND DISPLAY
 * ==================
 */

// If it's an image background, display it.
if (imageBackground) {
  
  // Determine if our image exists and when it was saved.
  const path = files.joinPath(files.documentsDirectory(), "weather-cal-image")
  const exists = files.fileExists(path)
  const createdToday = exists ? sameDay(files.modificationDate(path),currentDate) : false
  
  // If it exists and updates aren't being forced, use the cache.
  if (exists && !forceImageUpdate) { 
    widget.backgroundImage = files.readImage(path)
  
  // If it's missing or forced to update...
  } else if (!exists || forceImageUpdate) { 
    
    // ... just use a gray background if we're in the widget.
    if (config.runsInWidget) { 
      widget.backgroundColor = Color.gray() 
    
    // But if we're running in app, prompt the user for the image.
    } else {
      const img = await Photos.fromLibrary()
      widget.backgroundImage = img
      files.writeImage(path, img)
    }
  }
    
// If it's not an image background, show the gradient.
} else {
  let gradient = new LinearGradient()
  let gradientSettings = getGradientSettings()
  
  gradient.colors = gradientSettings.color()
  gradient.locations = gradientSettings.position()
  
  widget.backgroundGradient = gradient
}

Script.setWidget(widget)
if (widgetPreview == "small") { widget.presentSmall() }
else if (widgetPreview == "medium") { widget.presentMedium() }
else if (widgetPreview == "large") { widget.presentLarge() }
Script.complete()

/*
 * IMAGES AND FORMATTING
 * =====================
 */



// Get the gradient settings for each time of day.
function getGradientSettings() {

  let gradient = {
		"dawn": {
			"color": function() { return [new Color("1a1a1a"), new Color("333333"), new Color("F4A24E")] },
			"position": function() { return [0, 0.5, 0.9] }
		},
	
		"sunrise": {
			"color": function() { return [new Color("7567E3"), new Color("48A3D8"), new Color("F4A24E")] },
			"position": function() { return [-0.75, 0.45, 1.1] }
		},
	
		"midday": {
			"color": function() { return [new Color("48A3D8"), new Color("7567E3")] },
			"position": function() { return [0, 1] }
		},
	
		"noon": {
			"color": function() { return [new Color("48A3D8"), new Color("7567E3"), new Color("9C2C78")] },
			"position": function() { return [-0.2, 0.2, 1.5] }
		},
	
		"sunset": {
			"color": function() { return [new Color("F9554A"), new Color("9C2C78"), new Color("7567E3")] },
			"position": function() { return [-0.1, 0.75, 1.4] }
		},
	
		"twilight": {
			"color": function() { return [new Color("343434"), new Color("9C2C78"), new Color("F9554A")] },
			"position": function() { return [-0.05, 0.95, 1.4] }
		},
	
		"night": {
			"color": function() { return [new Color("101010"),  new Color("1a1a1a"),  new Color("1a1a1a"), new Color("9C2C78")] },
			"position": function() { return [-0.1, 0.4, 0.55, 1.0] }
		}
	}

  function closeTo(time,mins) {
    return Math.abs(utcTime - time) < (mins * 60000)
  }

  // Use sunrise or sunset if we're within 30min of it.
	if (closeTo(sunrise,15)) { return gradient.sunrise }
	if (closeTo(sunset,15)) { return gradient.sunset }

	// In the 30min before/after, use dawn/twilight.
	if (closeTo(sunrise,45) && utcTime < sunrise) { return gradient.dawn }
	if (closeTo(sunset,45) && utcTime > sunset) { return gradient.twilight }

    // Otherwise, if it's night, return night.
	if (isNight(currentDate)) { return gradient.night }

	// If it's around noon, the sun is high in the sky.
	if (currentDate.getHours() == 12) { return gradient.noon }

	// Otherwise, return the "typical" theme.
	return gradient.midday
}

// Provide a symbol based on the condition.
function provideSymbol(cond,night) {
  
  // Define our symbol equivalencies.
  let symbols = {
  
    // Thunderstorm
    "2": function() { return "cloud.bolt.rain.fill" },
    
    // Drizzle
    "3": function() { return "cloud.drizzle.fill" },
    
    // Rain
    "5": function() { return (cond == 511) ? "cloud.sleet.fill" : "cloud.rain.fill" },
    
    // Snow
    "6": function() { return (cond >= 611 && cond <= 613) ? "cloud.snow.fill" : "snow" },
    
    // Atmosphere
    "7": function() {
      if (cond == 781) { return "tornado" }
      if (cond == 701 || cond == 741) { return "cloud.fog.fill" }
      return night ? "cloud.fog.fill" : "sun.haze.fill"
    },
    
    // Clear and clouds
    "8": function() {
      if (cond == 800 || cond == 801) { return night ? "moon.stars.fill" : "sun.max.fill" }
      if (cond == 802 || cond == 803) { return night ? "cloud.moon.fill" : "cloud.sun.fill" }
      return "cloud.fill"
    }
  }
  
  // Find out the first digit.
  let conditionDigit = Math.floor(cond / 100)
  
  // Get the symbol.
  return SFSymbol.named(symbols[conditionDigit]()).image
}

// Provide a font based on the input.
function provideFont(fontName, fontSize) {
  const fontGenerator = {
    "ultralight": function() { return Font.ultraLightSystemFont(fontSize) },
    "light": function() { return Font.lightSystemFont(fontSize) },
    "regular": function() { return Font.regularSystemFont(fontSize) },
    "medium": function() { return Font.mediumSystemFont(fontSize) },
    "semibold": function() { return Font.semiboldSystemFont(fontSize) },
    "bold": function() { return Font.boldSystemFont(fontSize) },
    "heavy": function() { return Font.heavySystemFont(fontSize) },
    "black": function() { return Font.blackSystemFont(fontSize) },
    "italic": function() { return Font.italicSystemFont(fontSize) }
  }
  
  const systemFont = fontGenerator[fontName]
  if (systemFont) { return systemFont() }
  return new Font(fontName, fontSize)
}
 
// Format text based on the settings.
function formatText(textItem, format) {
  const textFont = format.font || textFormat.defaultText.font
  const textSize = format.size || textFormat.defaultText.size
  const textColor = format.color || textFormat.defaultText.color
  
  textItem.font = provideFont(textFont, textSize)
  textItem.textColor = new Color(textColor)
}

/*
 * HELPER FUNCTIONS
 * ================
 */

// Find future events that aren't all day and aren't canceled
function enumerateEvents() {

  // Function to determine if an event should be shown.
  function shouldShowEvent(event) {

    // Hack to remove canceled Office 365 events.
    if (event.title.startsWith("Canceled:")) { return false }

    // If it's an all-day event, only show if the setting is active.
    if (event.isAllDay) { return showAllDay }

    // Otherwise, return the event if it's in the future.
    return (event.startDate.getTime() > currentDate.getTime())
  }
  
  // Determine which events to show, and how many.
  let shownEvents = 0
  let returnedEvents = []
  
  for (const event of todayEvents) {
    if (shownEvents == numberOfEvents) { break }
    if (shouldShowEvent(event)) {
      returnedEvents.push(event)
      shownEvents++
    }
  }

  // If there's room and we need to, show tomorrow's events.
  let multipleTomorrowEvents = false
  if (showTomorrow && shownEvents < numberOfEvents) {

    for (const event of tomorrowEvents) {
      if (shownEvents == numberOfEvents) { break }
      if (shouldShowEvent(event)) {
      
        // Add the tomorrow label prior to the first tomorrow event.
        if (!multipleTomorrowEvents) { 
          
          // The tomorrow label is pretending to be an event.
          returnedEvents.push({ title: localizedText.tomorrowLabel.toUpperCase(), isAllDay: true, isLabel: true })
          multipleTomorrowEvents = true
        }
        
        // Show the tomorrow event and increment the counter.
        returnedEvents.push(event)
        shownEvents++
      }
    }
  }
  return returnedEvents
}

// Determines if the provided date is at night.
function isNight(dateInput) {
  const timeValue = dateInput.getTime()
  return (timeValue < sunrise) || (timeValue > sunset)
}

// Determines if two dates occur on the same day
function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}


/*
 * DRAWING FUNCTIONS
 * =================
 */

// Draw the vertical line in the tomorrow view.
function drawVerticalLine() {
  
  const w = 2
  const h = 20
  
  let draw = new DrawContext()
  draw.opaque = false
  draw.respectScreenScale = true
  draw.size = new Size(w,h)
  
  let barPath = new Path()
  const barHeight = h
  barPath.addRoundedRect(new Rect(0, 0, w, h), w/2, w/2)
  draw.addPath(barPath)
  draw.setFillColor(new Color("ffffff", 0.5))
  draw.fillPath()
  
  return draw.getImage()
}

// Draw the temp bar.
function drawTempBar() {

  // Set the size of the temp bar.
  const tempBarWidth = 300
  const tempBarHeight = 20
  
  // Calculate the current percentage of the high-low range.
  let percent = (currentTemp - todayLow) / (todayHigh - todayLow)

  // If we're out of bounds, clip it.
  if (percent < 0) {
    percent = 0
  } else if (percent > 1) {
    percent = 1
  }

  // Determine the scaled x-value for the current temp.
  const currPosition = (tempBarWidth - tempBarHeight) * percent

  // Start our draw context.
  let draw = new DrawContext()
  draw.opaque = false
  draw.respectScreenScale = true
  draw.size = new Size(tempBarWidth, tempBarHeight)

  // Make the path for the bar.
  let barPath = new Path()
  const barHeight = tempBarHeight - 10
  barPath.addRoundedRect(new Rect(0, 5, tempBarWidth, barHeight), barHeight / 2, barHeight / 2)
  draw.addPath(barPath)
  draw.setFillColor(new Color("ffffff", 0.5))
  draw.fillPath()

  // Make the path for the current temp indicator.
  let currPath = new Path()
  currPath.addEllipse(new Rect(currPosition, 0, tempBarHeight, tempBarHeight))
  draw.addPath(currPath)
  draw.setFillColor(new Color("ffffff", 1))
  draw.fillPath()

  return draw.getImage()
}

/*
 * ELEMENTS AND ALIGNMENT
 * ======================
 */

// Create an aligned stack to add content to.
function align(column) {
  
  // Add the containing stack to the column.
  let alignmentStack = column.addStack()
  alignmentStack.layoutHorizontally()
  
  // Get the correct stack from the alignment function.
  let returnStack = currentAlignment(alignmentStack)
  returnStack.layoutVertically()
  return returnStack
}

// Create a right-aligned stack.
function alignRight(alignmentStack) {
  alignmentStack.addSpacer()
  let returnStack = alignmentStack.addStack()
  return returnStack
}

// Create a left-aligned stack.
function alignLeft(alignmentStack) {
  let returnStack = alignmentStack.addStack()
  alignmentStack.addSpacer()
  return returnStack
}

// Create a center-aligned stack.
function alignCenter(alignmentStack) {
  alignmentStack.addSpacer()
  let returnStack = alignmentStack.addStack()
  alignmentStack.addSpacer()
  return returnStack
}

// Display the date on the widget.
function date(column) {

  // Set up the date formatter and set its locale.
  let df = new DateFormatter()
  df.locale = locale
  
  // Show small if it's hard coded, or if it's dynamic and events are visible.
  if ((dynamicDateSize && eventsAreVisible) || staticDateSize == "small") {
    let dateStack = align(column)
    dateStack.setPadding(10, 10, 0, 10)

    df.dateFormat = smallDateFormat
    let dateText = dateStack.addText(df.string(currentDate))
    formatText(dateText, textFormat.smallDate)
    
  // Otherwise, show the large date.
  } else {
    let dateOneStack = align(column)
    df.dateFormat = largeDateLineOne
    let dateOne = dateOneStack.addText(df.string(currentDate))
    formatText(dateOne, textFormat.largeDate1)
    dateOneStack.setPadding(10, 10, 0, 10)
    
    let dateTwoStack = align(column)
    df.dateFormat = largeDateLineTwo
    let dateTwo = dateTwoStack.addText(df.string(currentDate))
    formatText(dateTwo, textFormat.largeDate2)
    dateTwoStack.setPadding(0, 10, 0, 10)
  }
}

function greeting(column) {

  // This function makes a greeting based on the time of day.
  function makeGreeting() {
    const hour = currentDate.getHours()
    if (hour    < 5)  { return localizedText.nightGreeting }
    if (hour    < 12) { return localizedText.morningGreeting }
    if (hour-12 < 5)  { return localizedText.afternoonGreeting }
    if (hour-12 < 12) { return localizedText.eveningGreeting }
    return localizedText.nightGreeting
  }
  
  // Set up the greeting.
  let greetingStack = align(column)
  let greeting = greetingStack.addText(makeGreeting())
  formatText(greeting, textFormat.greeting)
  greetingStack.setPadding(5, 10, 0, 10)
}

// Display events on the widget.
function events(column) {

  // If nothing should be displayed, just return.
  if (!eventsAreVisible && !localizedText.noEventMessage.length) { return }
  
  // Set up the event stack.
  let eventStack = column.addStack()
  eventStack.layoutVertically()
  const todaySeconds = Math.floor(currentDate.getTime() / 1000) - 978307200
  eventStack.url = 'calshow:' + todaySeconds
  
  // If there are no events, show the message and return.
  if (!eventsAreVisible) {
    let message = eventStack.addText(localizedText.noEventMessage)
    formatText(message, textFormat.greeting)
    eventStack.setPadding(10, 10, 10, 10)
    return
  }
  
  // If we're not showing the message, don't pad the event stack.
  eventStack.setPadding(0, 0, 0, 0)
  
  var currentStack = eventStack
  
  // Add each event to the stack.
  for (let i = 0; i < futureEvents.length; i++) {
    
    const event = futureEvents[i]
    
    // If it's the tomorrow label, change to the tomorrow stack.
    if (event.isLabel) {
      let tomorrowStack = column.addStack()
      tomorrowStack.layoutVertically()
      const tomorrowSeconds = Math.floor(currentDate.getTime() / 1000) - 978220800
      tomorrowStack.url = 'calshow:' + tomorrowSeconds
      currentStack = tomorrowStack
    }
    
    const titleStack = align(currentStack)
    const title = titleStack.addText(event.title)
    formatText(title, textFormat.eventTitle)
    titleStack.setPadding(i==0 ? 10 : 5, 10, event.isAllDay ? 5 : 0, 10)
  
    // If there are too many events, limit the line height.
    if (futureEvents.length >= 3) { title.lineLimit = 1 }

    // If it's an all-day event, we don't need a time.
    if (event.isAllDay) { continue }
    
    // Format the time information.
    let df = new DateFormatter()
    df.useNoDateStyle()
    df.useShortTimeStyle()
    let timeText = df.string(event.startDate)
    
    // If we show the length as time, add an en dash and the time.
    if (showEventLength == "time") { 
      timeText += "????????" + df.string(event.endDate) 
      
    // If we should it as a duration, add the minutes.
    } else if (showEventLength == "duration") {
      const duration = (event.endDate.getTime() - event.startDate.getTime()) / (1000*60)
      timeText += " \u2022 " + Math.round(duration) + "m"
    }

    const timeStack = align(currentStack)
    const time = timeStack.addText(timeText)
    formatText(time, textFormat.eventTime)
    timeStack.setPadding(0, 10, i==futureEvents.length-1 ? 10 : 5, 10)
  }
}

// Display the current weather.
function current(column) {

  // Set up the current weather stack.
  let currentWeatherStack = column.addStack()
  currentWeatherStack.layoutVertically()
  currentWeatherStack.setPadding(5, 0, 0, 0)
  currentWeatherStack.url = "https://weather.com/weather/today/l/" + latitude + "," + longitude

  // Show the current condition symbol.
  let mainConditionStack = align(currentWeatherStack)
  let mainCondition = mainConditionStack.addImage(provideSymbol(currentCondition,isNight(currentDate)))
  mainCondition.imageSize = new Size(26,26)
  mainConditionStack.setPadding(10, 10, 0, 10)

  // Show the current temperature.
  let tempStack = align(currentWeatherStack)
  let temp = tempStack.addText(Math.round(currentTemp) + "??")
  tempStack.setPadding(0, 10, 0, 10)
  formatText(temp, textFormat.largeTemp)
  
  // If we're not showing the high and low, end it here.
  if (!showHighLow) { return }

  // Show the temp bar and high/low values.
  let tempBarStack = align(currentWeatherStack)
  tempBarStack.layoutVertically()
  tempBarStack.setPadding(0, 10, 5, 10)
  
  let tempBar = drawTempBar()
  let tempBarImage = tempBarStack.addImage(tempBar)
  tempBarImage.size = new Size(50,0)
  
  tempBarStack.addSpacer(1)
  
  let highLowStack = tempBarStack.addStack()
  highLowStack.layoutHorizontally()
  
  let mainLow = highLowStack.addText(Math.round(todayLow).toString())
  highLowStack.addSpacer()
  let mainHigh = highLowStack.addText(Math.round(todayHigh).toString())
  
  formatText(mainHigh, textFormat.tinyTemp)
  formatText(mainLow, textFormat.tinyTemp)
  
  tempBarStack.size = new Size(70,30)
}

// Display upcoming weather.
function future(column) {

  // Set up the future weather stack.
  let futureWeatherStack = column.addStack()
  futureWeatherStack.layoutVertically()
  futureWeatherStack.setPadding(0, 0, 0, 0)
  futureWeatherStack.url = "https://weather.com/weather/tenday/l/" + latitude + "," + longitude

  // Determine if we should show the next hour.
  const showNextHour = (currentDate.getHours() < tomorrowShownAtHour)
  
  // Set the label value.
  const subLabelText = showNextHour ? localizedText.nextHourLabel : localizedText.tomorrowLabel
  let subLabelStack = align(futureWeatherStack)
  let subLabel = subLabelStack.addText(subLabelText)
  formatText(subLabel, textFormat.smallTemp)
  subLabelStack.setPadding(0, 10, 2, 10)
  
  // Set up the sub condition stack.
  let subConditionStack = align(futureWeatherStack)
  subConditionStack.layoutHorizontally()
  subConditionStack.centerAlignContent()
  subConditionStack.setPadding(0, 10, 10, 10)
  
  // Determine what condition to show.
  var nightCondition
  if (showNextHour) {
    const addHour = currentDate.getTime() + (60*60*1000)
    const newDate = new Date(addHour)
    nightCondition = isNight(newDate)
  } else {
    nightCondition = false 
  }
  
  let subCondition = subConditionStack.addImage(provideSymbol(showNextHour ? nextHourCondition : tomorrowCondition,nightCondition))
  const subConditionSize = showNextHour ? 14 : 18
  subCondition.imageSize = new Size(subConditionSize, subConditionSize)
  subConditionStack.addSpacer(5)
  
  // The next part of the display changes significantly for next hour vs tomorrow.
  if (showNextHour) {
    let subTemp = subConditionStack.addText(Math.round(nextHourTemp) + "??")
    formatText(subTemp, textFormat.smallTemp)
    
  } else {
    let tomorrowLine = subConditionStack.addImage(drawVerticalLine())
    tomorrowLine.imageSize = new Size(3,28)
    subConditionStack.addSpacer(5)
    let tomorrowStack = subConditionStack.addStack()
    tomorrowStack.layoutVertically()
    
    let tomorrowHighText = tomorrowStack.addText(Math.round(tomorrowHigh) + "")
    tomorrowStack.addSpacer(4)
    let tomorrowLowText = tomorrowStack.addText(Math.round(tomorrowLow) + "")
    
    formatText(tomorrowHighText, textFormat.tinyTemp)
    formatText(tomorrowLowText, textFormat.tinyTemp)
  }
}

// Return a text-creation function.
function text(inputText) {
  
  function displayText(column) {
    let textStack = align(column)
    textStack.setPadding(10, 10, 10, 10)
    
    let textDisplay = textStack.addText(inputText)
    formatText(textDisplay, textFormat.customText)
  }
  return displayText
}

// Reminders

function tasks(column, alignment) {

// Sort reminders in chronological order  
  function sortItems(first, second) {
        return first.dueDate - second.dueDate
}

if (allTasks.length > 0) {
  let headingStack = align(column, alignment)
  const heading = headingStack.addText(localizedText.remindersHeader);
  formatText(heading, textFormat.eventTitle)
    headingStack.setPadding(10, 10, 0, 10)
  
    let taskStack = align(column, alignment)
    allTasks.sort(sortItems).slice(0, numberOfTasks).forEach(({ title, dueDate}) => {  
//  Show overdue reminders in red with no time     
      if (dueDate < currentDate) {
      const task = taskStack.addText(`???????? ${title}`);
        formatText(task, textFormat.overdueTask)
    taskStack.addSpacer(10)
    task.lineLimit = 1;
      }
      
//  Otherwise show upcoming reminders normally
      else {
      const task = taskStack.addText(`???????? ${title}`);
      formatText(task, textFormat.eventTitle)
    taskStack.setPadding(10, 10, 10, 10)
      task.lineLimit = 1;
      
      
      let df = new DateFormatter()
    df.useNoDateStyle()
    df.useShortTimeStyle()
    let timeText = df.string(dueDate)
 
const due = taskStack.addText(timeText); 
        formatText(due, textFormat.eventTime)
    taskStack.addSpacer(10)
 }
    });
  }
  
}

/*
 * MINI FUNCTIONS
 * ==============
 */

// This function adds a space.
function space(column) { column.addSpacer() }

// Change the current alignment to right.
function right(x) { currentAlignment = alignRight }

// Change the current alignment to left.
function left(x) { currentAlignment = alignLeft }

// Change the current alignment to center.
function center(x) { currentAlignment = alignCenter }

// This function doesn't need to do anything.
function end(x) { return }

Script.complete()
