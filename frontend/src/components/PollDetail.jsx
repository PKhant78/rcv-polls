import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import VotePoll from "./VotePoll";
import PollResults from "./PollResults";
import "./PollDetailStyles.css";

const PollDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [id]);

  const fetchPoll = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/polls/${id}`);
      setPoll(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load poll");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const response = await axios.put(
        `${API_URL}/api/polls/${id}/publish`,
        {},
        { withCredentials: true }
      );
      setPoll(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to publish poll");
    }
  };

  const handleClose = async () => {
    try {
      const response = await axios.put(
        `${API_URL}/api/polls/${id}/close`,
        {},
        { withCredentials: true }
      );
      setPoll(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to close poll");
    }
  };

  const copyShareLink = async () => {
    if (poll?.shareLink) {
      const shareUrl = `${window.location.origin}/vote/${poll.shareLink}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 2000);
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setShareLinkCopied(true);
          setTimeout(() => setShareLinkCopied(false), 2000);
        } catch (e) {
          console.error("Failed to copy link:", e);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  if (loading) {
    return <div className="poll-detail loading">Loading poll...</div>;
  }

  if (error || !poll) {
    return (
      <div className="poll-detail error">
        {error || "Poll not found"}
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  const isCreator = user && user.id === poll.creatorId;
  const shareUrl = poll.shareLink
    ? `${window.location.origin}/vote/${poll.shareLink}`
    : null;

  return (
    <div className="poll-detail">
      <div className="poll-header">
        <h1>{poll.title}</h1>
        {poll.description && <p className="description">{poll.description}</p>}
        <div className="poll-meta">
          <span>Created by: {poll.creator?.username || "Unknown"}</span>
          <span className={`status ${poll.isPublished ? "published" : "draft"}`}>
            {poll.isClosed
              ? "Closed"
              : poll.isPublished
              ? "Published"
              : "Draft"}
          </span>
        </div>
      </div>

      {isCreator && (
        <div className="creator-actions">
          {!poll.isPublished && (
            <button onClick={handlePublish} className="publish-btn">
              Publish Poll
            </button>
          )}
          {poll.isPublished && !poll.isClosed && (
            <button onClick={handleClose} className="close-btn">
              Close Poll
            </button>
          )}
          {poll.shareLink && (
            <div className="share-link">
              <label>Share Link:</label>
              <div className="share-link-input">
                <input 
                  type="text" 
                  value={shareUrl} 
                  readOnly 
                  onClick={(e) => e.target.select()}
                  onFocus={(e) => e.target.select()}
                />
                <button onClick={copyShareLink}>
                  {shareLinkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="share-link-hint">Click the link above to select it, or use the Copy button</p>
            </div>
          )}
        </div>
      )}

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
      ) : poll.isPublished ? (
        <VotePoll poll={poll} onVoteSubmitted={fetchPoll} />
      ) : (
        <div className="not-published">
          This poll is not yet published. Only the creator can view it.
        </div>
      )}
    </div>
  );
};

export default PollDetail;
