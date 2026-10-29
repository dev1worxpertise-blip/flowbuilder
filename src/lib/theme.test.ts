import { accentStyle } from "./theme";
import { ACCENTS } from "../types";

test("every accent returns three non-empty color strings", () => {
  for (const a of ACCENTS) {
    const s = accentStyle(a);
    expect(s.border).toMatch(/#|rgb/);
    expect(s.glow).toMatch(/#|rgb/);
    expect(s.title).toMatch(/#|rgb/);
  }
});

test("green accent border is the emerald tone", () => {
  expect(accentStyle("green").border).toBe("#34d399");
});
