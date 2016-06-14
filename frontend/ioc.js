'use strict';

let ioc = require('electrolyte');
ioc.use(ioc.dir(__dirname));
ioc.use('services', ioc.dir('services'));
module.exports = ioc;