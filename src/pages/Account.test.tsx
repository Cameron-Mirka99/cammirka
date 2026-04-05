import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Account from "./Account";
import { ThemeModeProvider } from "../themeMode";

const mockUseAuth = jest.fn();
const mockUpdateUserAttributes = jest.fn();

jest.mock("../auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../components/Header", () => ({
  Header: () => <div>Header</div>,
}));

jest.mock("../utils/motion", () => ({
  MotionReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("aws-amplify/auth", () => ({
  updateUserAttributes: (...args: unknown[]) => mockUpdateUserAttributes(...args),
}));

function renderAccount() {
  return render(
    <ThemeModeProvider>
      <Account />
    </ThemeModeProvider>,
  );
}

describe("Account page", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUpdateUserAttributes.mockReset();
  });

  it("renders email as disabled and pre-populates names", () => {
    mockUseAuth.mockReturnValue({
      status: "signedIn",
      refresh: jest.fn(),
      user: {
        email: "user@example.com",
        givenName: "Jane",
        familyName: "Smith",
      },
    });

    renderAccount();

    expect(screen.getByDisplayValue("user@example.com")).toBeDisabled();
    expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Smith")).toBeInTheDocument();
  });

  it("validates blank names before saving", async () => {
    mockUseAuth.mockReturnValue({
      status: "signedIn",
      refresh: jest.fn(),
      user: {
        email: "user@example.com",
        givenName: "Jane",
        familyName: "Smith",
      },
    });

    renderAccount();

    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("First name and last name are required.")).toBeInTheDocument();
    expect(mockUpdateUserAttributes).not.toHaveBeenCalled();
  });

  it("saves updated names and refreshes auth state", async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      status: "signedIn",
      refresh,
      user: {
        email: "user@example.com",
        givenName: "Jane",
        familyName: "Smith",
      },
    });
    mockUpdateUserAttributes.mockResolvedValue({});

    renderAccount();

    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "Janet" } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: "Doe" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateUserAttributes).toHaveBeenCalledWith({
        userAttributes: {
          given_name: "Janet",
          family_name: "Doe",
          name: "Janet Doe",
        },
      });
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("Account details updated.")).toBeInTheDocument();
  });
});
