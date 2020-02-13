/**
* @name pinch
*
* @desc Node script for parallel scraping pages using options passed from a JSON configuration file.
*/

const puppeteer = require('puppeteer')
fs = require('fs');
var parser = require('xml2json');
