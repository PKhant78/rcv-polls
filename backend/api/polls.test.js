const request = require("supertest");
const express = require("express");
const { db, User, Poll, PollOption, Ballot } = require("../database");
const pollsRouter = require("./polls");
const { router: authRouter, authenticateJWT } = require("../auth");

// Create test app
const app = express();
app.use(express.json());
app.use("/api/polls", pollsRouter);
app.use("/auth", authRouter);

describe("Polls API", () => {
  let testUser;
  let authToken;
  let testPoll;

  beforeAll(async () => {
    // Sync database
    await db.sync({ force: true });

    // Create test user
    testUser = await User.create({
      username: "testuser",
      passwordHash: User.hashPassword("testpass123"),
    });

    // Get auth token
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ username: "testuser", password: "testpass123" });
    authToken = loginRes.headers["set-cookie"]
      ?.find((c) => c.startsWith("token="))
      ?.split(";")[0]
      ?.split("=")[1];
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Clean up polls before each test
    await Poll.destroy({ where: {} });
    await PollOption.destroy({ where: {} });
    await Ballot.destroy({ where: {} });
  });

  describe("POST /api/polls", () => {
    it("should create a poll with valid data", async () => {
      const pollData = {
        title: "Test Poll",
        description: "Test Description",
        options: ["Option 1", "Option 2", "Option 3"],
      };

      const response = await request(app)
        .post("/api/polls")
        .set("Cookie", `token=${authToken}`)
        .send(pollData)
        .expect(201);

      expect(response.body.title).toBe(pollData.title);
      expect(response.body.description).toBe(pollData.description);
      expect(response.body.options).toHaveLength(3);
      expect(response.body.isPublished).toBe(false);
      expect(response.body.isClosed).toBe(false);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/polls")
        .send({ title: "Test", options: ["A", "B"] })
        .expect(401);
    });

    it("should require at least 2 options", async () => {
      const response = await request(app)
        .post("/api/polls")
        .set("Cookie", `token=${authToken}`)
        .send({ title: "Test", options: ["Only One"] })
        .expect(400);

      expect(response.body.error).toContain("at least 2 options");
    });

    it("should require a title", async () => {
      const response = await request(app)
        .post("/api/polls")
        .set("Cookie", `token=${authToken}`)
        .send({ options: ["A", "B"] })
        .expect(400);
    });
  });

  describe("GET /api/polls", () => {
    it("should return published polls for unauthenticated users", async () => {
      // Create published and unpublished polls
      const publishedPoll = await Poll.create({
        title: "Published Poll",
        creatorId: testUser.id,
        isPublished: true,
      });
      const unpublishedPoll = await Poll.create({
        title: "Unpublished Poll",
        creatorId: testUser.id,
        isPublished: false,
      });

      const response = await request(app)
        .get("/api/polls")
        .expect(200);

      const pollTitles = response.body.map((p) => p.title);
      expect(pollTitles).toContain("Published Poll");
      expect(pollTitles).not.toContain("Unpublished Poll");
    });

    it("should return user's polls and published polls for authenticated users", async () => {
      // Create polls
      const myPublishedPoll = await Poll.create({
        title: "My Published Poll",
        creatorId: testUser.id,
        isPublished: true,
      });
      const myDraftPoll = await Poll.create({
        title: "My Draft Poll",
        creatorId: testUser.id,
        isPublished: false,
      });

      const response = await request(app)
        .get("/api/polls")
        .set("Cookie", `token=${authToken}`)
        .expect(200);

      const pollTitles = response.body.map((p) => p.title);
      expect(pollTitles).toContain("My Published Poll");
      expect(pollTitles).toContain("My Draft Poll");
    });
  });

  describe("GET /api/polls/:id", () => {
    it("should return a poll by ID", async () => {
      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
      });
      await PollOption.create({ text: "Option 1", pollId: poll.id, order: 0 });
      await PollOption.create({ text: "Option 2", pollId: poll.id, order: 1 });

      const response = await request(app)
        .get(`/api/polls/${poll.id}`)
        .expect(200);

      expect(response.body.title).toBe("Test Poll");
      expect(response.body.options).toHaveLength(2);
    });

    it("should return 404 for non-existent poll", async () => {
      await request(app).get("/api/polls/99999").expect(404);
    });
  });

  describe("PUT /api/polls/:id/publish", () => {
    it("should publish a poll and generate share link", async () => {
      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
        isPublished: false,
      });

      const response = await request(app)
        .put(`/api/polls/${poll.id}/publish`)
        .set("Cookie", `token=${authToken}`)
        .expect(200);

      expect(response.body.isPublished).toBe(true);
      expect(response.body.shareLink).toBeTruthy();
    });

    it("should only allow creator to publish", async () => {
      const otherUser = await User.create({
        username: "otheruser",
        passwordHash: User.hashPassword("pass123"),
      });

      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
      });

      const otherUserLogin = await request(app)
        .post("/auth/login")
        .send({ username: "otheruser", password: "pass123" });
      const otherToken = otherUserLogin.headers["set-cookie"]
        ?.find((c) => c.startsWith("token="))
        ?.split(";")[0]
        ?.split("=")[1];

      await request(app)
        .put(`/api/polls/${poll.id}/publish`)
        .set("Cookie", `token=${otherToken}`)
        .expect(403);
    });
  });

  describe("PUT /api/polls/:id/close", () => {
    it("should close a poll", async () => {
      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
        isPublished: true,
        isClosed: false,
      });

      const response = await request(app)
        .put(`/api/polls/${poll.id}/close`)
        .set("Cookie", `token=${authToken}`)
        .expect(200);

      expect(response.body.isClosed).toBe(true);
    });
  });

  describe("POST /api/polls/:id/vote", () => {
    it("should submit a vote", async () => {
      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
        isPublished: true,
      });
      const option1 = await PollOption.create({
        text: "Option 1",
        pollId: poll.id,
        order: 0,
      });
      const option2 = await PollOption.create({
        text: "Option 2",
        pollId: poll.id,
        order: 1,
      });

      const response = await request(app)
        .post(`/api/polls/${poll.id}/vote`)
        .send({
          rankings: [
            { optionId: option1.id, rank: 1 },
            { optionId: option2.id, rank: 2 },
          ],
        })
        .expect(201);

      expect(response.body.message).toContain("successfully");
    });

    it("should not allow voting on unpublished polls", async () => {
      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
        isPublished: false,
      });

      await request(app)
        .post(`/api/polls/${poll.id}/vote`)
        .send({ rankings: [] })
        .expect(403);
    });

    it("should not allow voting on closed polls", async () => {
      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
        isPublished: true,
        isClosed: true,
      });

      await request(app)
        .post(`/api/polls/${poll.id}/vote`)
        .send({ rankings: [] })
        .expect(400);
    });

    it("should validate rankings", async () => {
      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
        isPublished: true,
      });
      const option1 = await PollOption.create({
        text: "Option 1",
        pollId: poll.id,
        order: 0,
      });

      // Test invalid rankings (non-sequential)
      await request(app)
        .post(`/api/polls/${poll.id}/vote`)
        .send({
          rankings: [{ optionId: option1.id, rank: 3 }],
        })
        .expect(400);
    });
  });

  describe("GET /api/polls/:id/results", () => {
    it("should calculate IRV results", async () => {
      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
        isPublished: true,
        isClosed: true,
      });
      const option1 = await PollOption.create({
        text: "Option 1",
        pollId: poll.id,
        order: 0,
      });
      const option2 = await PollOption.create({
        text: "Option 2",
        pollId: poll.id,
        order: 1,
      });
      const option3 = await PollOption.create({
        text: "Option 3",
        pollId: poll.id,
        order: 2,
      });

      // Create ballots
      // 3 votes: Option1=1, Option2=2, Option3=3
      // 2 votes: Option2=1, Option1=2, Option3=3
      // 1 vote: Option3=1, Option1=2, Option2=3
      await Ballot.create({
        pollId: poll.id,
        rankings: [
          { optionId: option1.id, rank: 1 },
          { optionId: option2.id, rank: 2 },
          { optionId: option3.id, rank: 3 },
        ],
      });
      await Ballot.create({
        pollId: poll.id,
        rankings: [
          { optionId: option1.id, rank: 1 },
          { optionId: option2.id, rank: 2 },
          { optionId: option3.id, rank: 3 },
        ],
      });
      await Ballot.create({
        pollId: poll.id,
        rankings: [
          { optionId: option1.id, rank: 1 },
          { optionId: option2.id, rank: 2 },
          { optionId: option3.id, rank: 3 },
        ],
      });
      await Ballot.create({
        pollId: poll.id,
        rankings: [
          { optionId: option2.id, rank: 1 },
          { optionId: option1.id, rank: 2 },
          { optionId: option3.id, rank: 3 },
        ],
      });
      await Ballot.create({
        pollId: poll.id,
        rankings: [
          { optionId: option2.id, rank: 1 },
          { optionId: option1.id, rank: 2 },
          { optionId: option3.id, rank: 3 },
        ],
      });
      await Ballot.create({
        pollId: poll.id,
        rankings: [
          { optionId: option3.id, rank: 1 },
          { optionId: option1.id, rank: 2 },
          { optionId: option2.id, rank: 3 },
        ],
      });

      const response = await request(app)
        .get(`/api/polls/${poll.id}/results`)
        .expect(200);

      expect(response.body.results).toBeDefined();
      expect(response.body.results.totalVotes).toBe(6);
      expect(response.body.results.rounds).toBeDefined();
      expect(Array.isArray(response.body.results.rounds)).toBe(true);
    });

    it("should not return results for open polls", async () => {
      const poll = await Poll.create({
        title: "Test Poll",
        creatorId: testUser.id,
        isPublished: true,
        isClosed: false,
      });

      await request(app)
        .get(`/api/polls/${poll.id}/results`)
        .expect(403);
    });
  });
});
