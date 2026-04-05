import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { ThemeModeProvider } from "./themeMode";

const mockUseAuth = jest.fn();

jest.mock("./auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

jest.mock("./pages/Home", () => () => <div>Home page</div>);
jest.mock("./pages/Archive", () => () => <div>Archive page</div>);
jest.mock("./pages/About", () => () => <div>About page</div>);
jest.mock("./pages/Login", () => () => <div>Login page</div>);
jest.mock("./pages/MyPhotos", () => () => <div>My Photos page</div>);
jest.mock("./pages/Admin", () => () => <div>Admin page</div>);
jest.mock("./pages/Account", () => () => <div>Account page</div>);

function renderApp(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    </MemoryRouter>,
  );
}

describe("App routing", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("redirects signed-out users from private routes to login", async () => {
    mockUseAuth.mockReturnValue({ status: "signedOut", user: undefined });

    renderApp("/my-photos");

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("allows signed-in users to reach the account page", async () => {
    mockUseAuth.mockReturnValue({
      status: "signedIn",
      user: { username: "user@example.com", groups: ["user"] },
    });

    renderApp("/account");

    expect(await screen.findByText("Account page")).toBeInTheDocument();
  });

  it("redirects non-admin users away from the admin page", async () => {
    mockUseAuth.mockReturnValue({
      status: "signedIn",
      user: { username: "user@example.com", groups: ["user"] },
    });

    renderApp("/admin");

    expect(await screen.findByText("My Photos page")).toBeInTheDocument();
  });

  it("allows admin users to reach the admin page", async () => {
    mockUseAuth.mockReturnValue({
      status: "signedIn",
      user: { username: "admin@example.com", groups: ["admin"] },
    });

    renderApp("/admin");

    expect(await screen.findByText("Admin page")).toBeInTheDocument();
  });
});

