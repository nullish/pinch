/**
* @name pinch
*
* @desc Node script for parallel scraping pages using options passed from a JSON configuration file.
*/

const puppeteer = require('puppeteer')
fs = require('fs')
const yargs = require('yargs')
let parser = require('xml2json')
const parallel = 8

// MAIN MODULE TO EXPORT
const pinch = async() => {
	// Command line parameters
	const argv = yargs
	.option('config', {
		alias: 'c',
		default: '../pinch.config.json',
		describe: 'Config JSON file with settings to run',
		type: 'string'
	})
	.option('output', {
		alias: 'o',
		default: './outputs/pinch.csv',
		describe: 'Location of CSV output',
		type: 'string'
	})
	.argv
	// Load config file
	const cf = require(argv.config)
	// Get output file
	const outfile = argv.output
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
	const headerRow = `"timestamp","batch","url","` + headings.join(`","`) + `"\n`

	const parallelBatches = Math.ceil(urlSet.length / parallel)

	console.log(`Scraping ${urlSet.length} pages, in batches of ${parallel}`)

	console.log(`This will result in ${parallelBatches} batches.`)
	await fs.appendFile(outfile, headerRow, (err) => {
		if (err) throw err
			console.log(headerRow)    
	})
	

	// Split up the Array of urlSet
	let k = 0
	for (let i = 0; i < urlSet.length; i += parallel) {
		k++
    // Launch and Setup Chromium
    const browser = await puppeteer.launch();
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    page.setJavaScriptEnabled(cf.javascriptEnabled)

    const promises = []
    for (let j = 0; j < parallel; j++) {
    	let elem = i + j
      // only proceed if there is an element 
      if (urlSet[elem] != undefined) {
        // Promise to scrape pages
        // promises push
        promises.push(browser.newPage().then(async page => { 
        	let timeStamp = new Date(Date.now()).toUTCString(); 
        	let outRow = `"${timeStamp}","${k}","${urlSet[elem]}"`        
        	try {
            // Set default navigation timeout.
            await page.setDefaultNavigationTimeout(cf.defaultTimeout); 
            // Goto page, wait for timeout as specified in JSON input
            let res = await page.goto(urlSet[elem])
            // Get HTTP status code

            // Element to wait for to confirm page load
            await page.waitForXPath("//title");
            // Loop through specified elements, writing out values to console
            for (e of cf.elements) {
            	let elHandle = await page.$x(e.elementSelector);
            // Get attribute value to report
            if (elHandle.length > 0) {
	              // Get HTML or text value of element if specified. Otherwise get value specified by attribute.
	              let txtOut
	              switch (e.elementValue) {
	              	case "innerText":
	              	txtOut = await page.evaluate((el) => el.innerText, elHandle[0]);
	              	outRow += `,"${txtOut}"`
	              	break;
	              	case "innerHTML":
	              	txtOut = await page.evaluate((el) => el.innerHTML, elHandle[0]);
	              	outRow += `,"${txtOut}"` 
	              	break;
	              	default:
	              	txtOut = await page.evaluate((el,a) => el.getAttribute(a), elHandle[0], e.elementValue);
	              	outRow += `,"${txtOut}"` 	              	
	              }
	          } else {
	              // response if element not found on page
	              outRow += `,"ELEMENT NOT FOUND"`
	          }
	      }
	  } catch (err) {
            // Report failing element and standard error response
            let timeStamp = new Date(Date.now()).toUTCString();
            console.log(`"${timeStamp}","${k}","${urlSet[elem]}","","${err}"`)
        }
        // Add output row to file.
        await fs.appendFile(outfile, `${outRow}\n`, (err) => {
        	if (err) throw err
        		console.log(`${outRow}\n`)
        })
    }))
    }
}

    // await promise all and close browser
    await Promise.all(promises)
    await browser.close()
}
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

module.exports = pinch()