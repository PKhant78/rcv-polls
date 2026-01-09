// Instant Runoff Voting algorithm implementation

const calculateIRVResults = (ballots, options) => {
  if (ballots.length === 0) {
    return {
      winner: null,
      rounds: [],
      message: "No votes cast yet",
    };
  }

  const rounds = [];
  let activeOptions = [...options];
  let currentBallots = ballots.map((b) => [...b.rankings]);

  // Continue until we have a winner or no more options
  while (activeOptions.length > 1) {
    const round = {
      roundNumber: rounds.length + 1,
      voteCounts: {},
      eliminated: null,
      winner: null,
    };

    // Count first-choice votes for each active option
    activeOptions.forEach((option) => {
      round.voteCounts[option.id] = 0;
    });

    currentBallots.forEach((ballot) => {
      // Find the highest-ranked option that's still active
      const sortedRankings = ballot
        .filter((r) => activeOptions.some((opt) => opt.id === r.optionId))
        .sort((a, b) => a.rank - b.rank);

      if (sortedRankings.length > 0) {
        const firstChoice = sortedRankings[0];
        round.voteCounts[firstChoice.optionId] =
          (round.voteCounts[firstChoice.optionId] || 0) + 1;
      }
    });

    // Check for majority winner (more than 50%)
    const totalVotes = currentBallots.length;
    const majority = Math.floor(totalVotes / 2) + 1;

    for (const optionId in round.voteCounts) {
      if (round.voteCounts[optionId] >= majority) {
        round.winner = parseInt(optionId);
        rounds.push(round);
        return {
          winner: activeOptions.find((opt) => opt.id === round.winner),
          rounds,
          totalVotes,
        };
      }
    }

    // No majority winner, eliminate the option with the fewest votes
    let minVotes = Infinity;
    
    activeOptions.forEach((option) => {
      const votes = round.voteCounts[option.id] || 0;
      if (votes < minVotes) {
        minVotes = votes;
      }
    });

    // Find all options tied for the minimum votes
    const tiedOptions = activeOptions.filter(
      (opt) => (round.voteCounts[opt.id] || 0) === minVotes
    );

    if (tiedOptions.length === activeOptions.length) {
      // All options tied - this is a true tie, no winner
      rounds.push(round);
      return {
        winner: null,
        rounds,
        totalVotes,
        message: "Tie - all remaining options have equal votes",
      };
    }

    // If multiple options are tied for minimum, use tie-breaker (option ID order)
    // Sort by ID to ensure deterministic elimination
    tiedOptions.sort((a, b) => a.id - b.id);
    const eliminatedOptionId = tiedOptions[0].id;

    round.eliminated = eliminatedOptionId;
    activeOptions = activeOptions.filter(
      (opt) => opt.id !== eliminatedOptionId
    );

    // Remove eliminated option from ballots
    currentBallots = currentBallots.map((ballot) =>
      ballot.filter((r) => r.optionId !== eliminatedOptionId)
    );

    rounds.push(round);
  }

  // Final round - one option remaining
  if (activeOptions.length === 1) {
    const finalRound = {
      roundNumber: rounds.length + 1,
      voteCounts: {},
      winner: activeOptions[0].id,
    };

    currentBallots.forEach((ballot) => {
      const sortedRankings = ballot
        .filter((r) => r.optionId === activeOptions[0].id)
        .sort((a, b) => a.rank - b.rank);

      if (sortedRankings.length > 0) {
        finalRound.voteCounts[activeOptions[0].id] =
          (finalRound.voteCounts[activeOptions[0].id] || 0) + 1;
      }
    });

    rounds.push(finalRound);
    return {
      winner: activeOptions[0],
      rounds,
      totalVotes: currentBallots.length,
    };
  }

  return {
    winner: null,
    rounds,
    totalVotes: ballots.length,
    message: "No winner determined",
  };
};

module.exports = { calculateIRVResults };
