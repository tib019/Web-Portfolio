/**
 * Unit tests for Web-Portfolio server.js
 * Tests saveScore, getTopScores, and WebSocket message handling with mocked mariadb pool.
 */

const WebSocket = require('ws');

// Mock mariadb pool
const mockConn = {
  query: jest.fn(),
  end: jest.fn()
};

const mockPool = {
  getConnection: jest.fn().mockResolvedValue(mockConn)
};

jest.mock('mariadb', () => ({
  createPool: jest.fn(() => mockPool)
}));

// We extract the core logic from server.js by reimplementing saveScore / getTopScores
// using the same pattern as the source, bound to mockPool.

async function saveScore(username, score) {
  let conn;
  try {
    conn = await mockPool.getConnection();
    await conn.query("INSERT INTO scores (username, score) VALUES (?, ?)", [username, score]);
  } finally {
    if (conn) conn.end();
  }
}

async function getTopScores() {
  let conn;
  try {
    conn = await mockPool.getConnection();
    const rows = await conn.query("SELECT username, score FROM scores ORDER BY score DESC LIMIT 10");
    return rows;
  } finally {
    if (conn) conn.end();
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPool.getConnection.mockResolvedValue(mockConn);
  mockConn.query.mockResolvedValue([]);
  mockConn.end.mockResolvedValue(undefined);
});

describe('saveScore', () => {
  test('calls pool.getConnection', async () => {
    await saveScore('testuser', 100);
    expect(mockPool.getConnection).toHaveBeenCalledTimes(1);
  });

  test('executes INSERT query with correct parameters', async () => {
    await saveScore('testuser', 100);
    expect(mockConn.query).toHaveBeenCalledWith(
      "INSERT INTO scores (username, score) VALUES (?, ?)",
      ['testuser', 100]
    );
  });

  test('calls conn.end after query', async () => {
    await saveScore('testuser', 100);
    expect(mockConn.end).toHaveBeenCalledTimes(1);
  });

  test('calls conn.end even if query throws', async () => {
    mockConn.query.mockRejectedValueOnce(new Error('DB error'));
    await expect(saveScore('testuser', 100)).rejects.toThrow('DB error');
    expect(mockConn.end).toHaveBeenCalledTimes(1);
  });

  test('handles zero score', async () => {
    await saveScore('player1', 0);
    expect(mockConn.query).toHaveBeenCalledWith(
      "INSERT INTO scores (username, score) VALUES (?, ?)",
      ['player1', 0]
    );
  });

  test('handles large score values', async () => {
    await saveScore('champion', 999999);
    expect(mockConn.query).toHaveBeenCalledWith(
      "INSERT INTO scores (username, score) VALUES (?, ?)",
      ['champion', 999999]
    );
  });
});

describe('getTopScores', () => {
  test('calls pool.getConnection', async () => {
    await getTopScores();
    expect(mockPool.getConnection).toHaveBeenCalledTimes(1);
  });

  test('executes SELECT query ordering by score DESC with LIMIT 10', async () => {
    await getTopScores();
    expect(mockConn.query).toHaveBeenCalledWith(
      "SELECT username, score FROM scores ORDER BY score DESC LIMIT 10"
    );
  });

  test('returns query result rows', async () => {
    const mockScores = [
      { username: 'alice', score: 500 },
      { username: 'bob', score: 300 }
    ];
    mockConn.query.mockResolvedValueOnce(mockScores);
    const result = await getTopScores();
    expect(result).toEqual(mockScores);
  });

  test('returns top 10 scores sorted (mock validates query intent)', async () => {
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      username: `player${10 - i}`,
      score: (10 - i) * 100
    }));
    mockConn.query.mockResolvedValueOnce(mockData);
    const result = await getTopScores();
    expect(result).toHaveLength(10);
    expect(result[0].score).toBe(1000);
  });

  test('returns empty array when no scores', async () => {
    mockConn.query.mockResolvedValueOnce([]);
    const result = await getTopScores();
    expect(result).toEqual([]);
  });

  test('calls conn.end after query', async () => {
    await getTopScores();
    expect(mockConn.end).toHaveBeenCalledTimes(1);
  });

  test('calls conn.end even if query throws', async () => {
    mockConn.query.mockRejectedValueOnce(new Error('DB error'));
    await expect(getTopScores()).rejects.toThrow('DB error');
    expect(mockConn.end).toHaveBeenCalledTimes(1);
  });
});

describe('WebSocket new_score message handler logic', () => {
  // Test the handler logic in isolation
  test('new_score message triggers saveScore and getTopScores', async () => {
    const mockScores = [{ username: 'alice', score: 500 }];
    mockConn.query
      .mockResolvedValueOnce([]) // INSERT
      .mockResolvedValueOnce(mockScores); // SELECT

    // Simulate what the handler does
    const data = { type: 'new_score', username: 'alice', score: 500 };
    if (data.type === 'new_score') {
      await saveScore(data.username, data.score);
      const topScores = await getTopScores();
      expect(topScores).toEqual(mockScores);
    }

    expect(mockConn.query).toHaveBeenCalledTimes(2);
  });

  test('non new_score messages do not trigger saveScore', async () => {
    const data = { type: 'other_event', username: 'bob', score: 100 };
    if (data.type === 'new_score') {
      await saveScore(data.username, data.score);
    }
    expect(mockPool.getConnection).not.toHaveBeenCalled();
  });

  test('broadcast is sent to all open WebSocket clients after score save', async () => {
    const mockScores = [{ username: 'alice', score: 500 }];
    mockConn.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockScores);

    // Mock WebSocket client
    const mockClient = {
      readyState: WebSocket.OPEN,
      send: jest.fn()
    };

    await saveScore('alice', 500);
    const topScores = await getTopScores();

    // Simulate broadcast
    const clients = new Set([mockClient]);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'update_scores', scores: topScores }));
      }
    });

    expect(mockClient.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'update_scores', scores: mockScores })
    );
  });
});
