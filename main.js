const puppeteer = require("puppeteer");
const scraperObj = require("./webscraper");

const loginLink = "https://www.financialexpress.com/market/stock-market";
const baseLink = "https://www.financialexpress.com";

(async function StockMarket(){
    try{
        let browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized", "--disable-notifications"]
        });
        let page = await browser.newPage();
        await page.goto(loginLink);
        await page.waitForSelector("div#gainers-1");
        await page.focus("div#gainers-1");
        await page.$eval('div#gainers-1', e => {
            e.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
          });
          await page.waitForTimeout(1000);

          for(let i = 0; i < 5; i++){
            await page.focus("div#gainers-1");
            let linksArr = await page.$$("div#gainers-1 .table-row a");
            await page.waitForTimeout(3000);
            let link = await page.evaluate(el => el.getAttribute("href"), linksArr[i]);
            let fullLink = baseLink + link;
            await scraperObj.processCompany(fullLink);
            await page.waitForTimeout(5000);
            linksArr[i].click({delay:1000});
            await page.waitForSelector(".chartbox");
            await page.focus(".chartbox");
            await page.$eval('.chartbox', e => {
              e.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
            });
            await page.waitForTimeout(3000);
            await page.click(`.chartbox ul.comchrtindiperiod a[onclick="companychart('1W')"]`, { delay: 1000 });
            await page.waitForTimeout(3000);
            await page.click(`.chartbox ul.comchrtindiperiod a[onclick="companychart('1M')"]`, { delay: 1000 });
            await page.waitForTimeout(3000);
            await page.click(`.chartbox ul.comchrtindiperiod a[onclick="companychart('3M')"]`, { delay: 1000 });
            await page.waitForTimeout(4000);
            await page.goBack();
            await page.waitForSelector("div#gainers-1");
            await page.focus("div#gainers-1");
            await page.$eval('div#gainers-1', e => {
                e.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
            });
          }
         await browser.close(); 
    }
    catch(err){
        console.log("err",err);
    }
})()