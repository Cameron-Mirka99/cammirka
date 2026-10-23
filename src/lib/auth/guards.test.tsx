import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RequireAuth } from "./RequireAuth";
import { RequireAdmin } from "./RequireAdmin";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const useAuthMock = vi.fn();
vi.mock("./AuthProvider", () => ({
  useAuth: () => useAuthMock(),
}));

describe("RequireAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a loading state while status is loading", () => {
    useAuthMock.mockReturnValue({ status: "loading", user: null });
    render(
      <RequireAuth>
        <div>secret</div>
      </RequireAuth>
    );
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to /login when signed out", () => {
    useAuthMock.mockReturnValue({ status: "signedOut", user: null });
    render(
      <RequireAuth>
        <div>secret</div>
      </RequireAuth>
    );
    expect(replace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders children when signed in", () => {
    useAuthMock.mockReturnValue({ status: "signedIn", user: { groups: [] } });
    render(
      <RequireAuth>
        <div>secret</div>
      </RequireAuth>
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("RequireAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects a non-admin, signed-in user to /my-photos", () => {
    useAuthMock.mockReturnValue({
      status: "signedIn",
      user: { groups: ["user"] },
    });
    render(
      <RequireAdmin>
        <div>admin-only</div>
      </RequireAdmin>
    );
    expect(replace).toHaveBeenCalledWith("/my-photos");
    expect(screen.queryByText("admin-only")).not.toBeInTheDocument();
  });

  it("redirects a signed-out user to /login", () => {
    useAuthMock.mockReturnValue({ status: "signedOut", user: null });
    render(
      <RequireAdmin>
        <div>admin-only</div>
      </RequireAdmin>
    );
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("renders children for an admin", () => {
    useAuthMock.mockReturnValue({
      status: "signedIn",
      user: { groups: ["admin"] },
    });
    render(
      <RequireAdmin>
        <div>admin-only</div>
      </RequireAdmin>
    );
    expect(screen.getByText("admin-only")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
