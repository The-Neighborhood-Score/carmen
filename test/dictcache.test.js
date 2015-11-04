var tape = require('tape');
var zlib = require('zlib');
var encodePhrase = require('../lib/util/termops').encodePhrase;
var Dictcache = require('../lib/util/dictcache');

tape('create (24 bit)', function(assert) {
    var dict = new Dictcache();
    assert.equal(dict.cache.length, 2097152, 'created 2MiB cache');
    for (var i = 0; i < 2097152; i++) {
        if (dict.cache[i] !== 0) {
            assert.fail('buffer filled with 0s');
        }
    }
    assert.end();
});

tape('create (28 bit)', function(assert) {
    var dict = new Dictcache(null, 28);
    assert.equal(dict.cache.length, 33554432, 'created 32MiB cache');
    for (var i = 0; i < 33554432; i++) {
        if (dict.cache[i] !== 0) {
            assert.fail('buffer filled with 0s');
        }
    }
    assert.end();
});

tape('create (2 MiB buffer)', function(assert) {
    var dict = new Dictcache(new Buffer(2097152));
    assert.equal(dict.cache.length, 2097152, 'created 2MiB cache');
    assert.equal(dict.size, Math.pow(2,24), 'created 24 bitsize cache');
    assert.end();
});

tape('create (32 MiB buffer)', function(assert) {
    var dict = new Dictcache(new Buffer(33554432));
    assert.equal(dict.cache.length, 33554432, 'created 32MiB cache');
    assert.equal(dict.size, Math.pow(2,28), 'created 28 bitsize cache');
    assert.end();
});

tape('create (err: size)', function(assert) {
    assert.throws(function() {
        var dict = new Dictcache(null, 20);
    });
    assert.end();
});

tape('create (err: bufferlength)', function(assert) {
    assert.throws(function() {
        var dict = new Dictcache(new Buffer(50));
    });
    assert.end();
});

tape('dump/load', function(assert) {
    assert.throws(function() {
        var foo = new Dictcache(new Buffer(200));
    }, 'throws with bad length buffer');

    var dict = new Dictcache();
    dict.set(1);
    dict.set(2);
    dict.set(3);
    dict.set(4);

    zlib.gzip(dict.dump(), function(err, zdata) {
        assert.ifError(err);
        assert.ok(zdata.length < 40e3, 'gzipped dictcache < 40k');
        zlib.gunzip(zdata, function(err, data) {
            assert.ifError(err);
            var loaded = new Dictcache(data);
            assert.equal(dict.has(1), true, 'has 1');
            assert.equal(dict.has(2), true, 'has 2');
            assert.equal(dict.has(3), true, 'has 3');
            assert.equal(dict.has(4), true, 'has 4');
            assert.equal(dict.has(5), false, 'not 5');
            assert.end();
        });
    });
});

tape('set/has/del', function(assert) {
    var dict = new Dictcache();

    // initial state
    assert.equal(dict.has(0), false, 'has 0 = false');
    // set 0
    assert.equal(dict.set(0), undefined, 'set 0');
    assert.equal(dict.cache[0], 1, 'sets buffer[0] === 1');
    assert.equal(dict.has(0), true, 'has 0 = true');
    assert.equal(dict.has(dict.size), true, 'truncates to 2^24');
    // del 0
    assert.equal(dict.del(0), undefined, 'del 0');
    assert.equal(dict.cache[0], 0, 'sets buffer[0] === 0');
    assert.equal(dict.has(0), false, 'has 0 = true');

    // initial state
    var last = dict.size - 1;
    assert.equal(dict.has(last), false);
    // set 0
    assert.equal(dict.set(last), undefined);
    assert.equal(dict.cache[dict.cache.length-1], 128, 'sets last byte === 128');
    assert.equal(dict.has(last), true);
    // del 0
    assert.equal(dict.del(last), undefined, 'del biggest');
    assert.equal(dict.cache[dict.cache.length-1], 0, 'sets last byte === 0');
    assert.equal(dict.has(last), false, 'has biggest = false');

    // test within byte bounds
    for (var id = 0; id < 8; id++) {
        assert.equal(dict.has(id), false, 'has ' + id + ' = false');
        assert.equal(dict.set(id), undefined, 'set ' + id);
        assert.equal(dict.has(id), true, 'has ' + id + ' = true');
    }
    for (var id = 0; id < 8; id++) {
        assert.equal(dict.del(id), undefined, 'del ' + id);
        assert.equal(dict.has(id), false, 'has ' + id + ' = false');
    }

    // fuzz test
    var used = {};
    var count = 0;
    for (var i = 0; i < 10000; i++) {
        var id = encodePhrase([Math.random().toString()]);
        if (used[id%dict.size]) continue;
        count++;
        used[id%dict.size] = true;
        if (dict.has(id) !== false) assert.fail('fuzz test pre has(): ' + id)
        if (dict.set(id) !== undefined) assert.fail('fuzz test set(): ' + id)
        if (dict.has(id) !== true) assert.fail('fuzz test post has(): ' + id)
    }
    assert.ok(true, 'fuzz test x' + count);

    assert.end();
});


