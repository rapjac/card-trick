var Card = Backbone.Model.extend({
  defaults: {
    rank: 0,
    suit: 0
  },
  stringMap: {
    rank: [
      'Ace', 'Two', 'Three', 'Four', 'Five',
      'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Jack', 'Queen', 'King'
    ],
    suit: [
      'Diamonds', 'Clubs', 'Hearts', 'Spades'
    ]
  },
  symbolMap: {
    rank: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    suit: ['♦', '♣', '♥', '♠']
  },
  getSymbol: function () {
    return this.symbolMap['suit'][this.get('suit')] + '' + this.symbolMap['rank'][this.get('rank')];
  },
  toString: function () {
    return this.stringMap['rank'][this.get('rank')] + ' of ' + this.stringMap['suit'][this.get('suit')];
  }
});


var Deck = Backbone.Collection.extend({
  model: Card,
  DEFAULT_DECK_SIZE: 52,
  initialize: function (deck) {
    if(deck) this.models = deck;
    else {
      var cards = [];
      for(var i = 0; i < this.DEFAULT_DECK_SIZE; i++) {
        cards.push(new Card({rank: (i % 13), suit: parseInt(i / 13)}));
      }
      this.models = cards;
    }
  },
  shuffle: function () {
    for(var i = 0; i < this.models.length; i++) {
      var random = parseInt(Math.random() * (this.models.length - 1));
      var temp = this.models[i];
      this.models[i] = this.models[random];
      this.models[random] = temp;
    }
  },
  toString: function () {
    cards = [];
    for(var i = 0; i < this.models.length; i++) {
      cards.push(this.models[i].getSymbol());
    }
    return cards;
  }
});


var Trick = Backbone.Model.extend({
  defaults: {
    state: 0,
    deck: new Deck(),
    trickDeck: new Deck([]),
    pile1: new Deck([]),
    pile2: new Deck([]),
    pile3: new Deck([])
  },
  LAST_STATE: 5,
  initialize: function () {
    var deck = this.get('deck');
    deck.shuffle();
    this.set('trickDeck', new Deck(deck.models.slice(0, 27)));
  },
  nextState: function () {
    var state = this.get('state');
    if(++state > this.LAST_STATE) state = 0;
    this.set('state', state);
  },
  splitDeck: function () {
    var pile1 = [];
    var pile2 = [];
    var pile3 = [];
    var deck = this.get('trickDeck');
    for(var i = 0; i < deck.models.length; i++) {
      switch(i % 3) {
        case 0:
          pile1.push(deck.models[i]);
          break;
        case 1:
          pile2.push(deck.models[i]);
          break;
        case 2:
          pile3.push(deck.models[i]);
      }
    }
    this.set('pile1', new Deck(pile1));
    this.set('pile2', new Deck(pile2));
    this.set('pile3', new Deck(pile3));
  },
  merge: function () {
  },
});



var CardView = Backbone.View.extend({
  template: _.template('#card-template'),
  initialize: function () {
  },
  render: function () {
  },
  getTemplate: function () {
    return this.template(this.model);
  }
});


var TrickView = Backbone.View.extend({
  $el: $('#trick'),
  number: 1,
  chosenPile: 0,
  sortOrder: [0,0,0],
  model: new Trick(),
  DIGITS_TO_SHOW: 3,
  events: {
    'click .next-state': 'nextState'
  },
  stateTemplateMap: [
    'pick-card-template',
    'pick-number-template',
    'split1-template',
    'split2-template',
    'split3-template',
    'reveal-card-template'
  ],
  initialize: function () {
    this.listenTo(this.model, 'change:state', this.render);
    this.render();
  },
  render: function () {
    var state = this.model.get('state');
    this.$el.hide();
    this.renderState(state);
    this.$el.fadeIn();
    switch(state) {
      case 0:
        console.log('Pick a Card!');
        console.log(this.model.get('trickDeck').toString());
        this.renderCards();
        break;
      case 1:
        console.log('Pick a Number between 1 and 27!');
        break;
      case 2:
        this.splitDeck();
        console.log('Watch for your card! Tell me which pile it is in!');
        console.log('Pile 1:');
        console.log(this.model.get('pile1').toString());
        console.log('Pile 2:');
        console.log(this.model.get('pile2').toString());
        console.log('Pile 3:');
        console.log(this.model.get('pile3').toString());
        break;
      case 3:
        this.splitDeck();
        console.log('One more time! Watch for your card!');
        console.log('Pile 1:');
        console.log(this.model.get('pile1').toString());
        console.log('Pile 2:');
        console.log(this.model.get('pile2').toString());
        console.log('Pile 3:');
        console.log(this.model.get('pile3').toString());
        break;
      case 4:
        this.splitDeck();
        console.log('You know the drill! Where is your card?');
        console.log('Pile 1:');
        console.log(this.model.get('pile1').toString());
        console.log('Pile 2:');
        console.log(this.model.get('pile2').toString());
        console.log('Pile 3:');
        console.log(this.model.get('pile3').toString());
        break;
      case 5:
        this.splitDeck();
        console.log('Your card is the ' + this.model.get('trickDeck').models[this.number - 1].toString());
        break;
    }
  },
  renderState: function (state) {
    var template = _.template(this.stateTemplateMap[state]);
    this.$el.html(template());
  },
  renderCards: function () {
    $('#trick').html(_.template($('#pick-card-template').html())({cards: this.model.get('deck').models}));
  },
  nextState: function (event) {
    this.model.nextState();
  },
  splitDeck: function () {
    this.model.splitDeck();
  },
  chooseNumber: function(number) {
    this.number = number;
    this.setSortOrder();
    this.nextState();
  },
  choosePile: function (pile) {
    var placement = this.sortOrder[(this.model.get('state') - 2)];
    this.merge(pile, placement);
    this.nextState();
  },
  merge: function (pile, placement) {
    var piles = [
      this.model.get('pile1').models,
      this.model.get('pile2').models,
      this.model.get('pile3').models,
    ];
    var chosenPile = piles[pile];
    piles[pile] = piles[placement];
    piles[placement] = chosenPile;
    var trickDeck = piles[0].concat(piles[1]).concat(piles[2]);
    this.model.set('trickDeck', new Deck(trickDeck));
  },
  toTernary: function (num) {
    var ternaryNumber = 0;
    var count = 0;
    while(num > 0) {
      ternaryNumber = ternaryNumber + (num % 3) * Math.pow(10, count++);
      num = parseInt(num / 3);
    }
    return ternaryNumber;
  },
  setSortOrder: function () {
    var ternaryNumber = this.toTernary(this.number - 1);
    var sortOrder = [];
    for(var i = 0; i < this.DIGITS_TO_SHOW; i++) {
      sortOrder.push(ternaryNumber % 10);
      ternaryNumber = parseInt(ternaryNumber / 10);
    }
    this.sortOrder = sortOrder;
  }
});
