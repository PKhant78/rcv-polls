import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import CreatePoll from "./CreatePoll";
import "./HomeStyles.css";

const Home = ({ user }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolls();
  }, [user]);

  const fetchPolls = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/polls`, {
        withCredentials: true,
      });
      setPolls(response.data);
    } catch (err) {
      console.error("Error fetching polls:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePollCreated = (newPoll) => {
    setShowCreatePoll(false);
    navigate(`/polls/${newPoll.id}`);
  };

  const handlePollClick = (pollId) => {
    navigate(`/polls/${pollId}`);
  };

  if (showCreatePoll) {
    return (
      <div className="home">
        <CreatePoll
          user={user}
          onPollCreated={handlePollCreated}
          onCancel={() => setShowCreatePoll(false)}
        />
      </div>
    );
  }

  return (
    <div className="home">
      <div className="home-header">
        <h1>RCV Polls</h1>
        <p>Create and vote on polls using Ranked Choice Voting</p>
        {user && (
          <button
            onClick={() => setShowCreatePoll(true)}
            className="create-poll-btn"
          >
            Create New Poll
          </button>
        )}
        {!user && (
          <p className="login-prompt">
            <a href="/login">Login</a> or <a href="/signup">Sign up</a> to
            create polls
          </p>
        )}
      </div>

      <div className="polls-section">
        <h2>{user ? "Your Polls & Published Polls" : "Published Polls"}</h2>
        {loading ? (
          <div className="loading">Loading polls...</div>
        ) : polls.length === 0 ? (
          <div className="no-polls">
            {user
              ? "You haven't created any polls yet. Create one to get started!"
              : "No published polls yet."}
          </div>
        ) : (
          <div className="polls-list">
            {polls.map((poll) => (
              <div
                key={poll.id}
                className="poll-card"
                onClick={() => handlePollClick(poll.id)}
              >
                <h3>{poll.title}</h3>
                {poll.description && <p className="description">{poll.description}</p>}
                <div className="poll-meta">
                  <span>By {poll.creator?.username || "Unknown"}</span>
                  <span
                    className={`status ${
                      poll.isClosed
                        ? "closed"
                        : poll.isPublished
                        ? "published"
                        : "draft"
                    }`}
                  >
                    {poll.isClosed
                      ? "Closed"
                      : poll.isPublished
                      ? "Published"
                      : "Draft"}
                  </span>
                </div>
                <div className="poll-options-preview">
                  {poll.options?.slice(0, 3).map((opt) => (
                    <span key={opt.id} className="option-tag">
                      {opt.text}
                    </span>
                  ))}
                  {poll.options?.length > 3 && (
                    <span className="option-tag">+{poll.options.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
