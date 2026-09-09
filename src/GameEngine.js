export const SUITS = ['C', 'D', 'H', 'S', 'NT'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const PLAYERS = ['N', 'E', 'S', 'W'];

export class GameEngine {
  constructor(updateCallback, pbnDatabase = null, announceCallback = null) {
    this.updateCallback = updateCallback;
    this.pbnDatabase = pbnDatabase; // Array of parsed PBN games
    this.announceCallback = announceCallback;
    this.boardNumber = 1;
    this.cumulativeScore = { 'N/S': 0, 'E/W': 0 };
    this.resetGame();
  }

  announce(text) {
    if (this.announceCallback) {
      this.announceCallback(text);
    }
  }

  getVulnerability() {
    if (this.pbnDatabase && this.pbnDatabase.length > 0) {
      const idx = (this.boardNumber - 1) % this.pbnDatabase.length;
      if (this.pbnDatabase[idx].vulnerability) return this.pbnDatabase[idx].vulnerability;
    }
    const vulMap = [
      'None', 'N/S', 'E/W', 'Both',
      'N/S', 'E/W', 'Both', 'None',
      'E/W', 'Both', 'None', 'N/S',
      'Both', 'None', 'N/S', 'E/W'
    ];
    return vulMap[(this.boardNumber - 1) % 16];
  }

  getDealer() {
    if (this.pbnDatabase && this.pbnDatabase.length > 0) {
      const idx = (this.boardNumber - 1) % this.pbnDatabase.length;
      if (this.pbnDatabase[idx].dealer) return this.pbnDatabase[idx].dealer;
    }
    return PLAYERS[(this.boardNumber - 1) % 4];
  }

  resetGame() {
    this.deck = this.createDeck();
    this.hands = { N: [], E: [], S: [], W: [] };
    this.phase = 'dealing'; // 'dealing', 'bidding', 'playing', 'finished'
    this.bids = [];
    this.contract = null;
    this.declarer = null;
    this.dummy = null;
    this.currentTurn = this.getDealer();
    
    // Play state
    this.currentTrick = []; // Array of { player, card }
    this.tricksWon = { 'N/S': 0, 'E/W': 0 };
    this.leader = null;
    this.trumpSuit = null;
    
    // Scoring state
    this.doubledStatus = 'none'; // 'none', 'doubled', 'redoubled'
    this.duplicateScore = null; 
    
    // Undo state
    this.historyStack = [];
    this.aiTimer = null;
  }

  saveState() {
    this.historyStack.push({
      phase: this.phase,
      hands: JSON.parse(JSON.stringify(this.hands)),
      bids: JSON.parse(JSON.stringify(this.bids)),
      contract: this.contract ? { ...this.contract } : null,
      declarer: this.declarer,
      dummy: this.dummy,
      currentTurn: this.currentTurn,
      currentTrick: JSON.parse(JSON.stringify(this.currentTrick)),
      tricksWon: { ...this.tricksWon },
      leader: this.leader,
      trumpSuit: this.trumpSuit,
      doubledStatus: this.doubledStatus,
      duplicateScore: this.duplicateScore ? { ...this.duplicateScore } : null
    });
  }

  undo() {
    if (this.aiTimer) {
      clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
    
    // Pop states until it is South's turn, or the stack is empty
    let lastState = null;
    while (this.historyStack.length > 0) {
      lastState = this.historyStack.pop();
      if (lastState.currentTurn === 'S') {
        break;
      }
    }
    
    if (lastState) {
      this.phase = lastState.phase;
      this.hands = lastState.hands;
      this.bids = lastState.bids;
      this.contract = lastState.contract;
      this.declarer = lastState.declarer;
      this.dummy = lastState.dummy;
      this.currentTurn = lastState.currentTurn;
      this.currentTrick = lastState.currentTrick;
      this.tricksWon = lastState.tricksWon;
      this.leader = lastState.leader;
      this.trumpSuit = lastState.trumpSuit;
      this.doubledStatus = lastState.doubledStatus;
      this.duplicateScore = lastState.duplicateScore;
      this.notifyUpdate();
    }
  }

  createDeck() {
    const deck = [];
    for (const suit of ['C', 'D', 'H', 'S']) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
    return deck;
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  deal() {
    if (this.pbnDatabase && this.pbnDatabase.length > 0) {
      // Historical mode!
      const idx = (this.boardNumber - 1) % this.pbnDatabase.length;
      const gameData = this.pbnDatabase[idx];
      
      this.hands = JSON.parse(JSON.stringify(gameData.deal)); // Deep copy the hands
    } else {
      // Random mode
      this.shuffle(this.deck);
      let currentPlayerIndex = 0;
      
      for (const card of this.deck) {
        this.hands[PLAYERS[currentPlayerIndex]].push(card);
        currentPlayerIndex = (currentPlayerIndex + 1) % 4;
      }
    }
    
    // Sort hands (works for both modes)
    for (const p of PLAYERS) {
      this.hands[p].sort((a, b) => {
        if (a.suit !== b.suit) return SUITS.indexOf(b.suit) - SUITS.indexOf(a.suit);
        return RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank);
      });
    }
    
    this.phase = 'bidding';
    this.notifyUpdate();
    this.checkAITurn();
  }

  nextBoard() {
    this.boardNumber++;
    this.resetGame();
    this.deal();
  }

  notifyUpdate() {
    if (this.updateCallback) {
      this.updateCallback(this.getState());
    }
  }

  getState() {
    let historicalData = null;
    if (this.pbnDatabase && this.pbnDatabase.length > 0) {
      const idx = (this.boardNumber - 1) % this.pbnDatabase.length;
      historicalData = this.pbnDatabase[idx];
    }
    
    return {
      boardNumber: this.boardNumber,
      vulnerability: this.getVulnerability(),
      dealer: this.getDealer(),
      phase: this.phase,
      hands: this.hands,
      bids: this.bids,
      contract: this.contract,
      doubledStatus: this.doubledStatus,
      declarer: this.declarer,
      dummy: this.dummy,
      currentTurn: this.currentTurn,
      currentTrick: this.currentTrick,
      tricksWon: this.tricksWon,
      trumpSuit: this.trumpSuit,
      duplicateScore: this.duplicateScore,
      cumulativeScore: this.cumulativeScore,
      historicalData: historicalData,
      canUndo: this.historyStack && this.historyStack.length > 0
    };
  }

  // --- BIDDING LOGIC ---

  placeBid(bid) {
    if (this.phase !== 'bidding') return;
    this.saveState();

    this.bids.push({ player: this.currentTurn, ...bid });
    
    // Announce bid
    let bidText = 'Pass';
    if (bid.type === 'bid') {
      const suitName = bid.suit === 'NT' ? 'No Trump' : (bid.suit === 'S' ? 'Spades' : (bid.suit === 'H' ? 'Hearts' : (bid.suit === 'D' ? 'Diamonds' : 'Clubs')));
      bidText = `${bid.level} ${suitName}`;
    } else if (bid.type === 'double') {
      bidText = 'Double';
    } else if (bid.type === 'redouble') {
      bidText = 'Redouble';
    }
    this.announce(bidText);
    
    if (this.checkBiddingFinished()) {
      this.startPlayingPhase();
    } else if (this.phase === 'finished') {
      // Passed out
      return;
    } else {
      this.advanceTurn();
      this.checkAITurn();
    }
  }

  checkBiddingFinished() {
    if (this.bids.length >= 4) {
      const lastThree = this.bids.slice(-3);
      if (lastThree.every(b => b.type === 'pass')) {
        // Find highest bid
        let highest = null;
        let doubledStatus = 'none';
        
        for (const b of this.bids) {
          if (b.type === 'bid') {
            highest = b;
            doubledStatus = 'none';
          } else if (b.type === 'double') {
            doubledStatus = 'doubled';
          } else if (b.type === 'redouble') {
            doubledStatus = 'redoubled';
          }
        }
        
        if (highest) {
          this.contract = { level: highest.level, suit: highest.suit };
          this.doubledStatus = doubledStatus;
          this.trumpSuit = highest.suit === 'NT' ? null : highest.suit;
          
          // Determine declarer (simplified: just the highest bidder for now)
          this.declarer = highest.player;
          const declarerIdx = PLAYERS.indexOf(this.declarer);
          this.dummy = PLAYERS[(declarerIdx + 2) % 4];
          this.currentTurn = PLAYERS[(declarerIdx + 1) % 4]; // Left of declarer leads
          this.leader = this.currentTurn;
          return true;
        } else {
          // Passed out
          this.phase = 'finished';
          this.duplicateScore = { side: 'None', points: 0, made: null };
          this.notifyUpdate();
          return false;
        }
      }
    }
    return false;
  }

  startPlayingPhase() {
    this.phase = 'playing';
    this.notifyUpdate();
    this.checkAITurn();
  }

  // --- PLAYING LOGIC ---

  playCard(player, cardIndex) {
    if (this.phase !== 'playing') return false;
    if (player !== this.currentTurn) return false;
    
    const hand = this.hands[player];
    const card = hand[cardIndex];
    
    // Validate follow suit
    if (this.currentTrick.length > 0) {
      const ledSuit = this.currentTrick[0].card.suit;
      const hasSuit = hand.some(c => c.suit === ledSuit);
      if (hasSuit && card.suit !== ledSuit) {
        return false; // Must follow suit
      }
    }

    this.saveState();

    // Play it
    hand.splice(cardIndex, 1);
    this.currentTrick.push({ player, card });
    
    // Announce card
    const rankName = card.rank === 'A' ? 'Ace' : (card.rank === 'K' ? 'King' : (card.rank === 'Q' ? 'Queen' : (card.rank === 'J' ? 'Jack' : card.rank)));
    const suitName = card.suit === 'S' ? 'Spades' : (card.suit === 'H' ? 'Hearts' : (card.suit === 'D' ? 'Diamonds' : 'Clubs'));
    this.announce(`${rankName} of ${suitName}`);
    
    if (this.currentTrick.length === 4) {
      // Trick complete
      this.notifyUpdate();
      if (globalThis.TEST_MODE) {
        this.resolveTrick();
      } else {
        setTimeout(() => this.resolveTrick(), 1500); // 1.5s delay to see the trick
      }
    } else {
      this.advanceTurn();
      this.checkAITurn();
    }
    return true;
  }

  resolveTrick() {
    const ledSuit = this.currentTrick[0].card.suit;
    let winningPlay = this.currentTrick[0];

    for (let i = 1; i < 4; i++) {
      const play = this.currentTrick[i];
      if (this.trumpSuit && play.card.suit === this.trumpSuit) {
        if (winningPlay.card.suit !== this.trumpSuit || RANKS.indexOf(play.card.rank) > RANKS.indexOf(winningPlay.card.rank)) {
          winningPlay = play;
        }
      } else if (play.card.suit === ledSuit && winningPlay.card.suit !== this.trumpSuit) {
        if (RANKS.indexOf(play.card.rank) > RANKS.indexOf(winningPlay.card.rank)) {
          winningPlay = play;
        }
      }
    }

    const winner = winningPlay.player;
    if (winner === 'N' || winner === 'S') {
      this.tricksWon['N/S']++;
    } else {
      this.tricksWon['E/W']++;
    }

    this.currentTrick = [];
    this.currentTurn = winner;
    this.leader = winner;

    if (this.hands.S.length === 0 && this.hands.N.length === 0) {
      this.phase = 'finished';
      this.calculateDuplicateScore();
    }

    this.notifyUpdate();
    if (this.phase !== 'finished') {
      this.checkAITurn();
    }
  }

  claimRest() {
    if (this.phase !== 'playing') return;
    
    // N/S gets the remaining tricks
    const remaining = this.hands[this.currentTurn].length;
    this.tricksWon['N/S'] += remaining;
    
    // Empty hands
    for (const p of PLAYERS) {
      this.hands[p] = [];
    }
    
    this.phase = 'finished';
    this.calculateDuplicateScore();
    this.notifyUpdate();
  }

  calculateDuplicateScore() {
    if (!this.contract) return;
    
    const declarerSide = (this.declarer === 'N' || this.declarer === 'S') ? 'N/S' : 'E/W';
    const defendersSide = declarerSide === 'N/S' ? 'E/W' : 'N/S';
    
    const tricksTaken = this.tricksWon[declarerSide];
    const tricksContracted = 6 + this.contract.level;
    const vul = this.getVulnerability();
    const isVul = vul === 'Both' || vul === declarerSide;
    const isDbl = this.doubledStatus === 'doubled';
    const isRedbl = this.doubledStatus === 'redoubled';
    const mult = isRedbl ? 4 : (isDbl ? 2 : 1);
    
    let score = 0;
    
    if (tricksTaken >= tricksContracted) {
      // Made!
      const overtricks = tricksTaken - tricksContracted;
      
      // 1. Contract Points (Base)
      let basePoints = 0;
      if (this.contract.suit === 'C' || this.contract.suit === 'D') {
        basePoints = 20 * this.contract.level;
      } else if (this.contract.suit === 'H' || this.contract.suit === 'S') {
        basePoints = 30 * this.contract.level;
      } else {
        basePoints = 40 + 30 * (this.contract.level - 1);
      }
      
      const contractPoints = basePoints * mult;
      score += contractPoints;
      
      // 2. Game/Part Score Bonus
      if (contractPoints >= 100) {
        score += isVul ? 500 : 300; // Game bonus
      } else {
        score += 50; // Part score bonus
      }
      
      // 3. Slam Bonus
      if (this.contract.level === 6) {
        score += isVul ? 750 : 500;
      } else if (this.contract.level === 7) {
        score += isVul ? 1500 : 1000;
      }
      
      // 4. Insult Bonus
      if (isDbl) score += 50;
      if (isRedbl) score += 100;
      
      // 5. Overtricks
      if (overtricks > 0) {
        if (!isDbl && !isRedbl) {
           score += overtricks * ((this.contract.suit === 'C' || this.contract.suit === 'D') ? 20 : 30);
        } else if (isDbl) {
           score += overtricks * (isVul ? 200 : 100);
        } else if (isRedbl) {
           score += overtricks * (isVul ? 400 : 200);
        }
      }
      
      this.duplicateScore = { side: declarerSide, points: score, made: true, tricks: tricksTaken, contract: this.contract, doubled: this.doubledStatus };
      this.cumulativeScore[declarerSide] += score;
      
    } else {
      // Failed (Undertricks)
      const undertricks = tricksContracted - tricksTaken;
      let penalty = 0;
      
      if (!isDbl && !isRedbl) {
        penalty = undertricks * (isVul ? 100 : 50);
      } else {
        // Doubled
        if (!isVul) {
          if (undertricks === 1) penalty = 100;
          else if (undertricks === 2) penalty = 300; // 100 + 200
          else if (undertricks === 3) penalty = 500; // 100 + 200 + 200
          else penalty = 500 + (undertricks - 3) * 300;
        } else {
          if (undertricks === 1) penalty = 200;
          else penalty = 200 + (undertricks - 1) * 300;
        }
        
        if (isRedbl) penalty *= 2;
      }
      
      this.duplicateScore = { side: defendersSide, points: penalty, made: false, tricks: tricksTaken, contract: this.contract, doubled: this.doubledStatus };
      this.cumulativeScore[defendersSide] += penalty;
    }
  }

  advanceTurn() {
    const idx = PLAYERS.indexOf(this.currentTurn);
    this.currentTurn = PLAYERS[(idx + 1) % 4];
    this.notifyUpdate();
  }

  // --- AI LOGIC ---
  
  checkAITurn() {
    if (this.currentTurn === 'S') return; 

    // For now, AI controls N, E, W unconditionally in Phase 2
    const aiAction = () => {
      if (this.phase === 'bidding') {
        this.makeAIBid();
      } else if (this.phase === 'playing') {
        this.makeAIPlay();
      }
    };
    
    if (globalThis.TEST_MODE) {
      aiAction();
    } else {
      this.aiTimer = setTimeout(aiAction, 1000); // 1 second AI thinking time
    }
  }

  evaluateHand(player) {
    const hand = this.hands[player];
    let hcp = 0;
    const suitCounts = { C: 0, D: 0, H: 0, S: 0 };
    
    for (const card of hand) {
      suitCounts[card.suit]++;
      if (card.rank === 'A') hcp += 4;
      else if (card.rank === 'K') hcp += 3;
      else if (card.rank === 'Q') hcp += 2;
      else if (card.rank === 'J') hcp += 1;
    }
    return { hcp, suitCounts };
  }

  getHint(player) {
    if (this.phase === 'bidding') {
      return { type: 'bid', value: this.determineAIBid(player) };
    } else if (this.phase === 'playing') {
      return { type: 'card', value: this.determineAIPlay(player) };
    }
    return null;
  }

  determineAIBid(player) {
    const { hcp, suitCounts } = this.evaluateHand(player);
    const partner = PLAYERS[(PLAYERS.indexOf(player) + 2) % 4];
    
    let partnerBid = null;
    let highestBid = null;
    for (const b of this.bids) {
      if (b.type === 'bid') highestBid = b;
      if (b.player === partner && b.type === 'bid') partnerBid = b;
    }

    const currentLevel = highestBid ? highestBid.level : 0;
    
    if (!partnerBid) {
      if (hcp >= 13) {
        let longestSuit = 'C';
        for (const s of ['D', 'H', 'S']) {
          if (suitCounts[s] > suitCounts[longestSuit]) longestSuit = s;
        }
        if (suitCounts[longestSuit] >= 5) {
          const newLevel = currentLevel + 1;
          if (newLevel <= 7) return { type: 'bid', level: newLevel, suit: longestSuit, explanation: `${hcp}+ HCP, 5+ ${longestSuit}` };
        } else if (hcp >= 15 && hcp <= 17) {
          const newLevel = currentLevel + 1;
          if (newLevel <= 7) return { type: 'bid', level: newLevel, suit: 'NT', explanation: '15-17 HCP, Balanced hand' };
        } else {
           const newLevel = currentLevel + 1;
           if (newLevel <= 7) return { type: 'bid', level: newLevel, suit: longestSuit, explanation: `${hcp}+ HCP, Longest suit` };
        }
      }
    } else {
      if (hcp >= 6) {
         if (suitCounts[partnerBid.suit] >= 3) {
            const newLevel = highestBid.level + 1;
            if (newLevel <= 7 && highestBid.suit === partnerBid.suit) {
              return { type: 'bid', level: newLevel, suit: partnerBid.suit, explanation: `6+ HCP, 3+ support for ${partnerBid.suit}` };
            }
         }
      }
    }
    return { type: 'pass', explanation: hcp < 6 ? '< 6 HCP, Too weak to bid' : 'No valid bid' };
  }

  makeAIBid() {
    this.placeBid(this.determineAIBid(this.currentTurn));
  }

  determineAIPlay(player) {
    const hand = this.hands[player];
    if (!hand || hand.length === 0) return null;

    let validIndices = [];
    const ledSuit = this.currentTrick.length > 0 ? this.currentTrick[0].card.suit : null;
    
    if (ledSuit) {
      for (let i = 0; i < hand.length; i++) {
        if (hand[i].suit === ledSuit) validIndices.push(i);
      }
    }
    
    if (validIndices.length === 0) {
      for (let i = 0; i < hand.length; i++) validIndices.push(i);
    }
    
    validIndices.sort((a, b) => RANKS.indexOf(hand[a].rank) - RANKS.indexOf(hand[b].rank));
    
    let cardIndexToPlay = validIndices[0]; 

    if (!ledSuit) {
      const { suitCounts } = this.evaluateHand(player);
      let bestIdx = validIndices[0];
      let bestScore = -1;
      for (const idx of validIndices) {
        const c = hand[idx];
        const score = suitCounts[c.suit] * 10 + RANKS.indexOf(c.rank);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      }
      cardIndexToPlay = bestIdx;
    } else if (this.currentTrick.length === 1) {
      cardIndexToPlay = validIndices[0];
    } else if (this.currentTrick.length === 2) {
      cardIndexToPlay = validIndices[validIndices.length - 1];
    } else if (this.currentTrick.length === 3) {
      let winningIsPartner = false;
      let winningPlay = this.currentTrick[0];
      for (let i = 1; i < 3; i++) {
        const play = this.currentTrick[i];
        if (this.trumpSuit && play.card.suit === this.trumpSuit) {
          if (winningPlay.card.suit !== this.trumpSuit || RANKS.indexOf(play.card.rank) > RANKS.indexOf(winningPlay.card.rank)) {
            winningPlay = play;
          }
        } else if (play.card.suit === ledSuit && winningPlay.card.suit !== this.trumpSuit) {
          if (RANKS.indexOf(play.card.rank) > RANKS.indexOf(winningPlay.card.rank)) {
            winningPlay = play;
          }
        }
      }

      winningIsPartner = winningPlay.player === PLAYERS[(PLAYERS.indexOf(player) + 2) % 4];
      
      if (!winningIsPartner) {
         const winningRankValue = winningPlay.card.suit === ledSuit ? RANKS.indexOf(winningPlay.card.rank) : (winningPlay.card.suit === this.trumpSuit ? RANKS.indexOf(winningPlay.card.rank) : -1);
         for (const idx of validIndices) {
           const c = hand[idx];
           if (c.suit === winningPlay.card.suit && RANKS.indexOf(c.rank) > winningRankValue) {
             cardIndexToPlay = idx;
             break;
           } else if (c.suit === this.trumpSuit && winningPlay.card.suit !== this.trumpSuit) {
             cardIndexToPlay = idx;
             break;
           }
         }
      }
    }
    
    return cardIndexToPlay;
  }

  makeAIPlay() {
    const cardIndexToPlay = this.determineAIPlay(this.currentTurn);
    if (cardIndexToPlay !== null) {
      this.playCard(this.currentTurn, cardIndexToPlay);
    }
  }
}
