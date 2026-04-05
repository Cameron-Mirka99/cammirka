import React from "react";
import { render, screen } from "@testing-library/react";
import { MainImageDisplay } from "./MainImageDisplay";
import { ThemeModeProvider } from "../themeMode";

const mockLightboxOverlay = jest.fn();

jest.mock("./gallery/ArchiveTile", () => ({
  ArchiveTile: ({ photo }: { photo: { key: string } }) => <div>{photo.key}</div>,
}));

jest.mock("./gallery/LightboxOverlay", () => ({
  LightboxOverlay: (props: unknown) => {
    mockLightboxOverlay(props);
    return <div>Lightbox overlay</div>;
  },
}));

jest.mock("../utils/motion", () => ({
  MotionReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderDisplay(variant: "preview" | "archive" | "private") {
  return render(
    <ThemeModeProvider>
      <MainImageDisplay
        variant={variant}
        photos={[{ key: "folder/photo.jpg", url: "https://example.com/photo.jpg" }]}
      />
    </ThemeModeProvider>,
  );
}

describe("MainImageDisplay", () => {
  beforeEach(() => {
    mockLightboxOverlay.mockReset();
  });

  it("enables downloads only for the private gallery variant", () => {
    renderDisplay("private");

    expect(mockLightboxOverlay.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({ showDownload: true }),
    );
  });

  it("does not enable downloads for public variants", () => {
    renderDisplay("archive");

    expect(mockLightboxOverlay.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({ showDownload: false }),
    );
  });
});
