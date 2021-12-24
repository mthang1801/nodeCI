const Page = require("./helpers/page");
jest.setTimeout(30000);
let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("localhost:3000");
});

afterEach(async () => {
  await page.close();
});

test("When logged in, we can ses blogs", async () => {
  await page.login();
  await page.click("a.btn-floating");
  const label = await page.getContentOf("form label");
  expect(label).toEqual("Blog Title");
});

describe("When logged in", async () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("can see blog create form", async () => {
    const label = await page.getContentOf("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("Using invalid inputs", async () => {
    beforeEach(async () => {
      await page.click("form button");
    });

    test("form show error message", async () => {
      const titleError = await page.getContentOf(".title .red-text");
      const contentError = await page.getContentOf(".content .red-text");
      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
  describe("Using valid inputs", async () => {
    beforeEach(async () => {
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      await page.click("form button");
    });
    test("Submitting takes user to review the screen", async () => {
      const text = await page.getContentOf("h5");
      expect(text).toEqual("Please confirm your entries");
    });
    test("Submitting and savind adds blog to index page", async () => {
      await page.click("button.green");
      await page.waitFor(".card");
      const title = await page.getContentOf(".card-title");
      const content = await page.getContentOf("p");

      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });
  });
});

describe("When user did not log in", async () => {
  test("user can't create a blog post", async () => {
    const result = await page.post("/api/blogs", { title: " T", content: "C" });

    expect(result).toEqual({ error: "You must log in!" });
  });

  test("User can't reach to list blogs", async () => {
    const result = await page.get("/api/blogs");
    expect(result).toEqual({ error: "You must log in!" });
  });

  test("Blogs related action are prohibited", async () => {
    const actions = [
      {
        method: "GET",
        path: "/api/blogs",
      },
      {
        method: "POST",
        path: "/api/blogs",
        data: { title: "T", content: "C" },
      },
    ];
    const results = await page.execRequests(actions);
    for (let result of results) {
      expect(result).toEqual({ error: "You must log in!" });
    }
  });
});
