'use strict';
const tape = require('tape');
const queue = require('d3-queue').queue;
const Carmen = require('../../..');
const context = require('../../../lib/geocoder/context');
const mem = require('../../../lib/sources/api-mem');
const addFeature = require('../../../lib/indexer/addfeature'),
    queueFeature = addFeature.queueFeature,
    buildQueued = addFeature.buildQueued;


(() => {
    const conf = {
        address: new mem({
            maxzoom: 6,
            geocoder_address:1,
            geocoder_format: '{{#eq address.number "3000"}}3000!{{else}}{{hyphenated address.number}}{{/eq}} {{toUpper address.name}}, {{place.name}}, {{region.name}} {{postcode.name}}',
            geocoder_tokens: { 'Lane': 'La' }
        }, () => {})
    };
    const opts = {
        formatHelpers: {
            toUpper: function(str) {
                return str.toUpperCase();
            },
            hyphenated: function(num) {
                if (num.length === 5) return num;
                if (num.length === 4) return num.substr(0,2) + '-' + num.substr(2,4);
                if (num.length === 6) return num.substr(0,3) + '-' + num.substr(3,5);
            }
        }
    };
    const c = new Carmen(conf, opts);
    tape('set opts', (t) => {
        addFeature.setOptions(opts);
        t.end();
    });
    tape('index address', (t) => {
        const address = {
            id:1,
            properties: {
                'carmen:text': 'Quincy Lane',
                'carmen:center': [0,0],
                'carmen:addressnumber': ['2169', '3000']
            },
            geometry: {
                type: 'MultiPoint',
                coordinates: [[0,0], [1,1]]
            }
        };
        queueFeature(conf.address, address, () => { buildQueued(conf.address, t.end); });
    });

    tape('test built-in template helper functions', (t) => {
        c.geocode('3000 Quincy Lane', {}, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].place_name, '3000! QUINCY LANE', 'uses built-in equality test');
            t.end();
        });
    });

    tape('test user-defined template helper functions', (t) => {
        c.geocode('2169 Quincy Lane', {}, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].place_name, '21-69 QUINCY LANE', 'uses helper functions to convert {address.name} toUpperCase and hyphenate {address.number}');
            t.end();
        });
    });

    tape('unset opts', (t) => {
        addFeature.setOptions({});
        t.end();
    });
})();

