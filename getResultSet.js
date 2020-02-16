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

 const puppeteer = require('puppeteer');

 (async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.shu.ac.uk/courses');

  // Wait for the results page to load and display the results.
  const resultsSelector = "a.m-snippet__link";
  await page.waitForSelector(resultsSelector);

  // Identify total number of result pages
  const pageNumSelector = "//div[contains(@class,'m-pagination')]/span[@class='label'][2]"
  const pageNumEl = await page.$x(pageNumSelector)
  let pageNumVal = await page.evaluate((el) => el.innerText, pageNumEl[0])
  pageNumVal = pageNumVal.match(/[0-9]+$/g)[0]

  // Get Next Page element to click
  const nextPageSelector = "(//span[contains(@class,'chevron--right')])[2]"
  const nextPageEl = await page.$x(nextPageSelector)

  console.log(pageNumVal)

  // Extract the results from the page.
  for (let i = 1; i < pageNumVal; i++) {
    const links = await page.evaluate(resultsSelector => {
      const anchors = Array.from(document.querySelectorAll(resultsSelector));
      return anchors.map(anchor => {
        const title = anchor.textContent.split('|')[0].trim();
        return `${title} - ${anchor.href}`;
      });
    }, resultsSelector);
    console.log(links.join('\n'));
    /******TODO
    Get URL and modify with increment of i.
    */
    
    await page.click(nextPageEl);
  }

await browser.close();
})();
