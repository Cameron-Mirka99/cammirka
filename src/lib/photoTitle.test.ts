import { describe, it, expect } from "vitest";
import { getPhotoTitle } from "./photoTitle";

describe("getPhotoTitle", () => {
  it("prefers an explicit title", () => {
    expect(
      getPhotoTitle({ key: "folder/fox.jpg", url: "", title: "  Red Fox  " })
    ).toBe("Red Fox");
  });

  it("falls back to the decoded filename without extension", () => {
    expect(
      getPhotoTitle({ key: "folder/Red%20Fox.jpg", url: "" })
    ).toBe("Red Fox");
  });

  it("falls back to the raw filename if decoding fails", () => {
    expect(getPhotoTitle({ key: "folder/bad%E0.jpg", url: "" })).toBe("bad%E0");
  });

  it("falls back to Untitled image when nothing usable is present", () => {
    expect(getPhotoTitle({ key: "folder/", url: "" })).toBe("Untitled image");
  });
});
