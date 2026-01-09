import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../shared";
import "./CreatePollStyles.css";

const CreatePoll = ({ user, onPollCreated, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validOptions = options.filter((opt) => opt.trim() !== "");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (validOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/polls`,
        {
          title: title.trim(),
          description: description.trim() || null,
          options: validOptions.map((opt) => opt.trim()),
        },
        { withCredentials: true }
      );

      if (onPollCreated) {
        onPollCreated(response.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to create poll. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-poll">
      <h2>Create New Poll</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Poll Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter poll title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter poll description"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Options * (at least 2)</label>
          {options.map((option, index) => (
            <div key={index} className="option-input">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="remove-option"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="add-option"
          >
            + Add Option
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Poll"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="cancel">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreatePoll;
