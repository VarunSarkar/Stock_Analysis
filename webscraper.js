const cheerio = require("cheerio");
const request = require("request");
const fs = require("fs");
const path = require("path");
const pdfDocument = require("pdfkit");
const prompt = require("prompt-sync")();
const xlsx = require("xlsx");


async function processCompany(url){
    request(url, cb);
    function cb(error, response, html) {
        if (error){
            console.log(error);
        }
        else if(response.statusCode == 404){
            console.log("Page Not Found");
        }
        else{
            dataExtract(html);
        }
    }   
}

async function dataExtract(html){
    let searchTool = cheerio.load(html);

    let companyName = searchTool(".mktdashbrdhdcompany h2").text();

    let companyNameArr = companyName.split("-");
    companyName = companyNameArr[0].trim();
    
    let timeOfUpdate = searchTool(".mktdashbrdhdcompany span#updtimetime1").text().slice(5).trim();
    let currentPrice = searchTool("#CompanyTop_compbsensestksmry #newcompdata1 .current-price").text().trim();
    
    let parameterArr = searchTool("#CompanyTop_compbsensestksmry #newcompdata1 .dark-gray");
    let valueArr = searchTool("#CompanyTop_compbsensestksmry #newcompdata1 .align-right");

    //Code for today stock price
    let parameterArrTxt = [];
    let valueArrTxt = [];
    let dataObj = {};
    dataObj.date = timeOfUpdate;
    let text1 = "Stocks data AS Of " + timeOfUpdate + "\n\n";
    for(let i = 0; i < 10; i++){
        parameterArrTxt.push(searchTool(parameterArr[i]).text());
        valueArrTxt.push(searchTool(valueArr[i]).text());
        dataObj[parameterArrTxt[i]] = valueArrTxt[i];
        text1 = text1 + parameterArrTxt[i] + " : " + valueArrTxt[i] + "\n";
    }

    // company summary
    let AboutText = searchTool(".abputcmpny").text().trim() + "\n";

    //code for company's market fundamentals
    let companyDetailsArr = searchTool(".reliance-fund.mb30>.heading.addcompanyname");
    let companyDetails = companyName + " " + searchTool(companyDetailsArr[0]).text().trim();
    let companyParArr = searchTool(".reliance-fund>.tablebox .trbox .tdbox");

    let companyDetTxt = "";

    for(let i = 0; i < companyParArr.length; i++){
        let companyPar = searchTool(companyParArr[i]).text().trim();
        if(i % 2 == 0){
            companyDetTxt = companyDetTxt + companyPar + "  :  ";

        }else{
            companyDetTxt = companyDetTxt + companyPar + "\n";
        }
    }

    //code for pdf creation
    let foldpath= path.join(__dirname,"Top_Gainers");
    dirCreator(foldpath);
    let folderpath= path.join(foldpath,companyName);
    dirCreator(folderpath);
    let filePath = path.join(folderpath,"info.pdf");
    let doc = new pdfDocument();
    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(20).text(companyName + "\n\n", {align:'center'}, 80);
    doc.moveTo(50, 100)
   .lineTo(550, 100)
   .stroke();
    doc.fontSize(14).text("AS OF " + timeOfUpdate + " Current Price is " + currentPrice + "\n\n");
    doc.fontSize(15).text("About")
    .moveDown()
    .font('Times-Roman', 12)
    .text(AboutText + "\n\n",{
        align:'left',
        indent: 2
    });
    doc.text(text1);
    doc.addPage();
    doc.fontSize(20).text(companyDetails + "\n\n", {align:'center'}, 80);
    doc.moveTo(50, 100)
   .lineTo(550, 100)
   .stroke();
    doc.font('Times-Roman', 12)
    .text(companyDetTxt);
    doc.end();
    let input = prompt("Do you want this company's today's data in Excel sheet(Y/N) : ");
    if(input == 'Y' || input == 'y'){
        processFileToXlsx(folderpath, companyName, dataObj);
        console.log("done");
    }else{
        console.log("ending the process for " + companyName);
    }
}

function dirCreator(folderpath){
    if(!fs.existsSync(folderpath)){
        fs.mkdirSync(folderpath);
    }
}

function processFileToXlsx(folderpath, companyName, data){
    let filePath = path.join(folderpath,companyName+".xlsx");
    let content = excelReader(filePath,companyName);
    content.push(data);
    excelWriter(filePath,content,companyName); 
  }

  function excelReader(filePath, sheetName) {
    if (fs.existsSync(filePath) == false) {
        return [];
    }
    let wb = xlsx.readFile(filePath);
    let excelData = wb.Sheets[sheetName];
    let ans = xlsx.utils.sheet_to_json(excelData);
    return ans;
  
  }

function excelWriter(filePath, json, sheetName) {
    let newWB = xlsx.utils.book_new();
    let newWS = xlsx.utils.json_to_sheet(json);
    xlsx.utils.book_append_sheet(newWB, newWS, sheetName);
    xlsx.writeFile(newWB, filePath);
  }

module.exports = {
    processCompany : processCompany
}