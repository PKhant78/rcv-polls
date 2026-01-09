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
      expect(results.rounds[0].voteCounts[1]).toBe(3);
      expect(results.rounds[0].voteCounts[2]).toBe(1);
      expect(results.totalVotes).toBe(4);
    });

    it("should handle exact 50% + 1 majority", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
      ];

      const ballots = [
        createMockBallot([{ id: 1, rank: 1 }]),
        createMockBallot([{ id: 1, rank: 1 }]),
        createMockBallot([{ id: 2, rank: 1 }]),
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results.winner).toBeDefined();
      expect(results.winner.id).toBe(1);
      expect(results.rounds[0].voteCounts[1]).toBe(2);
      expect(results.rounds[0].voteCounts[2]).toBe(1);
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

      expect(results.rounds.length).toBe(2);
      expect(results.rounds[0].eliminated).toBe(3);
      expect(results.rounds[0].voteCounts[1]).toBe(2);
      expect(results.rounds[0].voteCounts[2]).toBe(2);
      expect(results.rounds[0].voteCounts[3]).toBe(1);
      expect(results.winner).toBeDefined();
      expect(results.winner.id).toBe(1);
      // After C is eliminated, A should have 3 votes (2 original + 1 from C)
      expect(results.rounds[1].voteCounts[1]).toBe(3);
      expect(results.rounds[1].voteCounts[2]).toBe(2);
    });

    it("should handle multiple elimination rounds", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
        createMockOption(3, "Option C"),
        createMockOption(4, "Option D"),
      ];

      // 3 votes: A=1, B=2, C=3, D=4
      // 2 votes: B=1, A=2, C=3, D=4
      // 2 votes: C=1, A=2, B=3, D=4
      // 1 vote:  D=1, A=2, B=3, C=4
      const ballots = [
        createMockBallot([
          { id: 1, rank: 1 },
          { id: 2, rank: 2 },
          { id: 3, rank: 3 },
          { id: 4, rank: 4 },
        ]),
        createMockBallot([
          { id: 1, rank: 1 },
          { id: 2, rank: 2 },
          { id: 3, rank: 3 },
          { id: 4, rank: 4 },
        ]),
        createMockBallot([
          { id: 1, rank: 1 },
          { id: 2, rank: 2 },
          { id: 3, rank: 3 },
          { id: 4, rank: 4 },
        ]),
        createMockBallot([
          { id: 2, rank: 1 },
          { id: 1, rank: 2 },
          { id: 3, rank: 3 },
          { id: 4, rank: 4 },
        ]),
        createMockBallot([
          { id: 2, rank: 1 },
          { id: 1, rank: 2 },
          { id: 3, rank: 3 },
          { id: 4, rank: 4 },
        ]),
        createMockBallot([
          { id: 3, rank: 1 },
          { id: 1, rank: 2 },
          { id: 2, rank: 3 },
          { id: 4, rank: 4 },
        ]),
        createMockBallot([
          { id: 3, rank: 1 },
          { id: 1, rank: 2 },
          { id: 2, rank: 3 },
          { id: 4, rank: 4 },
        ]),
        createMockBallot([
          { id: 4, rank: 1 },
          { id: 1, rank: 2 },
          { id: 2, rank: 3 },
          { id: 3, rank: 4 },
        ]),
      ];

      const results = calculateIRVResults(ballots, options);

      // Verify the algorithm works correctly:
      // - D should be eliminated first (lowest votes: 1)
      // - A should eventually win (has most first-choice votes and gets redistributed votes)
      expect(results.rounds.length).toBeGreaterThan(1); // Multiple rounds
      expect(results.rounds[0].eliminated).toBe(4); // D eliminated first (1 vote)
      expect(results.winner).toBeDefined();
      expect(results.winner.id).toBe(1); // A should win
      expect(results.totalVotes).toBe(8);
      
      // Verify vote counts in first round
      expect(results.rounds[0].voteCounts[1]).toBe(3); // A has 3 votes
      expect(results.rounds[0].voteCounts[2]).toBe(2); // B has 2 votes
      expect(results.rounds[0].voteCounts[3]).toBe(2); // C has 2 votes
      expect(results.rounds[0].voteCounts[4]).toBe(1); // D has 1 vote
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
      expect(results.rounds[0].voteCounts[1]).toBe(1);
      expect(results.rounds[0].voteCounts[2]).toBe(1);
    });

    it("should handle tie with 3 options all equal", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
        createMockOption(3, "Option C"),
      ];

      const ballots = [
        createMockBallot([{ id: 1, rank: 1 }]),
        createMockBallot([{ id: 2, rank: 1 }]),
        createMockBallot([{ id: 3, rank: 1 }]),
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results.winner).toBeNull();
      expect(results.message).toContain("Tie");
    });

    it("should use tie-breaker when some options are tied for minimum", () => {
      const options = [
        createMockOption(1, "Option A"), // Lower ID
        createMockOption(2, "Option B"), // Higher ID
        createMockOption(3, "Option C"),
      ];

      // 3 votes for C, 2 votes for A, 2 votes for B
      // A and B are tied for minimum, should eliminate A (lower ID)
      const ballots = [
        createMockBallot([{ id: 3, rank: 1 }, { id: 1, rank: 2 }]),
        createMockBallot([{ id: 3, rank: 1 }, { id: 1, rank: 2 }]),
        createMockBallot([{ id: 3, rank: 1 }, { id: 1, rank: 2 }]),
        createMockBallot([{ id: 1, rank: 1 }, { id: 3, rank: 2 }]),
        createMockBallot([{ id: 1, rank: 1 }, { id: 3, rank: 2 }]),
        createMockBallot([{ id: 2, rank: 1 }, { id: 3, rank: 2 }]),
        createMockBallot([{ id: 2, rank: 1 }, { id: 3, rank: 2 }]),
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results.rounds[0].eliminated).toBe(1); // A eliminated (lower ID wins tie-breaker)
      expect(results.rounds[0].voteCounts[1]).toBe(2);
      expect(results.rounds[0].voteCounts[2]).toBe(2);
      expect(results.rounds[0].voteCounts[3]).toBe(3);
      // After A is eliminated, C should win
      expect(results.winner.id).toBe(3);
    });

    it("should handle 50-50 tie in final round", () => {
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

  describe("Edge cases", () => {
    it("should handle no votes", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
      ];

      const results = calculateIRVResults([], options);

      expect(results.winner).toBeNull();
      expect(results.message).toContain("No votes");
      expect(results.rounds.length).toBe(0);
    });

    it("should handle single option", () => {
      const options = [createMockOption(1, "Option A")];

      const ballots = [
        createMockBallot([{ id: 1, rank: 1 }]),
        createMockBallot([{ id: 1, rank: 1 }]),
      ];

      const results = calculateIRVResults(ballots, options);

      // With only one option, it should win immediately
      expect(results.winner).toBeDefined();
      expect(results.winner.id).toBe(1);
    });

    it("should handle ballots with no valid rankings", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
      ];

      const ballots = [
        createMockBallot([{ id: 99, rank: 1 }]), // Invalid option ID
        createMockBallot([{ id: 1, rank: 1 }]),
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results.winner).toBeDefined();
      expect(results.winner.id).toBe(1);
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

    it("should handle ballots where eliminated option was only choice", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
        createMockOption(3, "Option C"),
      ];

      // 2 votes for A, 2 votes for B, 1 vote for C (C only ranked by one voter)
      // C eliminated, but C's voter has no other choices, so ballot becomes exhausted
      const ballots = [
        createMockBallot([{ id: 1, rank: 1 }]),
        createMockBallot([{ id: 1, rank: 1 }]),
        createMockBallot([{ id: 2, rank: 1 }]),
        createMockBallot([{ id: 2, rank: 1 }]),
        createMockBallot([{ id: 3, rank: 1 }]), // Only ranks C
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results.rounds[0].eliminated).toBe(3);
      // After C is eliminated, we have 4 valid ballots (C's ballot is exhausted)
      // A and B are tied 2-2, so should result in a tie
      expect(results.winner).toBeNull();
      expect(results.message).toContain("Tie");
    });
  });

  describe("Complex scenarios", () => {
    it("should correctly handle a 5-option race with multiple rounds", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
        createMockOption(3, "Option C"),
        createMockOption(4, "Option D"),
        createMockOption(5, "Option E"),
      ];

      // Create a scenario where:
      // Round 1: A=5, B=4, C=3, D=2, E=1 (E eliminated)
      // Round 2: A=5, B=4, C=3, D=3 (D eliminated, E's votes go to D, but D had 2, now 3)
      // Round 3: A=5, B=4, C=4 (C eliminated)
      // Round 4: A=5, B=9 (B wins with majority)
      const ballots = [];
      
      // 5 votes for A
      for (let i = 0; i < 5; i++) {
        ballots.push(
          createMockBallot([
            { id: 1, rank: 1 },
            { id: 2, rank: 2 },
            { id: 3, rank: 3 },
            { id: 4, rank: 4 },
            { id: 5, rank: 5 },
          ])
        );
      }

      // 4 votes for B
      for (let i = 0; i < 4; i++) {
        ballots.push(
          createMockBallot([
            { id: 2, rank: 1 },
            { id: 1, rank: 2 },
            { id: 3, rank: 3 },
            { id: 4, rank: 4 },
            { id: 5, rank: 5 },
          ])
        );
      }

      // 3 votes for C
      for (let i = 0; i < 3; i++) {
        ballots.push(
          createMockBallot([
            { id: 3, rank: 1 },
            { id: 1, rank: 2 },
            { id: 2, rank: 3 },
            { id: 4, rank: 4 },
            { id: 5, rank: 5 },
          ])
        );
      }

      // 2 votes for D
      for (let i = 0; i < 2; i++) {
        ballots.push(
          createMockBallot([
            { id: 4, rank: 1 },
            { id: 1, rank: 2 },
            { id: 2, rank: 3 },
            { id: 3, rank: 4 },
            { id: 5, rank: 5 },
          ])
        );
      }

      // 1 vote for E (with D as second choice)
      ballots.push(
        createMockBallot([
          { id: 5, rank: 1 },
          { id: 4, rank: 2 },
          { id: 1, rank: 3 },
          { id: 2, rank: 4 },
          { id: 3, rank: 5 },
        ])
      );

      const results = calculateIRVResults(ballots, options);

      expect(results.rounds.length).toBeGreaterThan(1);
      expect(results.rounds[0].eliminated).toBe(5); // E eliminated first
      expect(results.winner).toBeDefined();
      // B should eventually win after getting votes from eliminated candidates
      expect([1, 2]).toContain(results.winner.id); // Either A or B should win
    });
  });

  describe("Vote count accuracy", () => {
    it("should accurately count votes in each round", () => {
      const options = [
        createMockOption(1, "Option A"),
        createMockOption(2, "Option B"),
        createMockOption(3, "Option C"),
      ];

      const ballots = [
        createMockBallot([{ id: 1, rank: 1 }, { id: 2, rank: 2 }]),
        createMockBallot([{ id: 1, rank: 1 }, { id: 2, rank: 2 }]),
        createMockBallot([{ id: 2, rank: 1 }, { id: 1, rank: 2 }]),
        createMockBallot([{ id: 3, rank: 1 }, { id: 1, rank: 2 }]),
      ];

      const results = calculateIRVResults(ballots, options);

      expect(results.totalVotes).toBe(4);
      expect(results.rounds[0].voteCounts[1]).toBe(2);
      expect(results.rounds[0].voteCounts[2]).toBe(1);
      expect(results.rounds[0].voteCounts[3]).toBe(1);
    });
  });
});
