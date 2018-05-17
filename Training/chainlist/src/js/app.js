App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    web3 = new Web3(App.web3Provider);

    App.displayAccountInfo();

    return App.initContract();
  },

  displayAccountInfo: function () {
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $('#account').text(account);
        web3.eth.getBalance(account, function (err, balance) {
          if (err === null) {
            $('#accountBalance').text(web3.fromWei(balance, 'ether') + ' ETH');
          }
        });
      }
    });
  },

  initContract: function () {
    $.getJSON('ChainList.json', function (chainListArtifact) {
      App.contracts.ChainList = TruffleContract(chainListArtifact);
      App.contracts.ChainList.setProvider(App.web3Provider);
      App.listenToEvents();
      return App.reloadArticles();
    });
  },

  reloadArticles: function () {
    App.displayAccountInfo();
    $('#articlesRow').empty();
    App.contracts.ChainList.deployed().then(function (instance) {
      return instance.getArticle();
    }).then(function (article) {
      if (article[0] == 0x0) {
        return;
      }
      console.log(article);

      var price = web3.fromWei(article[4], 'ether');

      var articleTemplate = $('#articleTemplate');
      articleTemplate.find('.panel-title').text(article[2]);
      articleTemplate.find('.article-description').text(article[3]);
      articleTemplate.find('.article-price').text(price + ' ETH');
      articleTemplate.find('.btn-buy').attr('data-value', price);

      var seller = article[0];
      if (seller == App.account) {
        seller = 'You';
      }
      articleTemplate.find('.article-seller').text(seller);

      var buyer = article[1];
      if (buyer == App.account) {
        buyer = "You";
      } else if (buyer == 0x0) {
        buyer = "No one yet";
      }
      articleTemplate.find('.article-buyer').text(buyer);

      if (article[0] == App.account || article[1] != 0x0) {
        articleTemplate.find('.btn-buy').attr('disabled', 'disabled');
      } else {
        articleTemplate.find('.btn-buy').removeAttr('disabled');
      }

      $('#articlesRow').append(articleTemplate.html());
    }).catch(function (err) {
      console.error(err);
    });
  },

  sellArticle: function () {
    var _article_name = $('#article_name').val();
    var _description = $('#article_description').val();
    var _price = web3.toWei(parseFloat($('#article_price').val() || 0), 'ether');

    if ((_article_name.trim() == '') || (_price == 0)) {
      return;
    }

    App.contracts.ChainList.deployed().then(function (instance) {
      return instance.sellArticle(_article_name, _description, _price, {
        from: App.account,
        gas: 500000
      });
    }).catch(function (err) {
      console.error(err);
    });
  },

  buyArticle: () => {
    event.preventDefault();
    var _price = parseFloat($(event.target).data('value'));
    App.contracts.ChainList.deployed()
      .then((instance) => instance.buyArticle({
        from: App.account,
        value: web3.toWei(_price, 'ether'),
        gas: 500000
      }))
      .catch((err) => console.error(err));
  },

  listenToEvents: function () {
    App.contracts.ChainList.deployed().then(function (instance) {
      instance.LogSellArticle({}, {}).watch(function (error, event) {
        if (!error) {
          console.log(event);
          $('#events').append(`<li class="list-group-item">${event.args._name} is now for sale</li>`);
        } else {
          console.error(error);
        }

        App.reloadArticles();
      });

      instance.LogBuyArticle({}, {}).watch(function (error, event) {
        if (!error) {
          console.log(event);
          $('#events').append(`<li class="list-group-item">${event.args._buyer} bought ${event.args._name}</li>`);
        } else {
          console.error(error);
        }

        App.reloadArticles();
      });
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
