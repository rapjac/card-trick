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
  getClass: function () {
    var classString = this.stringMap['rank'][this.get('rank')] + ' ' + this.stringMap['suit'][this.get('suit')];
    return classString.toLowerCase();
  },
  getSymbol: function () {
    return this.symbolMap['suit'][this.get('suit')] + this.symbolMap['rank'][this.get('rank')];
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
    number: 1,
    sortOrder: [0,0,0],
    deck: new Deck(),
    trickDeck: new Deck([]),
    pile1: new Deck([]),
    pile2: new Deck([]),
    pile3: new Deck([])
  },
  DIGITS_TO_SHOW: 3,
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
  incrementNumber: function () {
    var number = this.get('number') + 1;
    if(number < 1) number = 1;
    else if(number > 27) number = 27;
    this.set('number', number);
  },
  decrementNumber: function () {
    var number = this.get('number') - 1;
    if(number < 1) number = 1;
    else if(number > 27) number = 27;
    this.set('number', number);
  },
  doStateLogic: function () {
    switch(this.get('state')) {
      case 0:
        break;
      case 1:
        break;
      case 2:
        this.splitDeck();
        break;
      case 3:
        this.splitDeck();
        break;
      case 4:
        this.splitDeck();
        break;
      case 5:
        this.splitDeck();
        break;
    }
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
  merge: function (pile, placement) {
    var piles = [
      this.get('pile1').models,
      this.get('pile2').models,
      this.get('pile3').models,
    ];
    var chosenPile = piles[pile];
    piles[pile] = piles[placement];
    piles[placement] = chosenPile;
    var trickDeck = piles[0].concat(piles[1]).concat(piles[2]);
    this.set('trickDeck', new Deck(trickDeck));
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
    var ternaryNumber = this.toTernary(this.get('number') - 1);
    var sortOrder = [];
    for(var i = 0; i < this.DIGITS_TO_SHOW; i++) {
      sortOrder.push(ternaryNumber % 10);
      ternaryNumber = parseInt(ternaryNumber / 10);
    }
    this.set('sortOrder', sortOrder);
  }
});


var TrickView = Backbone.View.extend({
  el: '#trick',
  numberElement: '#number-container',
  model: new Trick(),
  events: {
    'click .next-state': 'nextState',
    'click .increment': 'incrementNumber',
    'click .decrement': 'decrementNumber',
    'click .chooseNumber': 'chooseNumber',
    'click .pile' : 'choosePile',
    'keyup': 'enterNumber',
  },
  USING_CLI: false,
  initialize: function () {
    this.listenTo(this.model, 'change:state', this.render);
    this.listenTo(this.model, 'change:number', this.renderNumber);
    this.render();
  },
  render: function () {
    this.model.doStateLogic();
    var state = this.model.get('state');
    this.$el.hide();
    if(this.USING_CLI) this.renderStateCli(state);
    else this.renderState(state);
  },
  renderState: function (state) {
    var template = '';
    switch(state) {
      case 0:
        template = _.template($('#pick-card-template').html())({cards: this.model.get('trickDeck').models});
        this.$el.html(template);
        this.$el.fadeIn();
        break;
      case 1:
        template = _.template($('#pick-number-template').html())({number: this.model.get('number')});
        this.$el.html(template);
        this.$el.fadeIn();
        break;
      case 2:
        template = _.template($('#split-template').html())({
          pile1: this.model.get('pile1').models,
          pile2: this.model.get('pile2').models,
          pile3: this.model.get('pile3').models,
        });
        this.$el.html(template);
        this.$el.fadeIn();
        break;
      case 3:
        template = _.template($('#split-template').html())({
          pile1: this.model.get('pile1').models,
          pile2: this.model.get('pile2').models,
          pile3: this.model.get('pile3').models,
        });
        this.$el.html(template);
        this.$el.fadeIn();
        break;
      case 4:
        template = _.template($('#split-template').html())({
          pile1: this.model.get('pile1').models,
          pile2: this.model.get('pile2').models,
          pile3: this.model.get('pile3').models,
        });
        this.$el.html(template);
        this.$el.fadeIn();
        break;
      case 5:
        var number = this.model.get('number')
        var cards = this.model.get('trickDeck').models.slice(0, this.model.get('number'));
        template = _.template($('#reveal-card-template').html())({
          cards: cards,
          number: number
        });
        this.$el.html(template);
        $('.trick-title').hide();
        $('.card').hide();
        this.$el.fadeIn();
        $('.card').each(function (i) {
          $(this).delay(++i * 500).fadeIn(1000);
        });
        $('.card').promise().done( function () {
          $('.trick-title').fadeIn();
        });
        break;
      default:
    }
  },
  renderNumber: function () {
    var template = _.template($('#number-template').html())({number: this.model.get('number')});
    $(this.numberElement).html(template);
  },
  renderStateCli: function (state) {
    switch(state) {
      case 0:
        console.log('Pick a Card!');
        console.log(this.model.get('trickDeck').toString());
        break;
      case 1:
        console.log('Pick a Number between 1 and 27!');
        break;
      case 2:
        console.log('Watch for your card! Tell me which pile it is in!');
        console.log('Pile 1:');
        console.log(this.model.get('pile1').toString());
        console.log('Pile 2:');
        console.log(this.model.get('pile2').toString());
        console.log('Pile 3:');
        console.log(this.model.get('pile3').toString());
        break;
      case 3:
        console.log('One more time! Watch for your card!');
        console.log('Pile 1:');
        console.log(this.model.get('pile1').toString());
        console.log('Pile 2:');
        console.log(this.model.get('pile2').toString());
        console.log('Pile 3:');
        console.log(this.model.get('pile3').toString());
        break;
      case 4:
        console.log('You know the drill! Where is your card?');
        console.log('Pile 1:');
        console.log(this.model.get('pile1').toString());
        console.log('Pile 2:');
        console.log(this.model.get('pile2').toString());
        console.log('Pile 3:');
        console.log(this.model.get('pile3').toString());
        break;
      case 5:
        console.log('Your card is the ' + this.model.get('trickDeck').models[this.model.get('number') - 1].toString());
        break;
    }
  },
  nextState: function (event) {
    this.model.nextState();
  },
  incrementNumber: function() {
    this.model.incrementNumber();
  },
  decrementNumber: function() {
    this.model.decrementNumber();
  },
  enterNumber: function() {
    var number = parseInt($('#number-input').val());
    if(number < 1 || isNaN(number)) {
      number = 1;
    } else if(number > 27) {
      number = 27;
    }
    this.model.set('number', number);
  },
  chooseNumber: function() {
    this.model.setSortOrder();
    this.model.nextState();
  },
  choosePile: function (event) {
    var $element = $(event.target);
    var $pileDiv = $element.closest('.pile');
    var pile = $pileDiv.data('pile') - 1;
    var placement = this.model.get('sortOrder')[(this.model.get('state') - 2)];
    this.model.merge(pile, placement);
    this.model.nextState();
  },
});
