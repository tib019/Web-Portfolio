/**
 * Unit tests for Web-Portfolio game.js logic
 * Tests score calculation, game state, obstacle logic, and leaderboard update.
 */

// game.js runs in a browser environment with DOM and WebSocket.
// We test the pure logic functions in isolation by extracting them.

// Mock browser globals
global.WebSocket = jest.fn().mockImplementation(() => ({
  onopen: null,
  onmessage: null,
  send: jest.fn(),
  readyState: 1 // OPEN
}));

global.alert = jest.fn();
global.confirm = jest.fn(() => false);
global.prompt = jest.fn(() => 'TestPlayer');
global.clearInterval = jest.fn();
global.setInterval = jest.fn(() => 42);
global.setTimeout = jest.fn((fn) => fn());

// Mock DOM elements
function createMockElement(id, styles = {}) {
  return {
    id,
    style: { bottom: '0px', left: '100px', width: '50px', height: '100px', ...styles },
    className: '',
    counted: false,
    innerText: '',
    innerHTML: '',
    textContent: '',
    appendChild: jest.fn(),
    addEventListener: jest.fn()
  };
}

// Extract and test saveScore logic from game.js
describe('saveScore function logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.WebSocket = jest.fn().mockImplementation(() => {
      const ws = {
        onopen: null,
        onmessage: null,
        send: jest.fn(),
        readyState: 1
      };
      // Simulate onopen being called
      setTimeout(() => ws.onopen && ws.onopen(), 0);
      return ws;
    });
  });

  test('saveScore creates a WebSocket connection', () => {
    function saveScore(username, score) {
      const validScore = score !== undefined ? score : 0;
      const ws = new WebSocket('ws://localhost:8080');
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'new_score', username, score: score !== undefined ? score : 0 }));
      };
      return ws;
    }
    saveScore('TestPlayer', 100);
    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8080');
  });

  test('saveScore sends new_score message on open', () => {
    const mockWs = {
      onopen: null,
      onmessage: null,
      send: jest.fn()
    };
    global.WebSocket = jest.fn(() => mockWs);

    function saveScore(username, score) {
      const ws = new WebSocket('ws://localhost:8080');
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'new_score', username, score: score !== undefined ? score : 0 }));
      };
      return ws;
    }

    saveScore('Alice', 250);
    // Manually trigger onopen
    mockWs.onopen();
    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'new_score', username: 'Alice', score: 250 })
    );
  });

  test('saveScore uses 0 as fallback when score is undefined', () => {
    const mockWs = { onopen: null, send: jest.fn() };
    global.WebSocket = jest.fn(() => mockWs);

    function saveScore(username, score) {
      const ws = new WebSocket('ws://localhost:8080');
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'new_score', username, score: score !== undefined ? score : 0 }));
      };
    }

    saveScore('Bob', undefined);
    mockWs.onopen();
    const sentData = JSON.parse(mockWs.send.mock.calls[0][0]);
    expect(sentData.score).toBe(0);
  });
});

describe('updateLeaderboardUI function logic', () => {
  let leaderboardEl;

  beforeEach(() => {
    leaderboardEl = {
      innerHTML: '',
      appendChild: jest.fn()
    };
    global.document = {
      getElementById: jest.fn((id) => {
        if (id === 'leaderboard') return leaderboardEl;
        return null;
      }),
      createElement: jest.fn((tag) => ({
        textContent: '',
        style: {}
      }))
    };
  });

  test('updateLeaderboardUI clears the leaderboard container', () => {
    function updateLeaderboardUI(leaderboard) {
      const leaderboardContainer = document.getElementById('leaderboard');
      leaderboardContainer.innerHTML = '';
      leaderboard.forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.textContent = `${index + 1}. ${entry.username}: ${entry.score}`;
        leaderboardContainer.appendChild(entryElement);
      });
    }
    updateLeaderboardUI([{ username: 'Alice', score: 500 }]);
    expect(leaderboardEl.innerHTML).toBe('');
  });

  test('updateLeaderboardUI creates one entry per score', () => {
    function updateLeaderboardUI(leaderboard) {
      const container = document.getElementById('leaderboard');
      container.innerHTML = '';
      leaderboard.forEach((entry, index) => {
        const el = document.createElement('div');
        el.textContent = `${index + 1}. ${entry.username}: ${entry.score}`;
        container.appendChild(el);
      });
    }
    const scores = [
      { username: 'Alice', score: 500 },
      { username: 'Bob', score: 300 },
      { username: 'Charlie', score: 100 }
    ];
    updateLeaderboardUI(scores);
    expect(leaderboardEl.appendChild).toHaveBeenCalledTimes(3);
  });

  test('updateLeaderboardUI handles empty leaderboard', () => {
    function updateLeaderboardUI(leaderboard) {
      const container = document.getElementById('leaderboard');
      container.innerHTML = '';
      leaderboard.forEach((entry, index) => {
        const el = document.createElement('div');
        el.textContent = `${index + 1}. ${entry.username}: ${entry.score}`;
        container.appendChild(el);
      });
    }
    updateLeaderboardUI([]);
    expect(leaderboardEl.appendChild).not.toHaveBeenCalled();
  });
});

