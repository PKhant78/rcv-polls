import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import VotePoll from "./VotePoll";
import PollResults from "./PollResults";
import "./VotePageStyles.css";

const VotePage = ({ user }) => {
  const { shareLink } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPoll = useCallback(async () => {
    if (!shareLink) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${API_URL}/api/polls/share/${shareLink}`
      );
      setPoll(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load poll");
      setPoll(null);
    } finally {
      setLoading(false);
    }
  }, [shareLink]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const handleVoteSubmitted = () => {
    // Refresh poll data after vote
    fetchPoll();
  };

  if (loading) {
    return <div className="vote-page loading">Loading poll...</div>;
  }

  if (error || !poll) {
    return (
      <div className="vote-page error">
        <h2>{error || "Poll not found"}</h2>
        <p>The poll you're looking for doesn't exist or is no longer available.</p>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="vote-page">
      <div className="poll-header">
        <h1>{poll.title}</h1>
        {poll.description && <p className="description">{poll.description}</p>}
        <div className="poll-meta">
          <span>Created by: {poll.creator?.username || "Unknown"}</span>
        </div>
      </div>

      <div className="poll-options">
        <h3>Options:</h3>
        <ul>
          {poll.options?.map((option) => (
            <li key={option.id}>{option.text}</li>
          ))}
        </ul>
      </div>

      {poll.isClosed ? (
        <PollResults pollId={poll.id} />
      ) : !user ? (
        <div className="vote-page login-required">
          <h2>Login Required to Vote</h2>
          <p>You must be logged in to vote in this poll.</p>
          <div className="auth-buttons">
            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="login-link">
              Login
            </Link>
            <span> or </span>
            <Link to={`/signup?redirect=${encodeURIComponent(window.location.pathname)}`} className="signup-link">
              Sign Up
            </Link>
          </div>
        </div>
      ) : (
        <VotePoll poll={poll} onVoteSubmitted={handleVoteSubmitted} />
      )}
    </div>
  );
};

export default VotePage;
