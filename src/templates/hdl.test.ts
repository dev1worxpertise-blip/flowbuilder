import { buildHdlTemplate, HDL_TEMPLATE_ID } from "./hdl";

test("HDL template has the fixed id and 8 nodes", () => {
  const d = buildHdlTemplate();
  expect(d.id).toBe(HDL_TEMPLATE_ID);
  expect(d.nodes).toHaveLength(8);
});

test("HDL template includes the high-priority green and standard pink routes", () => {
  const d = buildHdlTemplate();
  const titles = d.nodes.map((n) => n.data.title);
  expect(titles).toContain("3A. High-Priority Route");
  expect(titles).toContain("4B. Standard CRM Route");
  const green = d.nodes.find((n) => n.data.title === "3A. High-Priority Route");
  const pink = d.nodes.find((n) => n.data.title === "4B. Standard CRM Route");
  expect(green?.data.accent).toBe("green");
  expect(pink?.data.accent).toBe("pink");
});

test("every edge references existing node ids", () => {
  const d = buildHdlTemplate();
  const ids = new Set(d.nodes.map((n) => n.id));
  for (const e of d.edges) {
    expect(ids.has(e.source)).toBe(true);
    expect(ids.has(e.target)).toBe(true);
  }
});
