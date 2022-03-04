const { remote } = require("webdriverio");
const fs = require("fs/promises");
const path = require("path");
const LINKSPATH = path.join(__dirname, "../", "links/newZealandLinks.json");
const DATAPATH = path.join(__dirname, "../", "data/newZealandData.json");

let group;

const writeData = async (
  designationNumber,
  title,
  status,
  recognitionDate,
  linkOfStandart
) => {
  if (
    !designationNumber ||
    !title ||
    !status ||
    !recognitionDate ||
    !linkOfStandart
  ) {
    return;
  }

  const data = await readData(DATAPATH);
  let ID = data.length + 1;

  const newItem = {
    "Sr.No.": ID++,
    Country: "New Zealand",
    "Designation Number": designationNumber,
    Title: title,
    "Standart Type": "Country Specific",
    Group: group,
    Organization: "Standards New Zealand, New Zealand",
    Status: status,
    "Recognition Date": recognitionDate,
    "Link of Standart": linkOfStandart,
    "Buy Standards": "https://www.standards.govt.nz/",
  };
  data.push(newItem);
  await fs.writeFile(DATAPATH, JSON.stringify(data, null, 2));
  return newItem;
};

const readData = async (path) => {
  const result = await fs.readFile(path, "utf8");
  return JSON.parse(result);
};

const linksCollector = async () => {
  const data = await readData(LINKSPATH);

  let browser;
  for (const el of data) {
    try {
      browser = await remote({
        capabilities: { browserName: "chrome" },
      });
      group = el.group;

      await browser.navigateTo(el.link);

      const links = [];
      const nextPage = await browser
        .$(".pagination__item-link--next")
        .parentElement();
      const paginationLengthStr = await nextPage
        .previousElement()
        .$("a")
        .getText();
      const paginationLength = Number(paginationLengthStr);
      const paginationBtn = await browser.$(".pagination__next-icon");

      for (let i = 0; i < paginationLength; i++) {
        await browser.setTimeouts(2000, 0, 0);
        const linksArr = await browser.$$("h5 a");
        await browser.setTimeouts(0, 0, 0);

        for (let i = 0; i < linksArr.length; i++) {
          const link = await linksArr[i].getAttribute("href");
          links.push(await link);
        }

        await paginationBtn.click();
      }

      await dataCollector(links);

      await browser.deleteSession();
    } catch (err) {
      console.error(err);
      return browser.deleteSession();
    }
  }
};

const dataCollector = async (links) => {
  for (const el of links) {
    let browser;
    try {
      browser = await remote({
        capabilities: { browserName: "chrome" },
      });

      await browser.navigateTo(`https://www.standards.govt.nz${el}`);

      const designationNumber = await browser
        .$(".product__standard-number")
        .getText();
      const title = await browser.$(".product__title").getText();
      const status = await browser.$(".product__state").getText();
      const recognitionDate = await browser.$("time").getText();
      const linkOfStandart = await browser.getUrl();
      await writeData(
        designationNumber,
        title,
        status,
        recognitionDate,
        linkOfStandart
      );

      await browser.deleteSession();
    } catch (err) {
      console.error(err);
      return browser.deleteSession();
    }
  }
};

module.exports = { linksCollector };
