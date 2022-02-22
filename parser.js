const { remote } = require("webdriverio");
const fs = require("fs/promises");
const path = require("path");
const { v4 } = require("uuid");
const LINKSPATH = path.join(__dirname, "links.json");
const DATAPATH = path.join(__dirname, "data.json");
let id = 0;
const writeData = async (designationNumber, title, status) => {
  if (!designationNumber || !title || !status) {
    return;
  }

  const data = await readData(DATAPATH);
  console.log(data);

  const newItem = { "Sr.No.": v4(), designationNumber, title, status };
  data.push(newItem);
  await fs.writeFile(DATAPATH, JSON.stringify(data, null, 2));
  // console.log("New data added successfully");
  return newItem;
};

const readData = async (path) => {
  const result = await fs.readFile(path, "utf8");
  return JSON.parse(result);
};

const links = [];

const linksCollector = async () => {
  const data = await readData(LINKSPATH);

  data.forEach((el) => {
    let browser;
    (async () => {
      browser = await remote({
        capabilities: { browserName: "chrome" },
      });

      await browser.navigateTo(el.link);

      const data = await browser.$$("h6 a");

      for (let i = 0; i < 3; i++) {
        const link = data[i].getAttribute("href");
        links.push(await link);
      }

      dataCollector(links);

      await browser.deleteSession();
    })().catch((err) => {
      console.error(err);
      return browser.deleteSession();
    });
  });
};

const dataCollector = () => {
  links.forEach((el) => {
    let browser;
    (async () => {
      browser = await remote({
        capabilities: { browserName: "chrome" },
      });

      await browser.navigateTo(`https://www.iso.org${el}`);

      const designationNumber = await browser.$("div h1").getText();
      const title = await browser.$("div h2").getText();
      const status = await browser.$(".col-sm-6").$("span").getText();

      writeData(designationNumber, title, status);

      await browser.deleteSession();
    })().catch((err) => {
      console.error(err);
      return browser.deleteSession();
    });
  });
};

// linksCollector();

module.exports = { linksCollector };
