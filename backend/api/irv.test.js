// Test the Instant Runoff Voting algorithm logic
const { calculateIRVResults } = require("../utils/irv");

// Mock ballots and options for testing
const createMockBallot = (rankings) => ({
  rankings: rankings.map((r) => ({ optionId: r.id, rank: r.rank })),
});

const createMockOption = (id, text) => ({ id, text });

describe("Instant Runoff Voting Algorithm", () => {
  describe("Simple majority winner", () => {
    it("should declare winner with >50% first-choice votes", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
        createMockOption(3, "Option C"),
      ];

      const ballots = [
        createMockBallot([{ id: 1, rank: 1 }, { id: 2, rank: 2 }]),
        createMockBallot([{ id: 1, rank: 1 }, { id: 2, rank: 2 }]),
        createMockBallot([{ id: 1, rank: 1 }, { id: 2, rank: 2 }]),
        createMockBallot([{ id: 2, rank: 1 }, { id: 1, rank: 2 }]),
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results.winner).toBeDefined();
      expect(results.winner.id).toBe(1);
      expect(results.rounds.length).toBe(1);
      expect(results.rounds[0].winner).toBe(1);
    });
  });

  describe("Elimination rounds", () => {
    it("should eliminate option with fewest votes and redistribute", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
        createMockOption(3, "Option C"),
      ];

      // 2 votes for A, 2 votes for B, 1 vote for C
      // C should be eliminated, then A should win with C's second choice
      const ballots = [
        createMockBallot([{ id: 1, rank: 1 }, { id: 2, rank: 2 }]),
        createMockBallot([{ id: 1, rank: 1 }, { id: 2, rank: 2 }]),
        createMockBallot([{ id: 2, rank: 1 }, { id: 1, rank: 2 }]),
        createMockBallot([{ id: 2, rank: 1 }, { id: 1, rank: 2 }]),
        createMockBallot([
          { id: 3, rank: 1 },
          { id: 1, rank: 2 },
          { id: 2, rank: 3 },
        ]),
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results.rounds.length).toBeGreaterThan(1);
      expect(results.rounds[0].eliminated).toBe(3);
      expect(results.winner).toBeDefined();
    });
  });

  describe("Tie scenarios", () => {
    it("should handle tie when all options have equal votes", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
      ];

      const ballots = [
        createMockBallot([{ id: 1, rank: 1 }]),
        createMockBallot([{ id: 2, rank: 1 }]),
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results.winner).toBeNull();
      expect(results.message).toContain("Tie");
    });
  });

  describe("Empty ballots", () => {
    it("should handle no votes", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
      ];

      const results = calculateIRVResults([], options);

      expect(results.winner).toBeNull();
      expect(results.message).toContain("No votes");
    });
  });

  describe("Partial rankings", () => {
    it("should handle ballots that don't rank all options", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
        createMockOption(3, "Option C"),
      ];

      const ballots = [
        createMockBallot([{ id: 1, rank: 1 }]), // Only ranks first choice
        createMockBallot([{ id: 1, rank: 1 }]),
        createMockBallot([{ id: 2, rank: 1 }, { id: 3, rank: 2 }]),
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results).toBeDefined();
      expect(results.rounds.length).toBeGreaterThan(0);
    });
  });
});

// Export the function for testing (we'll need to extract it)
// For now, we'll test it through the API endpoint
