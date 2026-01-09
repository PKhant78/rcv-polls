import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import Home from "./Home";

jest.mock("axios");

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Home", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the home page with title", () => {
    axios.get.mockResolvedValue({ data: [] });

    renderWithRouter(<Home />);

    expect(screen.getByText("RCV Polls")).toBeInTheDocument();
  });

  it("shows create poll button for authenticated users", () => {
    axios.get.mockResolvedValue({ data: [] });
    const mockUser = { id: 1, username: "testuser" };

    renderWithRouter(<Home user={mockUser} />);

    expect(screen.getByText("Create New Poll")).toBeInTheDocument();
  });

  it("shows login prompt for unauthenticated users", () => {
    axios.get.mockResolvedValue({ data: [] });

    renderWithRouter(<Home />);

    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign up/i)).toBeInTheDocument();
  });

  it("displays list of polls", async () => {
    const mockPolls = [
      {
        id: 1,
        title: "Test Poll 1",
        description: "Description 1",
        isPublished: true,
        isClosed: false,
        creator: { username: "user1" },
        options: [
          { id: 1, text: "Option A" },
          { id: 2, text: "Option B" },
        ],
      },
      {
        id: 2,
        title: "Test Poll 2",
        description: "Description 2",
        isPublished: true,
        isClosed: false,
        creator: { username: "user2" },
        options: [{ id: 3, text: "Option C" }],
      },
    ];

    axios.get.mockResolvedValue({ data: mockPolls });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Test Poll 1")).toBeInTheDocument();
      expect(screen.getByText("Test Poll 2")).toBeInTheDocument();
    });
  });

  it("shows no polls message when empty", async () => {
    axios.get.mockResolvedValue({ data: [] });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/No published polls yet/i)).toBeInTheDocument();
    });
  });
});
