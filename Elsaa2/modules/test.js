var Test = (function () {
    function Test() {
        this.data = [1, 2, 3, 4, 5, 6];
    }

    Test.prototype.dump = function (req, res) {
        var self = global.test;
        res.json(self.data);
    };

    return Test;
})();

module.exports = new Test();
