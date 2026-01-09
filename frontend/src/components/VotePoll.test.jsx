import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import VotePoll from "./VotePoll";

jest.mock("axios");

describe("VotePoll", () => {
  const mockPoll = {
    id: 1,
    title: "Test Poll",
    options: [
      { id: 1, text: "Option 1" },
      { id: 2, text: "Option 2" },
      { id: 3, text: "Option 3" },
    ],
  };

  const mockOnVoteSubmitted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders voting form with poll options", () => {
    render(<VotePoll poll={mockPoll} onVoteSubmitted={mockOnVoteSubmitted} />);

    expect(screen.getByText("Rank Your Choices")).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("allows ranking options", () => {
    render(<VotePoll poll={mockPoll} onVoteSubmitted={mockOnVoteSubmitted} />);

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBe(3);

    // Rank first option
    fireEvent.change(selects[0], { target: { value: "1" } });
    expect(selects[0].value).toBe("1");
  });

  it("prevents duplicate ranks", () => {
    render(<VotePoll poll={mockPoll} onVoteSubmitted={mockOnVoteSubmitted} />);

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[0], { target: { value: "1" } });
    fireEvent.change(selects[1], { target: { value: "1" } });

    // Second select should have cleared the first one's rank
    expect(selects[0].value).toBe("");
    expect(selects[1].value).toBe("1");
  });

  it("validates sequential ranks", async () => {
    axios.post.mockRejectedValue({
      response: { data: { error: "Ranks must be sequential starting from 1" } },
    });

    render(<VotePoll poll={mockPoll} onVoteSubmitted={mockOnVoteSubmitted} />);

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "3" } });

    const submitButton = screen.getByText("Submit Vote");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Ranks must be sequential starting from 1/i)
      ).toBeInTheDocument();
    });
  });

  it("submits vote with valid rankings", async () => {
    axios.post.mockResolvedValue({
      data: { message: "Vote submitted successfully" },
    });

    render(<VotePoll poll={mockPoll} onVoteSubmitted={mockOnVoteSubmitted} />);

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "1" } });
    fireEvent.change(selects[1], { target: { value: "2" } });

    const submitButton = screen.getByText("Submit Vote");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/polls/${mockPoll.id}/vote`),
        {
          rankings: [
            { optionId: 1, rank: 1 },
            { optionId: 2, rank: 2 },
          ],
        },
        { withCredentials: true }
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Vote Submitted Successfully/i)
      ).toBeInTheDocument();
    });
  });

  it("shows error on submission failure", async () => {
    axios.post.mockRejectedValue({
      response: { data: { error: "Failed to submit vote" } },
    });

    render(<VotePoll poll={mockPoll} onVoteSubmitted={mockOnVoteSubmitted} />);

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "1" } });

    const submitButton = screen.getByText("Submit Vote");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit vote/i)).toBeInTheDocument();
    });
  });
});
