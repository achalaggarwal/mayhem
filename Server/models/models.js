/*
 * Model
 */

var Schema = require('./schema')();

require('./user')(Schema.User);
require('./job')(Schema.Job);
