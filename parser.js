const { remote } = require("webdriverio");
const fs = require("fs/promises");
const path = require("path");
const LINKSPATH = path.join(__dirname, "links.json");
const DATAPATH = path.join(__dirname, "data.json");

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
    !linkOfStandart ||
    !recognitionDate
  ) {
    return;
  }

  const data = await readData(DATAPATH);
  let ID = data.length + 1;

  const newItem = {
    "Sr.No.": ID++,
    designationNumber,
    title,
    status,
    recognitionDate,
    linkOfStandart,
  };
  data.push(newItem);
  await fs.writeFile(DATAPATH, JSON.stringify(data, null, 2));
  // console.log("New data added successfully");
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
      const links = [];

      await browser.navigateTo(el.link);

      const linksArr = await browser.$$("h6 a");

      for (let i = 0; i < 2; i++) {
        const link = linksArr[i].getAttribute("href");
        links.push(await link);
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

      await browser.navigateTo(`https://www.iso.org${el}`);

      const designationNumber = await browser.$("div h1").getText();
      const title = await browser.$("div h2").getText();
      const status = await browser.$(".col-sm-6").$("span").getText();
      const recognitionDate = await browser
        .$('[itemprop="releaseDate"]')
        .getText();
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
