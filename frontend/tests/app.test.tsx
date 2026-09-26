import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "@/App";

describe("App architectural smoke test", () => {
  it("renders without crashing and shows brand heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /UNBLUFF/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Your resume says you're ready\. Let's prove it\./i)
    ).toBeInTheDocument();
  });

  it("contains navigation links for all primary product stages", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Setup" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ledger" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Report" })).toBeInTheDocument();
  });
});
