#!/usr/bin/env node

require('dotenv').config()
const puppeteer = require('puppeteer');
const chalk = require('chalk');
const devices = puppeteer.devices;
const iPhone = devices['iPhone 6'];

function lastSunday() {
    let currentDateObj = new Date();
    currentDateObj.setDate(currentDateObj.getDate() - (currentDateObj.getDay()) % 7);
    return currentDateObj;
}

function lastThursday() {
    let currentDateObj = new Date();
    currentDateObj.setDate(currentDateObj.getDate() - (currentDateObj.getDay() + 3) % 7);
    return currentDateObj;
}

const getDatesBetweenDates = (startDate, endDate) => {
    let dates = []
    //to avoid modifying the original date
    const theDate = new Date(startDate)
    while (theDate < endDate) {
      dates = [...dates, new Date(theDate)]
      theDate.setDate(theDate.getDate() + 1)
    }
    dates = [...dates, endDate]
    return dates;
  }

const options = { year: '2-digit', month: '2-digit', day: '2-digit' };
const dates = getDatesBetweenDates(lastSunday(), lastThursday()).map(d => d.toLocaleDateString("he-IL", options).replace(/\./g, '/'));

(async () => {
  const browser = await puppeteer.launch({
    args: [`--window-size=375,667`],
    isMobile: true,
    defaultViewport: {
      width:375,
      height:667
    }
  });
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.goto('https://www.mysodexo.co.il?mob=1');
  await page.waitForSelector('.blue-fg');
  await page.click('.blue-fg');
  await page.waitForTimeout(3000);
  await page.waitForSelector('#txtUsr');
  await page.type('#txtUsr', `${process.env.CIBUS_USER}|${process.env.CIBUS_COMPANY}`);
  await page.click("#txtPas");
  await page.waitForTimeout(3000);
  await page.type('#txtPas', process.env.CIBUS_PASSWORD);
  await page.click("#btnLogin");
  await page.waitForTimeout(3000);
  await page.goto("https://www.mysodexo.co.il/new_my/new_my_orders.aspx");
  await page.waitForTimeout(3000);
  let tblData = await page.evaluate(() => Array.from(document.querySelectorAll('.fixed-table.bar.foot tr:not(:first-of-type)'), e => ret = {
    date: e.querySelector("td:nth-child(2)").textContent,
    price: parseFloat(e.querySelector("td:nth-child(6) span").textContent)
  }));
  tblData = tblData.filter(td => {return dates.includes(td.date.trim())});
  const spent = tblData.reduce((acc,td) => acc + td.price,0);
  if (spent-360 >= 0) {
    console.log(`\n\rYou've spent ${chalk.bgRed(`₪${spent}`)}- no money left for this week\n\r`);
  } else {
    console.log(`\n\rYou've spent ${chalk.bgRed(`₪${spent}`)} this week, you can still spend ${chalk.bgGreen(`₪${360-spent}`)}\n\r`);
  }
  await browser.close();
})();