const puppeteer = require("puppeteer");
const userFactory = require("../factories/userFactory");
const sessionFactory = require("../factories/sessionFactory");
class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page, browser);
    return new Proxy(customPage, {
      get(target, prop) {
        return target[prop] || browser[prop] || page[prop];
      },
    });
  }
  constructor(page, browser) {
    this.page = page;
    this.browser = browser;
  }
  async close() {
    await this.browser.close();
  }
  async login() {
    const user = await userFactory();
    const { session, sign } = sessionFactory(user);
    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sign });
    await this.page.goto("http://localhost:3000/blogs");
    await this.page.waitFor('a[href="/auth/logout"]');
  }
  async getContentOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }
  get(path) {
    return this.page.evaluate(
      (_path) =>
        fetch(_path)
          .then((res) => res.json())
          .catch((err) => err),
      path
    );
  }
  post(path, data) {
    return this.page.evaluate(
      (_path, _data) => {
        return fetch(_path, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(_data),
        }).then((res) => res.json());
      },
      path,
      data
    );
  }
  execRequests(actions) {
    return Promise.all(
      actions.map(({ path, method, data }) => {
        return this[method.toLowerCase()](path, data);
      })
    );
  }
}

module.exports = CustomPage;
