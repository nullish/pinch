/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Search developers.google.com/web for articles tagged
 * "Headless Chrome" and scrape results from the results page.
 */

 'use strict';
 const fs = require('fs')
 const path = require('path')
 const puppeteer = require('puppeteer');

 const getResults = async() => {
  const cf = require("../pinchlist.config.json")
  const browser = await puppeteer.launch();
  let page = await browser.newPage();

  await page.goto(cf.resultsURL);

  // Identify total number of result pages
  const pageNumSelector = cf.pageNumSelector
  const pageNumEl = await page.$x(pageNumSelector)

  // Extract page number attribute either as inner text or DOM attribute
  // If config gile specifies a value use that as atribute. If empty, use 'innerText'
  let pageNumVal
  if (cf.pageNumAttribute) {
    pageNumVal = await page.evaluate((el,a) => el.getAttribute(a), pageNumEl[0], cf.pageNumAttribute);
  } else {
    pageNumVal = await page.evaluate((el) => el.innerText, pageNumEl[0])
  }

  pageNumVal = pageNumVal.match(/[0-9]+$/g)[0]


  // Extract the results from the page.

  let resultsUrl, goUrl, resultsSelector, links, anchors, title
  let outUrls = []
  
  for (let i = 0; i < pageNumVal; i++) {
    resultsUrl = page.url()
    goUrl = resultsUrl.replace(/page=[0-9]+&/g, `page=${i}&`)
    await page.goto(goUrl)
     // Wait for the results page to load and display the results.
     resultsSelector = cf.resultsSelector;
     await page.waitForSelector(resultsSelector);
     links = await page.evaluate(resultsSelector => {
      anchors = Array.from(document.querySelectorAll(resultsSelector));
      return anchors.map(anchor => {
        return `${anchor.href}`;
      });
    }, resultsSelector);
     outUrls = outUrls.concat(links)
     console.log(`${links.join('\n')}`)
   }

   await browser.close();

   // Write results to JSON file
   const jsonTxt = JSON.stringify(outUrls)
   const n = new Date(Date.now())
   const timeStamp = n.getTime()
   const outPath = `./outputs/pinchlist_${timeStamp}.json`
   fs.writeFileSync(outPath, jsonTxt)
   console.log(`\nURL set built and saved to: ${outPath}`)
 };

 module.exports = getResults()