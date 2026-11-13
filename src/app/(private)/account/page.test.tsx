import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

vi.mock("@/lib/api/photos", () => ({
  fetchPublicPhotos: vi.fn().mockResolvedValue({ photos: [] }),
}));

function renderAccountPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountPage />
    </QueryClientProvider>
  );
}

describe("AccountPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pre-populates and disables the email field", () => {
    renderAccountPage();
    const emailInput = screen.getByDisplayValue("fox@example.com");
    expect(emailInput).toBeDisabled();
  });

  it("blocks the save and shows an error when a name is blank", async () => {
    renderAccountPage();
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
    renderAccountPage();
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
