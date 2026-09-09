export function parsePBN(pbnText) {
  const games = [];
  const lines = pbnText.split('\n');
  
  let currentGame = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check for [Key "Value"]
    const match = line.match(/^\[(.*?) "(.*?)"\]/);
    if (match) {
      const key = match[1];
      const value = match[2];
      
      if (key === 'Event' || key === 'Board') {
        if (!currentGame || (key === 'Board' && currentGame.board)) {
          if (currentGame && currentGame.deal) games.push(currentGame);
          currentGame = {};
        }
        if (!currentGame) currentGame = {};
        if (key === 'Board') currentGame.board = parseInt(value, 10);
      }
      
      if (currentGame) {
        if (key === 'Dealer') currentGame.dealer = value;
        if (key === 'Event') currentGame.event = value;
        if (key === 'Declarer') currentGame.historicalDeclarer = value;
        if (key === 'Contract') currentGame.historicalContract = value;
        if (key === 'Result') currentGame.historicalResult = value;
        if (key === 'Score') currentGame.historicalScore = value;
        if (key === 'Vulnerable') {
           if (value === 'Love' || value === 'None' || value === '-') currentGame.vulnerability = 'None';
           else if (value === 'NS' || value === 'N/S') currentGame.vulnerability = 'N/S';
           else if (value === 'EW' || value === 'E/W') currentGame.vulnerability = 'E/W';
           else if (value === 'All' || value === 'Both') currentGame.vulnerability = 'Both';
        }
        if (key === 'Deal') {
           currentGame.deal = parseDealString(value);
        }
      }
    }
  }
  
  if (currentGame && currentGame.deal) games.push(currentGame);
  return games;
}

function parseDealString(dealString) {
  // Format: "N:AKQJ9.765.2.AQ92 43.T98.K9876.J64 8762.KQJ43.T53.8 T5.A2.AQJ4.KT753"
  const [dealer, handsStr] = dealString.split(':');
  const handsArr = handsStr.split(' ');
  
  const players = ['N', 'E', 'S', 'W'];
  let startIdx = players.indexOf(dealer);
  
  const parsedHands = { N: [], E: [], S: [], W: [] };
  
  handsArr.forEach((handStr, i) => {
    const player = players[(startIdx + i) % 4];
    const suits = handStr.split('.'); // S, H, D, C
    
    // Parse Spades
    for (const char of suits[0] || '') parsedHands[player].push({ suit: 'S', rank: char === 'T' ? '10' : char });
    // Parse Hearts
    for (const char of suits[1] || '') parsedHands[player].push({ suit: 'H', rank: char === 'T' ? '10' : char });
    // Parse Diamonds
    for (const char of suits[2] || '') parsedHands[player].push({ suit: 'D', rank: char === 'T' ? '10' : char });
    // Parse Clubs
    for (const char of suits[3] || '') parsedHands[player].push({ suit: 'C', rank: char === 'T' ? '10' : char });
  });
  
  return parsedHands;
}