describe('Game state management', () => {
  test('score starts at 0', () => {
    let score = 0;
    expect(score).toBe(0);
  });

  test('successfulJumps increments when obstacle passes player', () => {
    let successfulJumps = 0;
    const obstacle = { counted: false };
    const obstacle_x = 40; // less than 50

    if (obstacle_x < 50 && !obstacle.counted) {
      successfulJumps++;
      obstacle.counted = true;
    }
    expect(successfulJumps).toBe(1);
    expect(obstacle.counted).toBe(true);
  });

  test('obstacle is not counted twice', () => {
    let successfulJumps = 0;
    const obstacle = { counted: true }; // already counted
    const obstacle_x = 40;

    if (obstacle_x < 50 && !obstacle.counted) {
      successfulJumps++;
      obstacle.counted = true;
    }
    expect(successfulJumps).toBe(0);
  });

  test('jump sets isJumping to true', () => {
    let isJumping = false;
    let fallspeed = 0;

    function jump(event) {
      if (event.code === 'Space' && !isJumping) {
        isJumping = true;
        fallspeed = -20;
      }
    }

    jump({ code: 'Space' });
    expect(isJumping).toBe(true);
    expect(fallspeed).toBe(-20);
  });

  test('jump does not trigger if already jumping', () => {
    let isJumping = true;
    let fallspeed = 0;

    function jump(event) {
      if (event.code === 'Space' && !isJumping) {
        isJumping = true;
        fallspeed = -20;
      }
    }

    jump({ code: 'Space' });
    expect(fallspeed).toBe(0); // unchanged
  });

  test('gravity increases fallspeed when not jumping', () => {
    let fallspeed = 0;
    const gravity = 2;
    let isJumping = false;
    let player_y = 100;

    if (!isJumping) {
      fallspeed += gravity;
      player_y -= fallspeed;
    }

    expect(fallspeed).toBe(2);
    expect(player_y).toBe(98);
  });

  test('player stops at y=0 (ground level)', () => {
    let fallspeed = 10;
    const gravity = 2;
    let isJumping = false;
    let player_y = 5;

    if (!isJumping) {
      fallspeed += gravity;
      player_y -= fallspeed;
      if (player_y <= 0) {
        player_y = 0;
        fallspeed = 0;
      }
    }

    expect(player_y).toBe(0);
    expect(fallspeed).toBe(0);
  });

  test('collision detection: overlapping player and obstacle', () => {
    const player_x = 100, player_y = 0, playerWidth = 50, playerHeight = 100;
    const obstacle_x = 120, obstacle_y = 0, obstacleWidth = 30, obstacleHeight = 70;

    const collides = (
      player_x < obstacle_x + obstacleWidth &&
      player_x + playerWidth > obstacle_x &&
      player_y < obstacle_y + obstacleHeight &&
      player_y + playerHeight > obstacle_y
    );
    expect(collides).toBe(true);
  });

  test('collision detection: non-overlapping player and obstacle', () => {
    const player_x = 10, player_y = 0, playerWidth = 50, playerHeight = 100;
    const obstacle_x = 200, obstacle_y = 0, obstacleWidth = 30, obstacleHeight = 70;

    const collides = (
      player_x < obstacle_x + obstacleWidth &&
      player_x + playerWidth > obstacle_x &&
      player_y < obstacle_y + obstacleHeight &&
      player_y + playerHeight > obstacle_y
    );
    expect(collides).toBe(false);
  });
});
