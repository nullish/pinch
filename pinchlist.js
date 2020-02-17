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
  const browser = await puppeteer.launch();
  let page = await browser.newPage();

  await page.goto('https://www.shu.ac.uk/courses');

  // Identify total number of result pages
  const pageNumSelector = "//div[contains(@class,'m-pagination')]/span[@class='label'][2]"
  const pageNumEl = await page.$x(pageNumSelector)
  let pageNumVal = await page.evaluate((el) => el.innerText, pageNumEl[0])
  pageNumVal = pageNumVal.match(/[0-9]+$/g)[0]


  // Extract the results from the page.

  let resultsUrl, goUrl, resultsSelector, links, anchors, title
  let outUrls = []
  
  for (let i = 0; i < 5; i++) {
    resultsUrl = page.url()
    goUrl = resultsUrl.replace(/page=[0-9]+&/g, `page=${i}&`)
    await page.goto(goUrl)
     // Wait for the results page to load and display the results.
     resultsSelector = "a.m-snippet__link";
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
   const outPath = "./inputs/pinchlist.json"
   fs.writeFileSync(outPath, jsonTxt)
 };

 module.exports = getResults()