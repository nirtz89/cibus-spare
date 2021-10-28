#!/usr/bin/env node

require('dotenv').config()
const puppeteer = require('puppeteer');
const chalk = require('chalk');
const devices = puppeteer.devices;
const iPhone = devices['iPhone 6'];
const dateUtils = require('../dateUtils');
const loadingUtil = require('../commonUtils');
const	readlineSync = require('readline-sync');

const options = { year: '2-digit', month: '2-digit', day: '2-digit' };
const dates = dateUtils.getDatesBetweenDates(dateUtils.lastSunday(), new Date()).map(d => d.toLocaleDateString("he-IL", options).replace(/\./g, '/'));

if (!process.env.CIBUS_COMPANY 
    || !process.env.CIBUS_PASSWORD
    || !process.env.CIBUS_USER
    || !process.env.CIBUS_WEEKLY) {
    console.log(`\n\r${chalk.bgRed("Seems like your .env file is either empty or incomplete.")}\n\r`);
    process.exit();
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--window-size=375,667`],
    isMobile: true,
    defaultViewport: {
      width:375,
      height:667
    }
  });
  loadingUtil.loading();
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
  let tblData = await page.evaluate(() => Array.from(document.querySelectorAll('.fixed-table.bar.foot tr:not(:first-of-type)'), e => ret = {
    date: e.querySelector("td:nth-child(2)").textContent,
    price: parseFloat(e.querySelector("td:nth-child(6) span").textContent)
  }));
  tblData = tblData.filter(td => {return dates.includes(td.date.trim())});
  loadingUtil.stopLoading();
  const spent = tblData.reduce((acc,td) => acc + td.price,0);
  if (spent-process.env.CIBUS_WEEKLY >= 0) {
    console.log(`\n\rYou've spent ${chalk.red(`₪${spent}`)} - no money left for spending this week\n\r`);
  } else {
    console.log(`\n\rYou've spent ${chalk.red(`₪${spent}`)} this week, you can still spend ${chalk.green(`₪${process.env.CIBUS_WEEKLY-spent}`)}\n\r`);
    if (readlineSync.keyInYN(`\n\r${chalk.green("Hey! You have some free money to spend, do you want me to buy 30 nis worth of Shufersal coupons?")}\n\r`)) {
      loadingUtil.loading("Purchasing your coupon");
      await page.goto("https://www.mysodexo.co.il/new_menu.aspx?restId=33193&cmp=2199&fav=0&h=17&m=2&s=223&g=0&weekend=&ta=1&name=%D7%A9%D7%95%D7%A4%D7%A8%D7%A1%D7%9C&dist=2");
      await page.waitForSelector("big");
      await page.click("big:nth-of-type(1)");
      await page.goto("https://www.mysodexo.co.il/new_order2.aspx?restId=33193&ta=1");
      await page.goto("https://www.mysodexo.co.il/new_menu.aspx?restId=33193&cmp=2199&fav=0&h=17&m=2&s=223&g=0&weekend=&ta=1&name=%D7%A9%D7%95%D7%A4%D7%A8%D7%A1%D7%9C&dist=2");
      await page.goto("https://www.mysodexo.co.il/new_order2.aspx?restId=33193&ta=1");
      await page.waitForSelector(".button.send");
      await page.click(".button.send");
      await page.click(".button.send");
      console.log(`${chalk.green("Purchased! Bye!")}`);
    } else {
      console.log('OK, Bye.');
    }
  }
  loadingUtil.stopLoading();
  await browser.close();
})();