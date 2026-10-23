import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoGrid } from "./PhotoGrid";
import type { Photo } from "@/lib/api/types";

vi.mock("@/lib/hooks/useBlobCache", () => ({
  preloadBlob: vi.fn().mockResolvedValue("blob:mock"),
  getCachedBlob: vi.fn().mockReturnValue(undefined),
}));

const photo: Photo = { key: "folder/fox.jpg", url: "https://example.com/fox.jpg" };

describe("PhotoGrid -> Lightbox showDownload wiring", () => {
  it("renders a Download button when showDownload is true", async () => {
    render(<PhotoGrid photos={[photo]} showDownload />);
    await userEvent.click(screen.getByRole("button", { name: /fox/i }));
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });

  it("does not render a Download button when showDownload is false", async () => {
    render(<PhotoGrid photos={[photo]} showDownload={false} />);
    await userEvent.click(screen.getByRole("button", { name: /fox/i }));
    expect(screen.queryByRole("button", { name: /download/i })).not.toBeInTheDocument();
  });
});
