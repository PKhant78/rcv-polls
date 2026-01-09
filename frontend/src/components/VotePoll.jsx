import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../shared";
import "./VotePollStyles.css";

const VotePoll = ({ poll, onVoteSubmitted }) => {
  const [rankings, setRankings] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRankChange = (optionId, rank) => {
    const newRankings = { ...rankings };

    // Remove the rank from any option that had it
    Object.keys(newRankings).forEach((id) => {
      if (newRankings[id] === rank && parseInt(id) !== optionId) {
        delete newRankings[id];
      }
    });

    if (rank === "") {
      delete newRankings[optionId];
    } else {
      newRankings[optionId] = parseInt(rank);
    }

    setRankings(newRankings);
  };

  const getRankForOption = (optionId) => {
    return rankings[optionId] || "";
  };

  const getAvailableRanks = () => {
    const usedRanks = new Set(Object.values(rankings));
    const maxRank = poll.options.length;
    const available = [];
    for (let i = 1; i <= maxRank; i++) {
      if (!usedRanks.has(i)) {
        available.push(i);
      }
    }
    return available;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const rankedOptions = Object.keys(rankings).map((optionId) => ({
      optionId: parseInt(optionId),
      rank: rankings[optionId],
    }));

    if (rankedOptions.length === 0) {
      setError("Please rank at least one option");
      return;
    }

    // Validate that ranks are sequential starting from 1
    const sortedRanks = rankedOptions
      .map((r) => r.rank)
      .sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        setError("Ranks must be sequential starting from 1");
        return;
      }
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/polls/${poll.id}/vote`,
        { rankings: rankedOptions },
        { withCredentials: true }
      );

      setSuccess(true);
      setRankings({});
      if (onVoteSubmitted) {
        setTimeout(() => {
          onVoteSubmitted();
        }, 2000);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError(
          "You must be logged in to vote. Please refresh the page and log in."
        );
      } else if (err.response?.status === 400 && err.response?.data?.error?.includes("already voted")) {
        setError(err.response.data.error);
      } else {
        setError(
          err.response?.data?.error || "Failed to submit vote. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="vote-poll success">
        <h3>✓ Vote Submitted Successfully!</h3>
        <p>Thank you for voting. Your ballot has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="vote-poll">
      <h3>Rank Your Choices</h3>
      <p className="instructions">
        Rank the options in order of preference (1 = first choice, 2 = second
        choice, etc.). You don't need to rank all options.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="options-list">
          {poll.options?.map((option) => {
            const currentRank = getRankForOption(option.id);
            const availableRanks = getAvailableRanks();

            return (
              <div key={option.id} className="option-item">
                <div className="option-text">{option.text}</div>
                <select
                  value={currentRank}
                  onChange={(e) =>
                    handleRankChange(option.id, e.target.value)
                  }
                  className="rank-select"
                >
                  <option value="">Not ranked</option>
                  {poll.options.map((_, index) => {
                    const rank = index + 1;
                    const isUsed = Object.values(rankings).includes(rank);
                    const isCurrent = currentRank === rank;
                    return (
                      <option
                        key={rank}
                        value={rank}
                        disabled={isUsed && !isCurrent}
                      >
                        {rank}
                        {isUsed && !isCurrent ? " (used)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} className="submit-vote">
          {loading ? "Submitting..." : "Submit Vote"}
        </button>
      </form>
    </div>
  );
};

export default VotePoll;
