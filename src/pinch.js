/**
* @name pinch
*
* @desc Node script for parallel scraping pages using options passed from a JSON configuration file.
*/

const puppeteer = require('puppeteer')
fs = require('fs')
let parser = require('xml2json')
const parallel = 8

// MAIN MODULE TO EXPORT
const pinch = async() => {
	// Load config file
	const cf = require("../pinch.config.json")
	// If XML convert to JSON
	let urlSet
	if (cf.urlSourcePath.match(/\.xml$/g)) {
		urlSet = convertJson(cf.urlSourcePath)
	} else {
		urlSet = JSON.parse(fs.readFileSync(cf.urlSourcePath))
	}

	// Set up header row
	let headings = []
	for(e of cf.elements) {
		headings.push(e.heading)
	}
	const headerRow = `"` + headings.join(`","`) + `"`

	const parallelBatches = Math.ceil(urlSet.length / parallel)

	console.log(`Scraping ${urlSet.length} pages, in batches of ${parallel}`)

	console.log(`This will result in ${parallelBatches} batches.`)
	console.log(headerRow)
}

function convertJson(inPath) {
	// Converts an XML file to JSON object
	const xmlFile = fs.readFileSync(inPath)
	let arrUrls = []
	const jsonEqv = parser.toJson(xmlFile)
	const json = JSON.parse(jsonEqv)
	const urls = json.urlset.url
	for(u of urls) {
		arrUrls.push(u.loc)
	}
	return arrUrls
}

pinch()