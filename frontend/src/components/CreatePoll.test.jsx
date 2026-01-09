import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import CreatePoll from "./CreatePoll";

jest.mock("axios");

describe("CreatePoll", () => {
  const mockUser = { id: 1, username: "testuser" };
  const mockOnPollCreated = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders create poll form", () => {
    render(
      <CreatePoll user={mockUser} onPollCreated={mockOnPollCreated} />
    );

    expect(screen.getByText("Create New Poll")).toBeInTheDocument();
    expect(screen.getByLabelText(/Poll Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Option 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Option 2")).toBeInTheDocument();
  });

  it("allows adding and removing options", () => {
    render(<CreatePoll user={mockUser} onPollCreated={mockOnPollCreated} />);

    const addButton = screen.getByText("+ Add Option");
    fireEvent.click(addButton);

    expect(screen.getByPlaceholderText("Option 3")).toBeInTheDocument();

    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    expect(screen.queryByPlaceholderText("Option 3")).not.toBeInTheDocument();
  });

  it("prevents removing options when only 2 remain", () => {
    render(<CreatePoll user={mockUser} onPollCreated={mockOnPollCreated} />);

    const removeButtons = screen.getAllByText("Remove");
    expect(removeButtons.length).toBe(0); // Should not show remove buttons when only 2 options
  });

  it("validates required fields", async () => {
    render(<CreatePoll user={mockUser} onPollCreated={mockOnPollCreated} />);

    const submitButton = screen.getByText("Create Poll");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });
  });

  it("validates minimum options", async () => {
    render(<CreatePoll user={mockUser} onPollCreated={mockOnPollCreated} />);

    const titleInput = screen.getByLabelText(/Poll Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Poll" } });

    const optionInputs = screen.getAllByPlaceholderText(/Option/i);
    fireEvent.change(optionInputs[0], { target: { value: "" } });
    fireEvent.change(optionInputs[1], { target: { value: "" } });

    const submitButton = screen.getByText("Create Poll");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/at least 2 options are required/i)
      ).toBeInTheDocument();
    });
  });

  it("submits poll with valid data", async () => {
    const mockPoll = {
      id: 1,
      title: "Test Poll",
      description: "Test Description",
      options: [
        { id: 1, text: "Option 1" },
        { id: 2, text: "Option 2" },
      ],
    };

    axios.post.mockResolvedValue({ data: mockPoll });

    render(<CreatePoll user={mockUser} onPollCreated={mockOnPollCreated} />);

    const titleInput = screen.getByLabelText(/Poll Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Poll" } });

    const descriptionInput = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionInput, {
      target: { value: "Test Description" },
    });

    const optionInputs = screen.getAllByPlaceholderText(/Option/i);
    fireEvent.change(optionInputs[0], { target: { value: "Option 1" } });
    fireEvent.change(optionInputs[1], { target: { value: "Option 2" } });

    const submitButton = screen.getByText("Create Poll");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/polls"),
        {
          title: "Test Poll",
          description: "Test Description",
          options: ["Option 1", "Option 2"],
        },
        { withCredentials: true }
      );
      expect(mockOnPollCreated).toHaveBeenCalledWith(mockPoll);
    });
  });

  it("handles cancel action", () => {
    render(
      <CreatePoll
        user={mockUser}
        onPollCreated={mockOnPollCreated}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
