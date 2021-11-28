// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: university;

// Find property values:
// https://m.wikidata.org/wiki/Special:Search?search=Population&ns120=1&fulltext=Search+a+property&fulltext=Search&searchToken=2x81n2swx4uv3qfxfummvh3pw

// Population:// 
// https://m.wikidata.org/wiki/Property:P1082

const getWikiUrlByPageId = (pageId) => `https://en.wikipedia.org/?curid=${pageId}`;
const getWikiUrlByCoords = (lat, lng) => `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=coordinates|pageimages&generator=geosearch&ggscoord=${lat}|${lng}&ggsradius=10000`;

/*
 * Calls wikipedia for nearby articles and modifies the object for ease of use.
 * Returns an empty array if there are no results or if there is a failure.
 *
 * Example Wikipedia API:
 * https://en.wikipedia.org/w/api.php?action=query&format=json&prop=coordinates%7Cpageimages&generator=geosearch&ggscoord=41.68365535753726|-70.19823287890266&ggsradius=10000
 *
 * Useful Wikipedia article on how to use API with location and images:
 * https://www.mediawiki.org/wiki/API:Geosearch#Example_3:_Search_for_pages_nearby_with_images
 *
 * Useful StackOverflow article about using Wikipedia API with location and images:
 * https://stackoverflow.com/questions/24529853/how-to-get-more-info-within-only-one-geosearch-call-via-wikipedia-api
 *
 * Example output from Wikipedia:
 * {"batchcomplete":"","query":{"pages":{"38743":{"pageid":38743,"ns":0,"title":"Cape Cod","index":-1,"coordinates":[{"lat":41.68,"lon":-70.2,"primary":"","globe":"earth"}],"thumbnail":{"source":"https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Ccnatsea.jpg/50px-Ccnatsea.jpg","width":50,"height":34},"pageimage":"Ccnatsea.jpg"}}}}
 *
 * Example output: [{
 *   lat: 41.68
 *   lng: -70.2
 *   thumbnail: {source: "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Ccnatsea.jpg/50px-Ccnatsea.jpg", width: 50, height: 34}
 *   title: "Cape Cod",
 *   url: https://en.wikipedia.org/?38743
 * }]
 */
async function getNearbyWikiArticles(location) {
	try {
		const uri = getWikiUrlByCoords(location.latitude, location.longitude);
		logger.log('Request URI: ' + uri);
		const request = new Request(encodeURI(uri));
		const wikiJSON = await request.loadJSON();

		let articles;
		if (wikiJSON && wikiJSON.query && wikiJSON.query.pages) {
			articles = wikiJSON.query.pages;
		} else {
			throw new Error("Could not read data from wikipedia");
		}

		var response = Object.values(articles).map(article => ({
			"url": getWikiUrlByPageId(article.pageid),
			"title": article.title,
			"lng": article.coordinates[0].lon,
			"lat": article.coordinates[0].lat,
			"thumbnail": article.thumbnail
		}));
		return response;
	} catch (e) {
		logger.log(e);
		return [];
	}
}




// TESTING WITH SEATTLE

console.log(getWikiUrlByPageId('11388236'));
