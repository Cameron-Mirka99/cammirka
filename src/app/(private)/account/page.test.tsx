import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountPage from "./page";

const refresh = vi.fn();
vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { email: "fox@example.com", givenName: "Fox", familyName: "Mirka" },
    refresh,
  }),
}));

vi.mock("aws-amplify/auth", () => ({
  updateUserAttributes: vi.fn(),
}));
import { updateUserAttributes } from "aws-amplify/auth";

describe("AccountPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pre-populates and disables the email field", () => {
    render(<AccountPage />);
    const emailInput = screen.getByDisplayValue("fox@example.com");
    expect(emailInput).toBeDisabled();
  });

  it("blocks the save and shows an error when a name is blank", async () => {
    render(<AccountPage />);
    const user = userEvent.setup();
    await user.clear(screen.getByDisplayValue("Fox"));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText("First name and last name are required.")
    ).toBeInTheDocument();
    expect(updateUserAttributes).not.toHaveBeenCalled();
  });

  it("saves and refreshes on valid input", async () => {
    (updateUserAttributes as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    render(<AccountPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(updateUserAttributes).toHaveBeenCalledWith({
      userAttributes: {
        given_name: "Fox",
        family_name: "Mirka",
        name: "Fox Mirka",
      },
    });
    expect(await screen.findByText("Your profile has been updated.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });
});
