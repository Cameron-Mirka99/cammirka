import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MyPhotos from "./MyPhotos";
import { ThemeModeProvider } from "../themeMode";

const mockUseAuth = jest.fn();
const mockAuthFetch = jest.fn();

jest.mock("../auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../components/Header", () => ({
  Header: () => <div>Header</div>,
}));

jest.mock("../components/MainImageDisplay", () => ({
  MainImageDisplay: ({ variant }: { variant: string }) => <div>Main image display {variant}</div>,
}));

jest.mock("../utils/authFetch", () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

jest.mock("../utils/apiConfig", () => ({
  photoApiBaseUrl: "https://api.example.com",
}));

jest.mock("../utils/motion", () => ({
  MotionReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motionHoverLift: {},
}));

function okJson(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(payload),
  });
}

function renderMyPhotos() {
  return render(
    <MemoryRouter>
      <ThemeModeProvider>
        <MyPhotos />
      </ThemeModeProvider>
    </MemoryRouter>,
  );
}

describe("MyPhotos page", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockAuthFetch.mockReset();
  });

  it("shows the user's named private gallery heading", async () => {
    mockUseAuth.mockReturnValue({
      status: "signedIn",
      user: {
        username: "user@example.com",
        groups: ["user"],
        givenName: "Jane",
        familyName: "Smith",
      },
    });
    mockAuthFetch
      .mockImplementationOnce(() => okJson({ folders: [{ folderId: "family", displayName: "Family" }] }))
      .mockImplementationOnce(() => okJson({ photos: [] }));

    renderMyPhotos();

    expect(await screen.findByText("Jane Smith's Private Gallery")).toBeInTheDocument();
  });

  it("falls back to the generic private gallery heading when names are unavailable", async () => {
    mockUseAuth.mockReturnValue({
      status: "signedIn",
      user: {
        username: "user@example.com",
        groups: ["user"],
      },
    });
    mockAuthFetch
      .mockImplementationOnce(() => okJson({ folders: [{ folderId: "family", displayName: "Family" }] }))
      .mockImplementationOnce(() => okJson({ photos: [] }));

    renderMyPhotos();

    expect(await screen.findByText("Private Gallery")).toBeInTheDocument();
  });
});
