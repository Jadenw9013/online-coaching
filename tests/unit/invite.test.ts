import { describe, it, expect } from "vitest";
import { generateInviteCode } from "../../lib/utils/invite";

describe("generateInviteCode", () => {
  it("should generate an 8-character code by default", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
  });

  it("should generate a code of the specified length", () => {
    const length = 12;
    const code = generateInviteCode(length);
    expect(code).toHaveLength(length);
  });

  it("should only contain characters from the allowed set", () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = generateInviteCode(20);
    for (const char of code) {
      expect(chars).toContain(char);
    }
  });

  it("should generate unique codes in a small sample", () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode();
      expect(codes.has(code)).toBe(false);
      codes.add(code);
    }
    expect(codes.size).toBe(100);
  });
});
