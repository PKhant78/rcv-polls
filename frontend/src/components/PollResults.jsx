import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../shared";
import "./PollResultsStyles.css";

const PollResults = ({ pollId }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();
  }, [pollId]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/polls/${pollId}/results`);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="poll-results loading">Loading results...</div>;
  }

  if (error) {
    return <div className="poll-results error">{error}</div>;
  }

  if (!results) {
    return <div className="poll-results">No results available</div>;
  }

  const { poll, results: irvResults } = results;

  return (
    <div className="poll-results">
      <h3>Poll Results</h3>
      {irvResults.message ? (
        <div className="message">{irvResults.message}</div>
      ) : (
        <>
          <div className="winner-section">
            {irvResults.winner ? (
              <>
                <h4>Winner</h4>
                <div className="winner">
                  {poll.options.find((opt) => opt.id === irvResults.winner.id)
                    ?.text || irvResults.winner.text}
                </div>
              </>
            ) : (
              <div className="no-winner">No winner determined</div>
            )}
          </div>

          <div className="summary">
            <p>Total Votes: {irvResults.totalVotes}</p>
          </div>

          <div className="rounds">
            <h4>Voting Rounds</h4>
            {irvResults.rounds.map((round, index) => (
              <div key={index} className="round">
                <h5>Round {round.roundNumber}</h5>
                <div className="vote-counts">
                  {poll.options.map((option) => {
                    const votes = round.voteCounts[option.id] || 0;
                    const isEliminated =
                      round.eliminated === option.id ||
                      (index > 0 &&
                        irvResults.rounds
                          .slice(0, index)
                          .some((r) => r.eliminated === option.id));
                    const isWinner = round.winner === option.id;

                    return (
                      <div
                        key={option.id}
                        className={`vote-count-item ${
                          isEliminated ? "eliminated" : ""
                        } ${isWinner ? "winner" : ""}`}
                      >
                        <span className="option-name">{option.text}</span>
                        <span className="vote-count">{votes} votes</span>
                        {isEliminated && (
                          <span className="eliminated-label">(Eliminated)</span>
                        )}
                        {isWinner && (
                          <span className="winner-label">(Winner)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {round.eliminated && (
                  <div className="eliminated-info">
                    Eliminated:{" "}
                    {
                      poll.options.find((opt) => opt.id === round.eliminated)
                        ?.text
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PollResults;
