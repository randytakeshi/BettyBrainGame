export const SUITS = ['C', 'D', 'H', 'S', 'NT'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const PLAYERS = ['N', 'E', 'S', 'W'];

export class GameEngine {
  constructor(updateCallback) {
    this.updateCallback = updateCallback;
    this.resetGame();
  }

  resetGame() {
    this.deck = this.createDeck();
    this.hands = { N: [], E: [], S: [], W: [] };
    this.phase = 'dealing'; // 'dealing', 'bidding', 'playing', 'finished'
    this.bids = [];
    this.contract = null;
    this.declarer = null;
    this.dummy = null;
    this.currentTurn = 'S'; // South is dealer for now
    
    // Play state
    this.currentTrick = []; // Array of { player, card }
    this.tricksWon = { 'N/S': 0, 'E/W': 0 };
    this.leader = null;
    this.trumpSuit = null;
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
    this.shuffle(this.deck);
    let currentPlayerIndex = 0;
    
    for (const card of this.deck) {
      this.hands[PLAYERS[currentPlayerIndex]].push(card);
      currentPlayerIndex = (currentPlayerIndex + 1) % 4;
    }
    
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

  notifyUpdate() {
    if (this.updateCallback) {
      this.updateCallback(this.getState());
    }
  }

  getState() {
    return {
      phase: this.phase,
      hands: this.hands,
      bids: this.bids,
      contract: this.contract,
      declarer: this.declarer,
      dummy: this.dummy,
      currentTurn: this.currentTurn,
      currentTrick: this.currentTrick,
      tricksWon: this.tricksWon,
      trumpSuit: this.trumpSuit
    };
  }

  // --- BIDDING LOGIC ---

  placeBid(bid) {
    if (this.phase !== 'bidding') return;

    this.bids.push({ player: this.currentTurn, ...bid });
    
    if (this.checkBiddingFinished()) {
      this.startPlayingPhase();
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
        for (const b of this.bids) {
          if (b.type === 'bid') highest = b;
        }
        if (highest) {
          this.contract = { level: highest.level, suit: highest.suit };
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
          this.resetGame();
          this.deal();
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

    // Play it
    hand.splice(cardIndex, 1);
    this.currentTrick.push({ player, card });
    
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
    }

    this.notifyUpdate();
    if (this.phase !== 'finished') {
      this.checkAITurn();
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
      setTimeout(aiAction, 1000); // 1 second AI thinking time
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
          if (newLevel <= 7) return { type: 'bid', level: newLevel, suit: longestSuit };
        } else if (hcp >= 15 && hcp <= 17) {
          const newLevel = currentLevel + 1;
          if (newLevel <= 7) return { type: 'bid', level: newLevel, suit: 'NT' };
        } else {
           const newLevel = currentLevel + 1;
           if (newLevel <= 7) return { type: 'bid', level: newLevel, suit: longestSuit };
        }
      }
    } else {
      if (hcp >= 6) {
         if (suitCounts[partnerBid.suit] >= 3) {
            const newLevel = highestBid.level + 1;
            if (newLevel <= 7 && highestBid.suit === partnerBid.suit) {
              return { type: 'bid', level: newLevel, suit: partnerBid.suit };
            }
         }
      }
    }
    return { type: 'pass' };
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
