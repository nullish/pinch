/**
* @name pinch
*
* @desc Node script for parallel scraping pages using options passed from a JSON configuration file.
*/

const puppeteer = require('puppeteer')
fs = require('fs')
let parser = require('xml2json')

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
	console.log(urlSet)
}

function convertJson(inPath) {
	// Converts an XML file to JSON object
	const xmlFile = fs.readFileSync(inPath)
	const jsonEqv = parser.toJson(xmlFile)
  	const json = JSON.parse(jsonEqv)
  	return json
}

pinch()