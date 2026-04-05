import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeModeProvider } from "../../themeMode";
import { LightboxOverlay } from "./LightboxOverlay";

const mockAuthFetch = jest.fn();

jest.mock("../../utils/photoCache", () => ({
  __esModule: true,
  default: {
    get: () => undefined,
  },
}));

jest.mock("../../utils/apiConfig", () => ({
  photoApiBaseUrl: "https://api.example.com",
}));

jest.mock("../../utils/authFetch", () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

function renderOverlay(showDownload = false, setSelectedIndex = jest.fn()) {
  return render(
    <ThemeModeProvider>
      <LightboxOverlay
        photos={[
          { key: "family/photo-1.jpg", storageKey: "family/full/photo-1.jpg", url: "https://cdn.example.com/photo-1.jpg" },
          { key: "family/photo-2.jpg", storageKey: "family/full/photo-2.jpg", url: "https://cdn.example.com/photo-2.jpg" },
        ]}
        selectedIndex={0}
        setSelectedIndex={setSelectedIndex}
        showDownload={showDownload}
      />
    </ThemeModeProvider>,
  );
}

describe("LightboxOverlay", () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the download button only when enabled", () => {
    renderOverlay(false);
    expect(screen.queryByRole("button", { name: /download full resolution/i })).not.toBeInTheDocument();
  });

  it("requests a signed download URL for private gallery downloads", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://signed.example.com/download" }),
    });

    renderOverlay(true);
    fireEvent.click(screen.getByText(/download full resolution/i).closest("button") as HTMLButtonElement);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith(
        "https://api.example.com/photo-download",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("navigates to the next photo without closing the lightbox", () => {
    const setSelectedIndex = jest.fn();
    renderOverlay(true, setSelectedIndex);

    fireEvent.click(screen.getByLabelText("Next image"));

    expect(setSelectedIndex).toHaveBeenCalledTimes(1);
    expect(setSelectedIndex).toHaveBeenCalledWith(expect.any(Function));
  });
});
