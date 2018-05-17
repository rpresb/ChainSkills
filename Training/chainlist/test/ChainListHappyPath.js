var ChainList = artifacts.require('./ChainList.sol');

contract('ChainList', function (accounts) {
    var chainListInstance;
    var seller = accounts[1];
    var buyer = accounts[2];

    var article1 = {
        name: 'article 1',
        description: 'Description for article 1',
        price: 10
    };

    var article2 = {
        name: 'article 2',
        description: 'Description for article 2',
        price: 20
    };

    var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
    var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

    it('should be initialized with empty values', function () {
        return ChainList.deployed().then(function (instance) {
            chainListInstance = instance;
            return chainListInstance.getNumberOfArticles();
        }).then((data) => {
            assert.equal(data.toNumber(), 0, 'number of articles must be zero');
            return chainListInstance.getArticlesForSale();
        }).then((data) => {
            assert.equal(data.length, 0, 'there should not be any article for sale');
        });
    });

    it('should let us sell a first an article', function () {
        return ChainList.deployed()
            .then((instance) => {
                chainListInstance = instance;
                return chainListInstance.sellArticle(
                    article1.name,
                    article1.description,
                    web3.toWei(article1.price, "ether"),
                    { from: seller }
                );
            }).then((receipt) => {
                assert.equal(receipt.logs.length, 1, 'one event should have been triggered');
                assert.equal(receipt.logs[0].event, 'LogSellArticle', 'event should be LogSellArticle');
                assert.equal(receipt.logs[0].args._id.toNumber(), 1, 'id must be 1');
                assert.equal(receipt.logs[0].args._seller, seller, 'event seller must be ' + seller);
                assert.equal(receipt.logs[0].args._name, article1.name, 'event article name must be ' + article1.name);

                var priceInEther = web3.toWei(article1.price, 'ether');
                assert.equal(receipt.logs[0].args._price.toNumber(), priceInEther, 'event article price must be ' + priceInEther);

                return chainListInstance.getNumberOfArticles();
            }).then((numberOfArticles) => {
                assert.equal(numberOfArticles, 1, 'number of articles must be 1');

                return chainListInstance.getArticlesForSale();
            }).then((articles) => {
                assert.equal(articles.length, 1, 'there must be one article for sale');
                assert.equal(articles[0].toNumber(), 1, 'article id must be 1');

                return chainListInstance.articles(articles[0]);
            }).then((article) => {
                assert.equal(article[0].toNumber(), 1, 'article id must be 1');
                assert.equal(article[1], seller, 'seller must be ' + seller);
                assert.equal(article[2], 0x0, 'buyer must be empty');
                assert.equal(article[3], article1.name, 'article name must be ' + article1.name);
                assert.equal(article[4], article1.description, 'description must be ' + article1.description);

                var priceInEther = web3.toWei(article1.price, 'ether');
                assert.equal(article[5].toNumber(), priceInEther, 'article price must be ' + priceInEther);
            });
    });

    it('should trigger an event when a new article is sold', function () {
        return ChainList.deployed().then(function (instance) {
            chainListInstance = instance;
            return chainListInstance.sellArticle(articleName, articleDescription, web3.toWei(articlePrice, 'ether'), { from: seller });
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'one event should have been triggered');
            assert.equal(receipt.logs[0].event, 'LogSellArticle', 'event should be LogSellArticle');
            assert.equal(receipt.logs[0].args._seller, seller, 'event seller must be ' + seller);
            assert.equal(receipt.logs[0].args._name, articleName, 'event article name must be ' + articleName);

            var priceInEther = web3.toWei(articlePrice, 'ether');
            assert.equal(receipt.logs[0].args._price.toNumber(), priceInEther, 'event article price must be ' + priceInEther);
        });
    });

    it('should buy an article', function () {
        return ChainList.deployed().then(function (instance) {
            chainListInstance = instance;
            return chainListInstance.sellArticle(articleName, articleDescription, web3.toWei(articlePrice, "ether"), { from: seller });
        }).then(function () {
            sellerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(seller), 'ether').toNumber();
            buyerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(buyer), 'ether').toNumber();

            return chainListInstance.buyArticle({
                from: buyer,
                value: web3.toWei(articlePrice, 'ether')
            });
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'one event should have been triggered');
            assert.equal(receipt.logs[0].event, 'LogBuyArticle', 'event should be LogBuyArticle');
            assert.equal(receipt.logs[0].args._seller, seller, 'event seller must be ' + seller);
            assert.equal(receipt.logs[0].args._buyer, buyer, 'event buyer must be ' + buyer);
            assert.equal(receipt.logs[0].args._name, articleName, 'event article name must be ' + articleName);

            sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(seller), 'ether').toNumber();
            buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(buyer), 'ether').toNumber();

            assert(sellerBalanceAfterBuy >= sellerBalanceBeforeBuy + articlePrice, 'seller should have earned ' + articlePrice + ' ETH');
            assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - articlePrice, 'buyer should have spent ' + articlePrice + ' ETH');

            return chainListInstance.getArticle();
        }).then(function (data) {
            assert.equal(data[0], seller, 'seller must be ' + seller);
            assert.equal(data[1], buyer, 'buyer must be ' + buyer);
            assert.equal(data[2], articleName, 'article name must be ' + articleName);
            assert.equal(data[3], articleDescription, 'article description must be ' + articleDescription);
            assert.equal(data[4].toNumber(), web3.toWei(articlePrice, "ether"), 'article price must be ' + web3.toWei(articlePrice, "ether") + ' ETH');
        });
    });
});