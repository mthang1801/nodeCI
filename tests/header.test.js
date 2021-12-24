const puppeteer = require("puppeteer");
const sessionFactory = require("./factories/sessionFactory");
const userFactory = require("./factories/userFactory");
const Page = require("./helpers/page");
let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});

test("The header has the correct text", async () => {
  const text = await page.getContentOf("a.brand-logo");
  expect(text).toEqual("Blogster");
});

test("The authentication login with google", async () => {
  await page.click(".right a");
  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

test("When logged in, show logout button", async () => {
  await page.login();
  const btnLogoutText = await page.getContentOf('a[href="/auth/logout"]');
  expect(btnLogoutText).toEqual("Logout");
});