(() => {
    const conf = {
        country: new mem({ maxzoom:6, geocoder_format: '{{country.name}}' }, () => {}),
        postcode: new mem({ maxzoom: 6, geocoder_format: '{{region.name}}, {{postcode.name}}, {{country.name}}' }, () => {}),
        place: new mem({ maxzoom: 6, geocoder_format: '{{place.name}}, {{region.name}} {{postcode.name}}, {{country.name}}' }, () => {}),
        poi: new mem({ maxzoom: 6, geocoder_format: '{{poi.name}}, {{poi.properties.address}}, {{place.name}}, {{country.name}}' }, () => {}),
        locality: new mem({ maxzoom: 6, geocoder_format: '{{locality.name}}, {{place.name}} {{region.name}}' }, () => {}),
        region: new mem({ maxzoom: 6, geocoder_format: '{{!-- comment --}} {{region.name}}' }, () => {}),
        address: new mem(
            {
                maxzoom: 6, geocoder_address: 1,
                geocoder_format: '{{address.number}} {{address.name}} {{place.name}}, {{locality.name}} {{postcode.name}}, {{country.name}}',
                geocoder_format_zh: '{{address.number}} {{address.name}} {{place.name}}, {{locality.name}}, {{country.name}}',
                geocoder_languages: ['en', 'es', 'zh']
            }, () => {}
        )
    };
    const c = new Carmen(conf);
    tape('index country', (t) => {
        const country = {
            id:1,
            properties: {
                'carmen:text': 'United States',
                'carmen:center': [0,0],
                'carmen:zxy':['6/32/32']
            },
            geometry: {
                type: 'Point',
                coordinates: [0,0]
            }
        };
        queueFeature(conf.country, country, t.end);
    });

    tape('index place', (t) => {
        const place = {
            id:1,
            properties: {
                'carmen:text': 'New York',
                'carmen:center': [0,0],
                'carmen:zxy':['6/32/32']
            },
            geometry: {
                type: 'Point',
                coordinates: [0,0]
            }
        };
        queueFeature(conf.place, place, t.end);
    });

    tape('index locality', (t) => {
        const locality = {
            id:1,
            properties: {
                'carmen:text': 'New York',
                'carmen:center': [0,0],
                'carmen:zxy':['6/32/32']
            },
            geometry: {
                type: 'Point',
                coordinates: [0,0]
            }
        };
        queueFeature(conf.locality, locality, t.end);
    });

    tape('index postcode', (t) => {
        const postcode = {
            id:1,
            properties: {
                'carmen:text': '12345',
                'carmen:center': [0,0],
                'carmen:zxy':['6/32/32']
            },
            geometry: {
                type: 'Point',
                coordinates: [0,0]
            }
        };
        queueFeature(conf.postcode, postcode, t.end);
    });

    tape('index address', (t) => {
        const address = {
            id:1,
            properties: {
                'carmen:text': 'Lucky Charms Street',
                'carmen:center': [0,0],
                'carmen:addressnumber': ['9','10','7'],
                'carmen:format': '{{address.number}} {{address.name}}, {{place.name}} {{postcode.name}}, {{country.name}}'
            },
            geometry: {
                type: 'MultiPoint',
                coordinates: [[0,0],[0,0],[0,0]]
            }
        };
        queueFeature(conf.address, address, t.end);
    });

    tape('index address', (t) => {
        const address = {
            id:2,
            properties: {
                'carmen:text': 'Frosted Flakes Street',
                'carmen:text_zh': 'Frosted Flakes Street',
                'carmen:center': [0,0],
                'carmen:addressnumber': ['1','2','3'],
                'carmen:format_es': '{{address.number}} {{address.name}}, {{place.name}}, {{country.name}}'
            },
            geometry: {
                type: 'MultiPoint',
                coordinates: [[0,0],[0,0],[0,0]]
            }
        };
        queueFeature(conf.address, address, t.end);
    });

    tape('index wrong format address', (t) => {
        const address = {
            id:3,
            properties: {
                'carmen:text': 'Cheerios Street',
                'carmen:center': [0,0],
                'carmen:addressnumber': ['9','10','7'],
                'carmen:format': 123
            },
            geometry: {
                type: 'MultiPoint',
                coordinates: [[0,0],[0,0],[0,0]]
            }
        };
        queueFeature(conf.address, address, t.end);
    });

    tape('index poi', (t) => {
        const poi = {
            id:1,
            properties: {
                'carmen:text': 'Shake Shack',
                'carmen:center': [0,0],
                'address': 'C. C Mar Shopping'
            },
            geometry: {
                type: 'Point',
                coordinates: [0,0]
            }
        };
        queueFeature(conf.poi, poi, t.end);
    });

    tape('index region - !-- format', (t) => {
        const region = {
            id:1,
            properties: {
                'carmen:text': 'California',
                'carmen:center': [0,0]
            },
            geometry: {
                type: 'Point',
                coordinates: [0,0]
            }
        };
        t.equals(conf.region.geocoder_feature_types_in_format, null, 'special characters in the format string are set to null');
        queueFeature(conf.region, region, t.end);
    });

    tape('build queued features', (t) => {
        const q = queue();
        Object.keys(conf).forEach((c) => {
            q.defer((cb) => {
                buildQueued(conf[c], cb);
            });
        });
        q.awaitAll(t.end);
    });

    tape('Index format applied to properties - {{address.number}} {{address.name}} {{place.name}}, {{locality.name}} {{postcode.name}}, {{country.name}}', (t) => {
        c.geocode('2 Frosted Flakes Street', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].place_name, '2 Frosted Flakes Street New York, New York 12345, United States');
            t.end();
        });
    });

    tape('carmen:format on feature applied to properties - {{address.number}} {{address.name}}, {{place.name}} {{postcode.name}}, {{country.name}}', (t) => {
        c.geocode('9 Lucky Charms Street', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].place_name, '9 Lucky Charms Street, New York 12345, United States');
            t.end();
        });
    });

    tape('Incorrect carmen:format fallback to index format - {{address.number}} {{address.name}} {{place.name}}, {{locality.name}} {{postcode.name}}, {{country.name}}', (t) => {
        c.geocode('9 Cheerios Street', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].place_name, '9 Cheerios Street New York, New York 12345, United States');
            t.end();
        });
    });

    tape('Search for an address language', (t) => {
        c.geocode('2 Frosted Flakes Street', { language: 'es' }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].place_name, '2 Frosted Flakes Street, New York, United States');
            t.end();
        });
    });

    tape('Search for an address which uses the language format for the index', (t) => {
        c.geocode('2 Frosted Flakes Street', { language: 'zh' }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].place_name, '2 Frosted Flakes Street New York, New York, United States');
            t.end();
        });
    });

    tape('{{poi.address}} test', (t) => {
        c.geocode('Shake Shack', {}, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].place_name, 'Shake Shack, C. C Mar Shopping, New York, United States');
            t.end();
        });
    });

    tape('!-- comment -- in format test', (t) => {
        c.geocode('California', {}, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].place_name, 'California');
            t.end();
        });
    });

    tape('teardown', (t) => {
        context.getTile.cache.reset();
        t.end();
    });
})();

(() => {
    const conf = {
        address: new mem({
            maxzoom: 6, geocoder_address: 1, geocoder_name:'address', geocoder_tokens: { 'Street': 'st' }, geocoder_format: '{{!-- comment --}} {{address.number}} {{address.name}} {{place.name}}, {{locality.name}} {{postcode.name}}, {{country.name}}'
        }, () => {})
    };
    const c = new Carmen(conf);

    tape('index address', (t) => {
        const addresses = [
            {
                id:1,
                properties: {
                    'carmen:text':'Main st',
                    'carmen:center':[0,0],
                },
                geometry: {
                    type: 'Point',
                    coordinates: [0,0]
                }
            },
            {
                id:2,
                properties: {
                    'carmen:text':'Main street',
                    'carmen:center':[0,0],
                    'carmen:addressnumber': ['1','2','3','4','5']
                },
                geometry: {
                    type: 'MultiPoint',
                    coordinates: [[0,0],[1,1],[2,2],[3,3],[4,4]]
                }
            }
        ];
        queueFeature(conf.address, addresses, t.end);
    });

    tape('build queued features', (t) => {
        const q = queue();
        Object.keys(conf).forEach((c) => {
            q.defer((cb) => {
                buildQueued(conf[c], cb);
            });
        });
        q.awaitAll(t.end);
    });

    tape('Main st -- will allow dedupes because format string contains special characters', (t) => {
        c.geocode('Main st', {}, (err, res) => {
            t.ifError(err);
            t.equals(res.features.length, 2);
            t.deepEqual(res.features.map((v) => v.place_name).sort(), ['Main st', 'Main street']);
            t.end();
        });
    });

    tape('teardown', (t) => {
        context.getTile.cache.reset();
        t.end();
    });
})();
