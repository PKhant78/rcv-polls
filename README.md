# Ranked Choice Voting App, Part 2

This project-based assignment is intended to stretch your ability to build a project from scratch (or, mostly from scratch) using AI coding tools such as ClaudeCode and Cursor.

During the Summer term, you built a ranked-choice voting app in teams over the course of two weeks. This week, you'll build a version of this same app, but instead of relying on teammembers, you'll be building it solo, with the aid of agentic AI tools, such as Claude Code and Cursor.

## Getting Started

The starting point for this project is divided into /frontend and /backend folders, each of which is a separate NPM app.

To install NPM packages, do something like the following:

1. `cd backend && npm install`
2. `cd ../frontend && npm install`

## Requirements

By the end, your project should be able to do the following things:

- Users should be able to create polls with different options
- Once they publish these polls, they should be able to generate links to share with others.
- If someone else (a "voter") clicks on this link, they can rank the poll options in order (e.g. first choice, second choice, etc) and submit their "ballot."
- Once the creator of the poll closes the poll, all the ballots are tallied up using the [instant runoff voting algorithm](https://en.wikipedia.org/wiki/Instant-runoff_voting).
- You DO NOT need to deploy this app. Running it locally is fine.
- The app must be thoroughly tested (see )

There is A LOT of ambiguity in the above-listed requirements. It is your job to narrow down the specifications of the project through experimentation.

## Implementation Details

### Features Implemented

✅ **Poll Creation**: Users can create polls with a title, description, and multiple options (minimum 2)
✅ **Poll Publishing**: Poll creators can publish polls, which generates a unique shareable link
✅ **Ranked Voting**: Voters can rank poll options in order of preference (1st choice, 2nd choice, etc.)
✅ **Ballot Submission**: Voters submit their ranked choices as ballots
✅ **Instant Runoff Voting**: When a poll is closed, ballots are tallied using the IRV algorithm
✅ **Results Display**: Detailed results showing each voting round, eliminations, and the final winner

### Database Models

- **Poll**: Stores poll information (title, description, shareLink, isPublished, isClosed, creatorId)
- **PollOption**: Stores poll options with ordering
- **Ballot**: Stores voter rankings as JSONB array

### API Endpoints

#### Polls
- `POST /api/polls` - Create a new poll (authenticated)
- `GET /api/polls` - Get all polls
- `GET /api/polls/:id` - Get a specific poll
- `GET /api/polls/share/:shareLink` - Get poll by share link (public)
- `PUT /api/polls/:id/publish` - Publish a poll (creator only)
- `PUT /api/polls/:id/close` - Close a poll (creator only)
- `POST /api/polls/:id/vote` - Submit a ballot (public, poll must be published and open)
- `GET /api/polls/:id/results` - Get poll results (public, poll must be closed)

### Frontend Components

- **Home**: Displays list of polls and allows creating new polls
- **CreatePoll**: Form for creating new polls
- **PollDetail**: View poll details, publish/close controls for creators
- **VotePoll**: Interface for ranking and submitting votes
- **PollResults**: Displays IRV results with voting rounds
- **VotePage**: Public voting page accessible via share link

### Testing

Comprehensive tests have been written for:
- Backend API endpoints (polls.test.js)
- IRV algorithm logic (irv.test.js)
- Frontend components (CreatePoll.test.jsx, VotePoll.test.jsx, Home.test.jsx)

### Running Tests

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm test
```

### Instant Runoff Voting Algorithm

The IRV algorithm implementation:
1. Counts first-choice votes for each option
2. If an option has >50% of votes, declares it the winner
3. Otherwise, eliminates the option with the fewest votes
4. Redistributes votes from eliminated option to next choice
5. Repeats until a winner is found or all options are eliminated

Results include detailed round-by-round breakdown showing vote counts and eliminations.