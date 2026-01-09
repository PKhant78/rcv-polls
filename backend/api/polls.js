const express = require("express");
const router = express.Router();
const { Poll, PollOption, Ballot, User } = require("../database");
const { authenticateJWT } = require("../auth");
const { Op } = require("sequelize");
const crypto = require("crypto");
const { calculateIRVResults } = require("../utils/irv");

// Helper function to generate unique share link
const generateShareLink = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Create a new poll (authenticated)
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { title, description, options } = req.body;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        error: "Title and at least 2 options are required",
      });
    }

    // Create poll
    const poll = await Poll.create({
      title,
      description: description || null,
      creatorId: req.user.id,
      isPublished: false,
      isClosed: false,
    });

    // Create poll options
    const pollOptions = await Promise.all(
      options.map((optionText, index) =>
        PollOption.create({
          text: optionText,
          pollId: poll.id,
          order: index,
        })
      )
    );

    const pollWithOptions = await Poll.findByPk(poll.id, {
      include: [
        { model: PollOption, as: "options" },
        { model: User, as: "creator", attributes: ["id", "username"] },
      ],
    });

    res.status(201).json(pollWithOptions);
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ error: "Failed to create poll" });
  }
});

// Get all polls (authenticated users see their own polls, unauthenticated see published polls)
router.get("/", async (req, res) => {
  try {
    const token = req.cookies?.token;
    let userId = null;

    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key"
        );
        userId = decoded.id;
      } catch (err) {
        // Invalid token, treat as unauthenticated
      }
    }

    let polls;
    if (userId) {
      // Authenticated: get user's polls and all published polls
      polls = await Poll.findAll({
        where: {
          [Op.or]: [
            { creatorId: userId },
            { isPublished: true },
          ],
        },
        include: [
          { model: PollOption, as: "options" },
          { model: User, as: "creator", attributes: ["id", "username"] },
        ],
        order: [["createdAt", "DESC"]],
      });
    } else {
      // Unauthenticated: only published polls
      polls = await Poll.findAll({
        where: { isPublished: true },
        include: [
          { model: PollOption, as: "options" },
          { model: User, as: "creator", attributes: ["id", "username"] },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    res.json(polls);
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({ error: "Failed to fetch polls" });
  }
});

// Get a specific poll by ID
router.get("/:id", async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id, {
      include: [
        { model: PollOption, as: "options", order: [["order", "ASC"]] },
        { model: User, as: "creator", attributes: ["id", "username"] },
      ],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    res.json(poll);
  } catch (error) {
    console.error("Error fetching poll:", error);
    res.status(500).json({ error: "Failed to fetch poll" });
  }
});

// Get poll by share link (public)
router.get("/share/:shareLink", async (req, res) => {
  try {
    const poll = await Poll.findOne({
      where: { shareLink: req.params.shareLink },
      include: [
        { model: PollOption, as: "options", order: [["order", "ASC"]] },
        { model: User, as: "creator", attributes: ["id", "username"] },
      ],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (!poll.isPublished) {
      return res.status(403).json({ error: "Poll is not published" });
    }

    res.json(poll);
  } catch (error) {
    console.error("Error fetching poll by share link:", error);
    res.status(500).json({ error: "Failed to fetch poll" });
  }
});

// Publish a poll (generate share link) - only creator
router.put("/:id/publish", authenticateJWT, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.creatorId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (poll.isClosed) {
      return res.status(400).json({ error: "Cannot publish a closed poll" });
    }

    // Generate share link if not already published
    if (!poll.shareLink) {
      let shareLink = generateShareLink();
      // Ensure uniqueness
      while (await Poll.findOne({ where: { shareLink } })) {
        shareLink = generateShareLink();
      }
      poll.shareLink = shareLink;
    }

    poll.isPublished = true;
    await poll.save();

    const pollWithOptions = await Poll.findByPk(poll.id, {
      include: [
        { model: PollOption, as: "options" },
        { model: User, as: "creator", attributes: ["id", "username"] },
      ],
    });

    res.json(pollWithOptions);
  } catch (error) {
    console.error("Error publishing poll:", error);
    res.status(500).json({ error: "Failed to publish poll" });
  }
});

// Close a poll - only creator
router.put("/:id/close", authenticateJWT, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.creatorId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    poll.isClosed = true;
    await poll.save();

    const pollWithOptions = await Poll.findByPk(poll.id, {
      include: [
        { model: PollOption, as: "options" },
        { model: User, as: "creator", attributes: ["id", "username"] },
      ],
    });

    res.json(pollWithOptions);
  } catch (error) {
    console.error("Error closing poll:", error);
    res.status(500).json({ error: "Failed to close poll" });
  }
});

// Submit a ballot (vote)
router.post("/:id/vote", async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id, {
      include: [{ model: PollOption, as: "options" }],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (!poll.isPublished) {
      return res.status(403).json({ error: "Poll is not published" });
    }

    if (poll.isClosed) {
      return res.status(400).json({ error: "Poll is closed" });
    }

    const { rankings } = req.body;

    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      return res.status(400).json({
        error: "Rankings array is required",
      });
    }

    // Validate rankings
    const optionIds = poll.options.map((opt) => opt.id);
    const rankedOptionIds = rankings.map((r) => r.optionId);

    // Check that all ranked options belong to this poll
    if (!rankedOptionIds.every((id) => optionIds.includes(id))) {
      return res.status(400).json({
        error: "All ranked options must belong to this poll",
      });
    }

    // Check that each option is ranked only once
    const uniqueOptionIds = new Set(rankedOptionIds);
    if (uniqueOptionIds.size !== rankedOptionIds.length) {
      return res.status(400).json({
        error: "Each option can only be ranked once",
      });
    }

    // Validate ranks are sequential starting from 1
    const sortedRanks = rankings.map((r) => r.rank).sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        return res.status(400).json({
          error: "Ranks must be sequential starting from 1",
        });
      }
    }

    // Get voter identifier (IP address or session)
    const voterIdentifier =
      req.ip || req.headers["x-forwarded-for"] || "anonymous";

    // Create ballot
    const ballot = await Ballot.create({
      pollId: poll.id,
      rankings,
      voterIdentifier,
    });

    res.status(201).json({ message: "Vote submitted successfully", ballot });
  } catch (error) {
    console.error("Error submitting vote:", error);
    res.status(500).json({ error: "Failed to submit vote" });
  }
});

// Get poll results (only if closed) - public
router.get("/:id/results", async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id, {
      include: [
        { model: PollOption, as: "options", order: [["order", "ASC"]] },
        { model: Ballot, as: "ballots" },
      ],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (!poll.isClosed) {
      return res.status(403).json({
        error: "Poll results are only available after the poll is closed",
      });
    }

    // Calculate IRV results
    const results = calculateIRVResults(poll.ballots, poll.options);

    res.json({
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
      },
      results,
    });
  } catch (error) {
    console.error("Error calculating results:", error);
    res.status(500).json({ error: "Failed to calculate results" });
  }
});

module.exports = router;
