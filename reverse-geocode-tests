// Given coordinates, return a description of the current location in words (town name, etc.)
const getLocationDescription = async (lat, long) => {
	return Location.reverseGeocode(lat, long).then((res) => {
        console.log(res)
		return res[0]["locality"];
	}, err => console.log(`Could not 
reverse geocode location: ${err}`));
};

// In Water  ------------

// Spot Pond
// [{"thoroughfare":null,"isoCountryCode":"US","timeZone":"America/New_York","postalAddress":{"postalCode":"","country":"United States","isoCountryCode":"US","subLocality":"","subAdministrativeArea":"Middlesex","state":"MA","street":"","city":"Medford"},"location":{"latitude":42.4582873,"longitude":-71.1006188,"altitude":0},"country":"United States","subAdministrativeArea":"Middlesex","areasOfInterest":["Middlesex Fells Reservation"],"postalCode":null,"administrativeArea":"MA","inlandWater":"Spot Pond","ocean":null,"subThoroughfare":null,"locality":"Medford","subLocality":null,"name":"Spot Pond"}]
// await getLocationDescription(42.4582873, -71.1006188)

// Lake Washington
// [{"name":"Lake Washington","country":"United States","postalCode":null,"location":{"longitude":-122.2538685,"latitude":47.6025303,"altitude":0},"administrativeArea":"WA","postalAddress":{"subLocality":"","subAdministrativeArea":"King","country":"United States","city":"Bellevue","isoCountryCode":"US","state":"WA","postalCode":"","street":""},"inlandWater":"Lake Washington","subThoroughfare":null,"timeZone":"America/Los_Angeles","ocean":null,"thoroughfare":null,"isoCountryCode":"US","locality":"Bellevue","subLocality":null,"areasOfInterest":null,"subAdministrativeArea":"King"}]
// await getLocationDescription(47.6025303, -122.2538685)

// Pacific Ocean
// [{"areasOfInterest":null,"administrativeArea":null,"subThoroughfare":null,"timeZone":"GMT-0900","inlandWater":null,"country":null,"isoCountryCode":null,"postalAddress":{"state":"","street":"","subLocality":"","city":"","postalCode":"","country":"","isoCountryCode":"","subAdministrativeArea":""},"name":"North Pacific Ocean","locality":null,"postalCode":null,"ocean":"North Pacific Ocean","thoroughfare":null,"subLocality":null,"location":{"latitude":45.185125,"longitude":-130.9194954,"altitude":0},"subAdministrativeArea":null}]
// await getLocationDescription(45.1851250, -130.9194954)

// On Land ------------

// Boston
// [{"areasOfInterest":["Boston Common"],"subThoroughfare":"121","inlandWater":null,"location":{"altitude":0,"latitude":42.354997,"longitude":-71.0644556},"name":"Boston Common","thoroughfare":"Tremont St","locality":"Boston","timeZone":"America/New_York","postalCode":"02108","ocean":null,"subAdministrativeArea":"Suffolk","subLocality":"Boston Common","postalAddress":{"isoCountryCode":"US","subAdministrativeArea":"Suffolk","state":"MA","country":"United States","postalCode":"02108","city":"Boston","subLocality":"Boston Common","street":"121 Tremont St"},"isoCountryCode":"US","country":"United States","administrativeArea":"MA"}]
// await getLocationDescription(42.3549970, -71.0644556)

// London
// [{"timeZone":"Europe/London","ocean":null,"locality":"London","inlandWater":null,"subLocality":"City of Westminster","name":"Buckingham Palace","administrativeArea":"England","postalCode":"SW1A","thoroughfare":"Constitution Hill","country":"United Kingdom","areasOfInterest":["Buckingham Palace"],"isoCountryCode":"GB","location":{"altitude":0,"latitude":51.5017166,"longitude":-0.1414114},"postalAddress":{"subLocality":"City of Westminster","isoCountryCode":"GB","city":"London","state":"England","street":"Constitution Hill","subAdministrativeArea":"London","country":"United Kingdom","postalCode":"SW1A"},"subThoroughfare":null,"subAdministrativeArea":"London"}]
// await getLocationDescription(51.5017166, -0.1414114)

// Seattle
// [{"postalAddress":{"street":"1333 5th Ave","country":"United States","city":"Seattle","subAdministrativeArea":"King","state":"WA","postalCode":"98101","isoCountryCode":"US","subLocality":"CBD"},"timeZone":"America/Los_Angeles","country":"United States","thoroughfare":"5th Ave","ocean":null,"locality":"Seattle","postalCode":"98101","subAdministrativeArea":"King","name":"1333 5th Ave","administrativeArea":"WA","subThoroughfare":"1333","location":{"longitude":-122.334357,"latitude":47.6093372,"altitude":0},"inlandWater":null,"areasOfInterest":null,"subLocality":"CBD","isoCountryCode":"US"}]
// await getLocationDescription(47.6093372, -122.3343570)

// Oslo
// [{"thoroughfare":"Trelastgata","areasOfInterest":null,"administrativeArea":"Oslo","country":"Norway","postalAddress":{"country":"Norway","city":"Oslo","subAdministrativeArea":"","street":"Trelastgata","isoCountryCode":"NO","subLocality":"Sentrum","postalCode":"0191","state":"Oslo"},"name":"Trelastgata","isoCountryCode":"NO","inlandWater":null,"ocean":null,"location":{"latitude":59.9103521,"longitude":10.7532188,"altitude":0},"subAdministrativeArea":null,"locality":"Oslo","timeZone":"Europe/Oslo","subThoroughfare":null,"postalCode":"0191","subLocality":"Sentrum"}]
// await getLocationDescription(59.9103521, 10.7532188)
