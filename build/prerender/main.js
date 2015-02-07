module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/_assets/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var async = __webpack_require__(3);
	var React = __webpack_require__(1);
	var Router = __webpack_require__(8);
	var ItemsStore = __webpack_require__(6);
	var routes = __webpack_require__(4);
	var storesDescriptions = __webpack_require__(5);
	var html = __webpack_require__(9);

	// create stores for prerending
	// readItems contains async methods for fetching the data from database
	function createStoresPrerender(readItems) {
		return Object.keys(storesDescriptions).reduce(function(obj, name) {
			obj[name] = new ItemsStore(Object.assign({
				readSingleItem: readItems[name],
				queueRequest: function(fn) { fn(); }
			}, storesDescriptions[name]));
			return obj;
		}, {});
	}

	module.exports = function(path, readItems, scriptUrl, styleUrl, commonsUrl, callback) {
		var stores = createStoresPrerender(readItems);

		// run the path thought react-router
		Router.run(routes, path, function(Application, state) {
			// wait until every store is charged by the components
			// for faster response time there could be a timeout here
			async.forEach(state.routes, function(route, callback) {
				if(route.handler.chargeStores) {
					route.handler.chargeStores(stores, state.params, callback);
				} else {
					callback();
				}
			}, function() {

				// prerender the application with the stores
				var application = React.withContext({
					stores: stores
				}, function() {
					return React.renderToString(React.createElement(Application, null));
				});

				// format the full page
				callback(null, html
					.replace("STYLE_URL", styleUrl)
					.replace("SCRIPT_URL", scriptUrl)
					.replace("COMMONS_URL", commonsUrl)
					.replace("DATA", JSON.stringify(Object.keys(stores).reduce(function(obj, name) {
						if(!stores[name].desc.local)
							obj[name] = stores[name].getData();
						return obj;
					}, {})))
					.replace("CONTENT", application));
			});
		});
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("react");

/***/ },
/* 2 */,
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("async");

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var Router = __webpack_require__(8);
	var Route = Router.Route;
	var DefaultRoute = Router.DefaultRoute;

	// polyfill
	if(!Object.assign)
		Object.assign = React.__spread;

	// export routes
	module.exports = (
		React.createElement(Route, {name: "app", path: "/", handler: __webpack_require__(10)}, 
			React.createElement(Route, {name: "some-page", path: "/some-page", handler: __webpack_require__(11)}), 
			React.createElement(Route, {name: "displayname", path: "/displayname", handler: __webpack_require__(12)}), 
			React.createElement(Route, {name: "todolist", path: "/:list", handler: __webpack_require__(13)}), 
			React.createElement(Route, {name: "todoitem", path: "/todo/:item", handler: __webpack_require__(14)}), 
			React.createElement(DefaultRoute, {name: "home", handler: __webpack_require__(15)})
		)
	);


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// a helper method for merging react style updates
	// (not totally correct, but fine for now)
	function mergeUpdates(a, b) {
		if(typeof a === "object" && typeof b === "object") {
			var res = {};
			Object.keys(a).concat(Object.keys(b)).forEach(function(key) {
				if(a[key] && b[key]) {
					switch(key) {
						case "$push":
							res[key] = a[key].concat(b[key]);
							break;
						case "$unshift":
							res[key] = b[key].concat(a[key]);
							break;
						case "$splice":
							res[key] = a[key].concat(b[key]);
							break;
						case "$set":
							res[key] = b[key];
							break;
						case "$merge":
							var o = res[key] = {};
							Object.keys(a[key]).forEach(function(x) {
								o[x] = a[key][x]
							});
							Object.keys(b[key]).forEach(function(x) {
								o[x] = b[key][x]
							});
							break;
					}
					res[key] = mergeUpdates(a[key], b[key]);
				} else if(a[key])
					res[key] = a[key];
				else
					res[key] = b[key];
			});
		}
		return a || b;
	}

	module.exports = {
		// the Router is a local store that handles information about data fetching
		// see ../config/app.jsx
		Router: {
			local: true,
			readSingleItem: function(item, callback) {
				callback(null, item.oldData || null);
			}
		},

		// stores TodoLists
		// changes are react style updates
		TodoList: {
			applyUpdate: __webpack_require__(7),
			mergeUpdates: mergeUpdates,
		},

		// stores TodoItems
		// changes are in the default format
		// errors result in artifical error items
		TodoItem: {
			applyNewError: function(oldData, error) {
				return {
					error: error.message
				};
			}
		}
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	function ItemsStore(desc, initialData) {
		if(!desc || typeof desc !== "object")
			throw new Error("Invalid argument: desc must be an object");
		desc.applyUpdate = desc.applyUpdate || applyUpdate;
		desc.mergeUpdates = desc.mergeUpdates || mergeUpdates;
		desc.rebaseUpdate = desc.rebaseUpdate || rebaseUpdate;
		desc.applyNewData = desc.applyNewData || applyNewData;
		desc.applyNewError = desc.applyNewError || applyNewError;
		desc.queueRequest = desc.queueRequest || process.nextTick.bind(process);
		this.desc = desc;
		this.items = initialData ? Object.keys(initialData).reduce(function(obj, key) {
			obj[key] = {
				data: initialData[key],
				tick: 0
			};
			return obj;
		}, {}) : {};
		this.createableItems = [];
		this.deletableItems = [];
		this.requesting = false;
		this.invalidItems = [];
		this.updateTick = 0;
		this.supportCreate = desc.createSingleItem || desc.createMultipleItems ||
			desc.createAndReadSingleItem || desc.createAndReadMultipleItems;
		this.supportDelete = desc.deleteSingleItem || desc.deleteMultipleItems;
		this.supportWrite = desc.writeSingleItem || desc.writeMultipleItems ||
			desc.writeAndReadSingleItem || desc.writeAndReadMultipleItems;
		this.supportRead = desc.readSingleItem || desc.readMultipleItems;
	}

	module.exports = ItemsStore;

	/*

	item = { outdated: true }
	no item data available and data should be requested

	item = { data: {} }
	item data available

	item = { data: {}, outdated: true }
	item data available, but data should be renewed by request

	item = { data: {}, update: {}, newData: {} }
	item data available, but it should be updated with the "update" and "newData"

	item = { update: {} }
	no item data available and it should be updated with the "update"

	*/

	ItemsStore.prototype._createItem = function() {
		return {
			data: undefined,
			update: undefined,
			newData: undefined,
			error: undefined,
			outdated: undefined,
			tick: undefined,
			handlers: undefined,
			infoHandlers: undefined
		};
	}

	ItemsStore.prototype.getData = function() {
		var data = {};
		var hasData = false;
		Object.keys(this.items).forEach(function(key) {
			if(this.items[key].data) {
				data[key] = this.items[key].data;
				hasData = true;
			}
		}, this);
		if(hasData)
			return data;
	};

	ItemsStore.prototype.outdate = function(id) {
		if(typeof id === "string") {
			var item = this.items["_" + id];
			if(!item) return;
			item.tick = null;
		} else {
			this.updateTick++;
		}
	};

	ItemsStore.prototype.update = function(allOrId) {
		if(typeof allOrId === "string") {
			var id = allOrId;
			var item = this.items["_" + id];
			if(!item) return;
			if(!item.outdated) {
				item.outdated = true;
				this.invalidateItem(id);
				if(item.infoHandlers) {
					var handlers = item.infoHandlers.slice();
					handlers.forEach(function(fn) {
						fn(item.newData !== undefined ? item.newData : item.data);
					});
				}
			}
		} else {
			this.updateTick++;
			Object.keys(this.items).forEach(function(key) {
				var id = key.substr(1);
				var item = this.items[key];
				if(!item) return;
				if(!item.outdated && (allOrId || (item.handlers && item.handlers.length > 0))) {
					item.outdated = true;
					this.invalidateItem(id);
				}
			}, this);
		}
	};

	ItemsStore.prototype.listenToItem = function(id, handler) {
		if(typeof handler !== "function") throw new Error("handler argument must be a function");
		var lease = {
			close: function lease() {
				var item = this.items["_" + id];
				if(!item) return;
				var idx = item.handlers.indexOf(handler);
				if(idx < 0) return;
				item.handlers.splice(idx, 1);
				item.leases.splice(idx, 1);
				// TODO stream: if item.handlers.length === 0
			}.bind(this)
		};
		var item = this.items["_" + id];
		if(!item) {
			item = this._createItem();
			item.handlers = [handler];
			item.leases = [lease];
			item.outdated = true;
			this.items["_" + id] = item;
			this.invalidateItem(id);
		} else {
			if(item.handlers) {
				var idx = item.handlers.indexOf(handler);
				if(idx >= 0) {
					return item.leases[idx];
				}
				item.handlers.push(handler);
				item.leases.push(lease);
			} else {
				item.handlers = [handler];
				item.leases = [lease];
			}
			if(item.tick !== this.updateTick && !item.outdated) {
				item.outdated = true;
				this.invalidateItem(id);
			}
		}
		// TODO stream: start streaming
		return lease;
	}

	ItemsStore.prototype.waitForItem = function(id, callback) {
		var self = this;
		var onUpdate = function() {
			if(!self.isItemUpToDate(id)) return;
			var idx = item.infoHandlers.indexOf(onUpdate);
			if(idx < 0) return;
			item.infoHandlers.splice(idx, 1);
			callback();
		};

		var item = this.items["_" + id];
		if(!item) {
			item = this._createItem();
			item.infoHandlers = [onUpdate];
			item.outdated = true;
			this.items["_" + id] = item;
			this.invalidateItem(id);
		} else {
			if(this.isItemUpToDate(id)) {
				callback();
				return;
			}
			if(item.infoHandlers) {
				item.infoHandlers.push(onUpdate);
			} else {
				item.infoHandlers = [onUpdate];
			}
			if(!item.outdated && item.tick !== this.updateTick) {
				item.outdated = true;
				this.invalidateItem(id);
			}
		}
	};

	ItemsStore.prototype.getItem = function(id) {
		var item = this.items["_" + id];
		if(!item) return undefined;
		return item.newData !== undefined ? item.newData : item.data;
	};

	ItemsStore.prototype.isItemAvailable = function(id) {
		var item = this.items["_" + id];
		return !!(item && item.data !== undefined);
	};

	ItemsStore.prototype.isItemUpToDate = function(id) {
		var item = this.items["_" + id];
		return !!(item && item.data !== undefined && !item.outdated && item.tick === this.updateTick);
	};

	ItemsStore.prototype.getItemInfo = function(id) {
		var item = this.items["_" + id];
		if(!item) return {
			available: false,
			outdated: false,
			updated: false,
			listening: false,
			error: undefined
		};
		return {
			available: item.data !== undefined,
			outdated: !(!item.outdated && item.tick === this.updateTick),
			updated: item.update !== undefined,
			listening: !!item.handlers && item.handlers.length > 0,
			error: item.error
		};
	};

	ItemsStore.prototype.updateItem = function(id, update) {
		if(!this.supportWrite)
			throw new Error("Store doesn't support updating of items");
		var item = this.items["_" + id];
		if(!item) {
			item = this._createItem();
			item.update = update;
			this.items["_" + id] = item;
		} else {
			if(item.data !== undefined) {
				item.newData = this.desc.applyUpdate(item.newData !== undefined ? item.newData : item.data, update);
			}
			if(item.update !== undefined) {
				item.update = this.desc.mergeUpdates(item.update, update);
			} else {
				item.update = update;
			}
		}
		this.invalidateItem(id);
		if(item.data !== undefined && item.handlers) {
			var handlers = item.handlers.slice();
			handlers.forEach(function(fn) {
				fn(item.newData);
			});
		}
	};

	ItemsStore.prototype.createItem = function(data, handler) {
		if(!this.supportCreate)
			throw new Error("Store doesn't support creating of items");
		this.createableItems.push({
			data: data,
			handler: handler
		});
		if(!this.requesting) {
			this.requesting = true;
			this._queueRequest();
		}
	};

	ItemsStore.prototype.deleteItem = function(id, handler) {
		if(!this.supportDelete)
			throw new Error("Store doesn't support deleting of items");
		this.deletableItems.push({
			id: id,
			handler: handler
		});
		if(!this.requesting) {
			this.requesting = true;
			this._queueRequest();
		}
	};

	ItemsStore.prototype.invalidateItem = function(id) {
		if(this.invalidItems.indexOf(id) >= 0)
			return;
		if(!this.supportRead)
			throw new Error("Store doesn't support reading of items");
		this.invalidItems.push(id);
		if(!this.requesting) {
			this.requesting = true;
			this._queueRequest();
		}
	};

	ItemsStore.prototype._queueRequest = function() {
		this.desc.queueRequest(this._request.bind(this));
	};

	ItemsStore.prototype._requestWriteAndReadMultipleItems = function(items, callback) {
		this.desc.writeAndReadMultipleItems(items, function(err, newDatas) {
			if(err) {
				items.forEach(function(item) {
					this.setItemError(item.id, err);
				}, this);
			}
			if(newDatas) {
				Object.keys(newDatas).forEach(function(id) {
					this.setItemData(id.substr(1), newDatas[id]);
				}, this);
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestWriteMultipleItems = function(items, callback) {
		this.desc.writeMultipleItems(items, function(err) {
			if(err) {
				items.forEach(function(item) {
					this.setItemError(item.id, err);
				}, this);
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestWriteAndReadSingleItem = function(item, callback) {
		this.desc.writeAndReadSingleItem(item, function(err, newData) {
			if(err) {
				this.setItemError(item.id, err);
			}
			if(newData !== undefined) {
				this.setItemData(item.id, newData);
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestWriteSingleItem = function(item, callback) {
		this.desc.writeSingleItem(item, function(err) {
			if(err) {
				this.setItemError(item.id, err);
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestReadMultipleItems = function(items, callback) {
		this.desc.readMultipleItems(items, function(err, newDatas) {
			if(err) {
				items.forEach(function(item) {
					this.setItemError(item.id, err);
				}, this);
			}
			if(newDatas) {
				Object.keys(newDatas).forEach(function(id) {
					this.setItemData(id.substr(1), newDatas[id]);
				}, this);
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestReadSingleItem = function(item, callback) {
		this.desc.readSingleItem(item, function(err, newData) {
			if(err) {
				this.setItemError(item.id, err);
			}
			if(newData !== undefined) {
				this.setItemData(item.id, newData);
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestCreateSingleItem = function(item, callback) {
		this.desc.createSingleItem(item, function(err, id) {
			if(item.handler) item.handler(err, id);
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestCreateMultipleItems = function(items, callback) {
		this.desc.createMultipleItems(items, function(err, ids) {
			for(var i = 0; i < items.length; i++) {
				if(items[i].handler) {
					items[i].handler(err, ids && ids[i]);
				}
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestCreateAndReadSingleItem = function(item, callback) {
		this.desc.createAndReadSingleItem(item, function(err, id, newData) {
			if(!err && newData !== undefined) {
				this.setItemData(id, newData);
			}
			if(item.handler) item.handler(err, id, newData);
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestCreateAndReadMultipleItems = function(items, callback) {
		this.desc.createAndReadMultipleItems(items, function(err, ids, newDatas) {
			if(newDatas) {
				Object.keys(newDatas).forEach(function(id) {
					this.setItemData(id.substr(1), newDatas[id]);
				}, this);
			}
			for(var i = 0; i < items.length; i++) {
				if(items[i].handler) {
					items[i].handler(err, ids && ids[i], ids && newDatas && newDatas[ids[i]]);
				}
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestDeleteSingleItem = function(item, callback) {
		this.desc.deleteSingleItem(item, function(err) {
			if(item.handler) item.handler(err);
			if(!err) {
				delete this.items["_" + item.id];
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._requestDeleteMultipleItems = function(items, callback) {
		this.desc.deleteMultipleItems(items, function(err) {
			for(var i = 0; i < items.length; i++) {
				if(items[i].handler) {
					items[i].handler(err);
				}
				if(!err) {
					delete this.items["_" + items[i].id];
				}
			}
			this._queueRequest();
			callback();
		}.bind(this));
	};

	ItemsStore.prototype._request = function(callback) {
		callback = callback || function () {};
		if(this.desc.createAndReadMultipleItems) {
			var items = this._popCreateableItem(true);
			if(items.length === 1 && this.desc.createAndReadSingleItem) {
				this._requestCreateAndReadSingleItem(items[0], callback);
				return;
			} else if(items.length > 0) {
				this._requestCreateAndReadMultipleItems(items, callback);
				return;
			}
		}
		if(this.desc.createMultipleItems) {
			var items = this._popCreateableItem(true);
			if(items.length === 1 && this.desc.createSingleItem) {
				if(!this.desc.createAndReadSingleItem) {
					this._requestCreateSingleItem(items[0], callback);
					return;
				}
			} else if(items.length > 0) {
				this._requestCreateMultipleItems(items, callback);
				return;
			}
		}
		if(this.desc.createAndReadSingleItem) {
			var item = this._popCreateableItem(false);
			if(item) {
				this._requestCreateAndReadSingleItem(item, callback);
				return;
			}
		}
		if(this.desc.createSingleItem) {
			var item = this._popCreateableItem(false);
			if(item) {
				this._requestCreateSingleItem(item, callback);
				return;
			}
		}
		if(this.desc.writeAndReadMultipleItems) {
			var items = this._popWriteableItem(true, true);
			if(items.length === 1 && this.desc.writeAndReadSingleItem) {
				this._requestWriteAndReadSingleItem(items[0], callback);
				return;
			} else if(items.length > 0) {
				this._requestWriteAndReadMultipleItems(items, callback);
				return;
			}
		}
		if(this.desc.writeMultipleItems) {
			var items = this._popWriteableItem(true, false);
			if(items.length === 1 && this.desc.writeSingleItem) {
				if(!this.desc.writeAndReadSingleItem) {
					this._requestWriteSingleItem(items[0], callback);
					return;
				}
			} else if(items.length > 0) {
				this._requestWriteMultipleItems(items, callback);
				return;
			}
		}
		if(this.desc.writeAndReadSingleItem) {
			var item = this._popWriteableItem(false, true);
			if(item) {
				this._requestWriteAndReadSingleItem(item, callback);
				return;
			}
		}
		if(this.desc.writeSingleItem) {
			var item = this._popWriteableItem(false);
			if(item) {
				this._requestWriteSingleItem(item, callback);
				return;
			}
		}
		if(this.desc.deleteMultipleItems) {
			var items = this._popDeleteableItem(true);
			if(items.length === 1 && this.desc.deleteSingleItem) {
				this._requestDeleteSingleItem(items[0], callback);
				return;
			} else if(items.length > 0) {
				this._requestDeleteMultipleItems(items, callback);
				return;
			}
		}
		if(this.desc.deleteSingleItem) {
			var item = this._popDeleteableItem(false);
			if(item) {
				this._requestDeleteSingleItem(item, callback);
				return;
			}
		}
		if(this.desc.readMultipleItems) {
			var items = this._popReadableItem(true);
			if(items.length === 1 && this.desc.readSingleItem) {
				this._requestReadSingleItem(items[0], callback);
				return;
			} else if(items.length > 0) {
				this._requestReadMultipleItems(items, callback);
				return;
			}
		}
		if(this.desc.readSingleItem) {
			var item = this._popReadableItem(false);
			if(item) {
				this._requestReadSingleItem(item, callback);
				return;
			}
		}
		this.requesting = false;
		callback();
	};

	ItemsStore.prototype.setItemError = function(id, newError) {
		var item = this.items["_" + id];
		if(!item) {
			item = this._createItem();
			item.data = this.desc.applyNewError(undefined, newError);
			item.error = newError;
			item.tick = this.updateTick;
			this.items["_" + id] = item;
			return;
		}
		newData = this.desc.applyNewError(item.data, newError);
		item.error = newError;
		this._setItemNewData(id, item, newData)
	};

	ItemsStore.prototype.setItemData = function(id, newData) {
		var item = this.items["_" + id];
		if(!item) {
			item = this._createItem();
			item.data = this.desc.applyNewData(undefined, newData);
			item.tick = this.updateTick;
			this.items["_" + id] = item;
			return;
		}
		newData = this.desc.applyNewData(item.data, newData);
		item.error = null;
		this._setItemNewData(id, item, newData)
	};

	ItemsStore.prototype._setItemNewData = function(id, item, newData) {
		if(item.newData !== undefined) {
			item.update = this.desc.rebaseUpdate(item.update, item.data, newData);
			item.newData = this.desc.applyUpdate(newData, item.update);
		}
		var oldData = item.data;
		item.data = newData;
		item.outdated = false;
		item.tick = this.updateTick;
		if(item.update === undefined) {
			var idx = this.invalidItems.indexOf(id);
			if(idx >= 0)
				this.invalidItems.splice(idx, 1);
		}
		var infoHandlers = item.infoHandlers && item.infoHandlers.slice();
		var handlers = item.handlers && item.handlers.slice();
		if(infoHandlers) {
			infoHandlers.forEach(function(fn) {
				fn();
			});
		}
		if(handlers && oldData !== newData) {
			handlers.forEach(function(fn) {
				fn(item.newData !== undefined ? item.newData : newData);
			});
		}
	};

	ItemsStore.prototype._popCreateableItem = function(multiple) {
		if(multiple) {
			if(this.maxCreateItems && this.maxCreateItems < this.createableItems.length) {
				return this.createableItems.splice(0, this.maxCreateItems);
			} else {
				var items = this.createableItems;
				this.createableItems = [];
				return items;
			}
		} else {
			return this.createableItems.shift();
		}
	};

	ItemsStore.prototype._popDeleteableItem = function(multiple) {
		if(multiple) {
			if(this.maxDeleteItems && this.maxDeleteItems < this.deletableItems.length) {
				return this.deletableItems.splice(0, this.maxDeleteItems);
			} else {
				var items = this.deletableItems;
				this.deletableItems = [];
				return items;
			}
		} else {
			return this.deletableItems.shift();
		}
	};

	ItemsStore.prototype._popWriteableItem = function(multiple, willRead) {
		var results = [];
		for(var i = 0; i < this.invalidItems.length; i++) {
			var id = this.invalidItems[i];
			var item = this.items["_" + id];
			if(item.update) {
				var result = {
					id: id,
					update: item.update,
					oldData: item.data,
					newData: item.newData
				};
				item.outdated = true;
				item.data = item.newData;
				delete item.update;
				delete item.newData;
				if(willRead) {
					this.invalidItems.splice(i, 1);
					i--;
				}
				if(!multiple)
					return result;
				results.push(result);
				if(this.desc.maxWriteItems && results.length >= this.desc.maxWriteItems)
					break;
			}
		}
		if(multiple)
			return results;
	};

	ItemsStore.prototype._popReadableItem = function(multiple) {
		var results = [];
		for(var i = 0; i < this.invalidItems.length; i++) {
			var id = this.invalidItems[i];
			var item = this.items["_" + id];
			if(item.outdated) {
				var result = {
					id: id,
					oldData: item.data
				};
				this.invalidItems.splice(i, 1);
				i--;
				if(!multiple)
					return result;
				results.push(result);
				if(this.desc.maxReadItems && results.length >= this.desc.maxReadItems)
					break;
			}
		}
		if(multiple)
			return results;
	};


	function applyUpdate(data, update) {
		return Object.assign({}, data, update);
	}

	function mergeUpdates(a, b) {
		return Object.assign({}, a, b);
	}

	function rebaseUpdate(update, oldData, newData) {
		return update;
	}

	function applyNewData(oldData, newData) {
		return newData;
	}

	function applyNewError(oldData, newError) {
		return null;
	}


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("react/lib/update");

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	exports.DefaultRoute = __webpack_require__(17);
	exports.Link = __webpack_require__(18);
	exports.NotFoundRoute = __webpack_require__(19);
	exports.Redirect = __webpack_require__(20);
	exports.Route = __webpack_require__(21);
	exports.RouteHandler = __webpack_require__(22);

	exports.HashLocation = __webpack_require__(23);
	exports.HistoryLocation = __webpack_require__(24);
	exports.RefreshLocation = __webpack_require__(25);

	exports.ImitateBrowserBehavior = __webpack_require__(26);
	exports.ScrollToTopBehavior = __webpack_require__(27);

	exports.Navigation = __webpack_require__(28);
	exports.State = __webpack_require__(29);

	exports.create = __webpack_require__(30);
	exports.run = __webpack_require__(31);

	exports.History = __webpack_require__(32);


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = "<!DOCTYPE html>\n<html>\n<head>\n\t<meta charset=\"utf-8\">\n\t<link rel=\"stylesheet\" href=\"STYLE_URL\">\n</head>\n<body>\n\t<script>\n\t\tvar __StoreData = DATA;\n\t</script>\n\t<div id=\"content\">CONTENT</div>\n\t<script src=\"SCRIPT_URL\"></script>\n</body>\n</html>";

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var StateFromStoreMixin = __webpack_require__(33);
	var RouteHandler = __webpack_require__(8).RouteHandler;

	__webpack_require__(54);

	var Application = React.createClass({displayName: "Application",
		mixins: [StateFromStoreMixin],
		statics: {
			getState: function(stores, params) {
				var transition = stores.Router.getItem("transition");
				return {
					loading: !!transition
				};
			},
		},
		render: function() {
			return React.createElement("div", {className: this.state.loading ? "application loading" : "application"}, 
				this.state.loading ? React.createElement("div", {style: {float: "right"}}, "loading...") : null, 
				React.createElement(RouteHandler, null)
			);
		},
		update: function() {
			var $__0=    this.context,stores=$__0.stores;
			Object.keys(stores).forEach(function(key) {
				stores[key].update();
			});
		}
	});
	module.exports = Application;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var desc = {
		loadComponent: function(callback) {}
	};
	var mixinReactProxy = __webpack_require__(16);
	mixinReactProxy(React, desc);
	module.exports = React.createClass(desc);
	module.exports.Mixin = desc;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var desc = {
		loadComponent: function(callback) {}
	};
	var mixinReactProxy = __webpack_require__(16);
	mixinReactProxy(React, desc);
	module.exports = React.createClass(desc);
	module.exports.Mixin = desc;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var State = __webpack_require__(8).State;
	var Link = __webpack_require__(8).Link;
	var StateFromStoreMixin = __webpack_require__(33);
	var Todo = __webpack_require__(34).Todo;

	var TodoList = React.createClass({displayName: "TodoList",
		mixins: [State, StateFromStoreMixin],
		statics: {
			getState: function(stores, params) {
				var list = stores.TodoList.getItem(params.list);
				return {
					id: params.list,
					list: list,
					items: list && list.map(function(item) {
						if(typeof item === "string")
							return stores.TodoItem.getItem(item);
					}.bind(this)),
					// get more info about the item
					info: stores.TodoList.getItemInfo(params.list)
				};
			},
		},
		getInitialState: function() {
			return {
				newItem: ""
			};
		},
		render: function() {
			var id = this.state.id;
			var list = this.state.list;
			var items = this.state.items;
			var info = this.state.info;
			return React.createElement("div", null, 
				React.createElement("h2", null, "Todolist"), 
				React.createElement(Link, {to: "home"}, "Home"), 
				
					info.error ? React.createElement("div", null, React.createElement("strong", null, info.error.message)) :
					info.available ? this.renderItemsView(id, list, items) :
					React.createElement("div", null, "Fetching from server...")
				
			);
		},
		renderItemsView: function(id, list, items) {
			return React.createElement("ul", null, 
				
					list.map(function(item, idx) {
						if(typeof item === "string") {
							return React.createElement("li", {key: item}, React.createElement(Link, {to: "todoitem", params: {item: item}}, 
								items[idx] ? items[idx].text : ""
							));
						} else {
							// While adding item
							return React.createElement("li", {key: item}, 
								item.text, " ↑"
							);
						}
					}), 
				
				React.createElement("li", null, 
					React.createElement("input", {type: "text", value: this.state.newItem, onChange: function(event) {
						this.setState({newItem: event.target.value});
					}.bind(this)}), 
					React.createElement("button", {onClick: function() {
						Todo.add(id, {
							text: this.state.newItem
						});
						this.setState({newItem: ""});
					}.bind(this)}, "Add")
				)
			);
		}
	});
	module.exports = TodoList;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var State = __webpack_require__(8).State;
	var Link = __webpack_require__(8).Link;
	var StateFromStoreMixin = __webpack_require__(33);
	var Todo = __webpack_require__(34).Todo;

	var TodoItem = React.createClass({displayName: "TodoItem",
		mixins: [State, StateFromStoreMixin],
		statics: {
			getState: function(stores, params) {
				return {
					id: params.item,
					// this is just the data (or undefined when not yet available)
					item: stores.TodoItem.getItem(params.item),
					// this gives more info about the item
					// i. e. updated, outdated, error
					info: stores.TodoItem.getItemInfo(params.item)
				};
			},
		},
		render: function() {
			var id = this.state.id;
			var item = this.state.item;
			var info = this.state.info;
			// item is undefined on initial load
			if(!item) {
				return React.createElement("div", null, "Initial load from server...")
			}
			// We use a special error data for mark errored items
			// see ../mainStoresDescriptions.js
			if(item.error) {
				return React.createElement("div", null, 
					React.createElement("div", null, React.createElement("b", null, item.error)), 
					React.createElement("button", {onClick: function() {
						Todo.reload(id);
					}}, "Reload")
				);
			}
			return React.createElement("div", null, 
				React.createElement("h2", null, "Todoitem \"", item.text, "\""), 
				React.createElement("p", null, React.createElement("input", {type: "text", value: item.text, onChange: function(event) {
					Todo.update(id, {
						text: event.target.value
					});
				}})), 
				 info.updated ? React.createElement("p", null, "Syncing to server...") : info.outdated ? React.createElement("p", null, "Syncing from server...") : null
			)
		}
	});
	module.exports = TodoItem;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var Link = __webpack_require__(8).Link;

	module.exports = React.createClass({displayName: "exports",
		render: function() {
			return React.createElement("div", null, 
				React.createElement("h2", null, "Homepage"), 
				React.createElement("p", null, "This is the homepage."), 
				React.createElement("p", null, "Try to go to a todo list page:"), 
				React.createElement("ul", null, 
					React.createElement("li", null, React.createElement(Link, {to: "todolist", params: {list: "mylist"}}, "mylist")), 
					React.createElement("li", null, React.createElement(Link, {to: "todolist", params: {list: "otherlist"}}, "otherlist"))
				), 
				React.createElement("p", null, "Or try to switch to ", React.createElement(Link, {to: "some-page"}, "some page"), "."), 
				React.createElement("p", null, "Or try to switch to ", React.createElement(Link, {to: "displayname"}, "Display Name"), ".")
			);
		}
	});


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(React, desc) {
		desc.displayName = "ReactProxy";
		desc.render = function() {
			var Component = this.state.component;
			if(Component) {
				return React.createElement(Component, this.props, this.props.children);
			} else if(this.renderUnavailable) {
				return this.renderUnavailable();
			} else {
				return null;
			}
		};
		desc.getInitialState = function() {
			return { component: this.loadComponent() };
		};
		desc.componentDidMount = function() {
			if(!this.state.component) {
				this.loadComponent(function(component) {
					this.setState({ component: component });
				}.bind(this));
			}
		};
	};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var FakeNode = __webpack_require__(40);
	var PropTypes = __webpack_require__(41);

	/**
	 * A <DefaultRoute> component is a special kind of <Route> that
	 * renders when its parent matches but none of its siblings do.
	 * Only one such route may be used at any given level in the
	 * route hierarchy.
	 */
	var DefaultRoute = React.createClass({

	  displayName: 'DefaultRoute',

	  mixins: [ FakeNode ],

	  propTypes: {
	    name: React.PropTypes.string,
	    path: PropTypes.falsy,
	    handler: React.PropTypes.func.isRequired
	  }

	});

	module.exports = DefaultRoute;


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var classSet = __webpack_require__(35);
	var assign = __webpack_require__(36);
	var Navigation = __webpack_require__(28);
	var State = __webpack_require__(29);

	function isLeftClickEvent(event) {
	  return event.button === 0;
	}

	function isModifiedEvent(event) {
	  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
	}

	/**
	 * <Link> components are used to create an <a> element that links to a route.
	 * When that route is active, the link gets an "active" class name (or the
	 * value of its `activeClassName` prop).
	 *
	 * For example, assuming you have the following route:
	 *
	 *   <Route name="showPost" path="/posts/:postID" handler={Post}/>
	 *
	 * You could use the following component to link to that route:
	 *
	 *   <Link to="showPost" params={{ postID: "123" }} />
	 *
	 * In addition to params, links may pass along query string parameters
	 * using the `query` prop.
	 *
	 *   <Link to="showPost" params={{ postID: "123" }} query={{ show:true }}/>
	 */
	var Link = React.createClass({

	  displayName: 'Link',

	  mixins: [ Navigation, State ],

	  propTypes: {
	    activeClassName: React.PropTypes.string.isRequired,
	    to: React.PropTypes.string.isRequired,
	    params: React.PropTypes.object,
	    query: React.PropTypes.object,
	    onClick: React.PropTypes.func
	  },

	  getDefaultProps: function () {
	    return {
	      activeClassName: 'active'
	    };
	  },

	  handleClick: function (event) {
	    var allowTransition = true;
	    var clickResult;

	    if (this.props.onClick)
	      clickResult = this.props.onClick(event);

	    if (isModifiedEvent(event) || !isLeftClickEvent(event))
	      return;

	    if (clickResult === false || event.defaultPrevented === true)
	      allowTransition = false;

	    event.preventDefault();

	    if (allowTransition)
	      this.transitionTo(this.props.to, this.props.params, this.props.query);
	  },

	  /**
	   * Returns the value of the "href" attribute to use on the DOM element.
	   */
	  getHref: function () {
	    return this.makeHref(this.props.to, this.props.params, this.props.query);
	  },

	  /**
	   * Returns the value of the "class" attribute to use on the DOM element, which contains
	   * the value of the activeClassName property when this <Link> is active.
	   */
	  getClassName: function () {
	    var classNames = {};

	    if (this.props.className)
	      classNames[this.props.className] = true;

	    if (this.isActive(this.props.to, this.props.params, this.props.query))
	      classNames[this.props.activeClassName] = true;

	    return classSet(classNames);
	  },

	  render: function () {
	    var props = assign({}, this.props, {
	      href: this.getHref(),
	      className: this.getClassName(),
	      onClick: this.handleClick
	    });

	    return React.DOM.a(props, this.props.children);
	  }

	});

	module.exports = Link;


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var FakeNode = __webpack_require__(40);
	var PropTypes = __webpack_require__(41);

	/**
	 * A <NotFoundRoute> is a special kind of <Route> that
	 * renders when the beginning of its parent's path matches
	 * but none of its siblings do, including any <DefaultRoute>.
	 * Only one such route may be used at any given level in the
	 * route hierarchy.
	 */
	var NotFoundRoute = React.createClass({

	  displayName: 'NotFoundRoute',

	  mixins: [ FakeNode ],

	  propTypes: {
	    name: React.PropTypes.string,
	    path: PropTypes.falsy,
	    handler: React.PropTypes.func.isRequired
	  }

	});

	module.exports = NotFoundRoute;


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var FakeNode = __webpack_require__(40);
	var PropTypes = __webpack_require__(41);

	/**
	 * A <Redirect> component is a special kind of <Route> that always
	 * redirects to another route when it matches.
	 */
	var Redirect = React.createClass({

	  displayName: 'Redirect',

	  mixins: [ FakeNode ],

	  propTypes: {
	    path: React.PropTypes.string,
	    from: React.PropTypes.string, // Alias for path.
	    to: React.PropTypes.string,
	    handler: PropTypes.falsy
	  }

	});

	module.exports = Redirect;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var FakeNode = __webpack_require__(40);

	/**
	 * <Route> components specify components that are rendered to the page when the
	 * URL matches a given pattern.
	 *
	 * Routes are arranged in a nested tree structure. When a new URL is requested,
	 * the tree is searched depth-first to find a route whose path matches the URL.
	 * When one is found, all routes in the tree that lead to it are considered
	 * "active" and their components are rendered into the DOM, nested in the same
	 * order as they are in the tree.
	 *
	 * The preferred way to configure a router is using JSX. The XML-like syntax is
	 * a great way to visualize how routes are laid out in an application.
	 *
	 *   var routes = [
	 *     <Route handler={App}>
	 *       <Route name="login" handler={Login}/>
	 *       <Route name="logout" handler={Logout}/>
	 *       <Route name="about" handler={About}/>
	 *     </Route>
	 *   ];
	 *   
	 *   Router.run(routes, function (Handler) {
	 *     React.render(<Handler/>, document.body);
	 *   });
	 *
	 * Handlers for Route components that contain children can render their active
	 * child route using a <RouteHandler> element.
	 *
	 *   var App = React.createClass({
	 *     render: function () {
	 *       return (
	 *         <div class="application">
	 *           <RouteHandler/>
	 *         </div>
	 *       );
	 *     }
	 *   });
	 */
	var Route = React.createClass({

	  displayName: 'Route',

	  mixins: [ FakeNode ],

	  propTypes: {
	    name: React.PropTypes.string,
	    path: React.PropTypes.string,
	    handler: React.PropTypes.func.isRequired,
	    ignoreScrollBehavior: React.PropTypes.bool
	  }

	});

	module.exports = Route;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var RouteHandlerMixin = __webpack_require__(42);

	/**
	 * A <RouteHandler> component renders the active child route handler
	 * when routes are nested.
	 */
	var RouteHandler = React.createClass({

	  displayName: 'RouteHandler',

	  mixins: [RouteHandlerMixin],

	  getDefaultProps: function () {
	    return {
	      ref: '__routeHandler__'
	    };
	  },

	  render: function () {
	    return this.getRouteHandler();
	  }

	});

	module.exports = RouteHandler;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var LocationActions = __webpack_require__(43);
	var History = __webpack_require__(32);
	var Path = __webpack_require__(44);

	/**
	 * Returns the current URL path from the `hash` portion of the URL, including
	 * query string.
	 */
	function getHashPath() {
	  return Path.decode(
	    // We can't use window.location.hash here because it's not
	    // consistent across browsers - Firefox will pre-decode it!
	    window.location.href.split('#')[1] || ''
	  );
	}

	var _actionType;

	function ensureSlash() {
	  var path = getHashPath();

	  if (path.charAt(0) === '/')
	    return true;

	  HashLocation.replace('/' + path);

	  return false;
	}

	var _changeListeners = [];

	function notifyChange(type) {
	  if (type === LocationActions.PUSH)
	    History.length += 1;

	  var change = {
	    path: getHashPath(),
	    type: type
	  };

	  _changeListeners.forEach(function (listener) {
	    listener(change);
	  });
	}

	var _isListening = false;

	function onHashChange() {
	  if (ensureSlash()) {
	    // If we don't have an _actionType then all we know is the hash
	    // changed. It was probably caused by the user clicking the Back
	    // button, but may have also been the Forward button or manual
	    // manipulation. So just guess 'pop'.
	    notifyChange(_actionType || LocationActions.POP);
	    _actionType = null;
	  }
	}

	/**
	 * A Location that uses `window.location.hash`.
	 */
	var HashLocation = {

	  addChangeListener: function (listener) {
	    _changeListeners.push(listener);

	    // Do this BEFORE listening for hashchange.
	    ensureSlash();

	    if (_isListening)
	      return;

	    if (window.addEventListener) {
	      window.addEventListener('hashchange', onHashChange, false);
	    } else {
	      window.attachEvent('onhashchange', onHashChange);
	    }

	    _isListening = true;
	  },

	  removeChangeListener: function(listener) {
	    for (var i = 0, l = _changeListeners.length; i < l; i ++) {
	      if (_changeListeners[i] === listener) {
	        _changeListeners.splice(i, 1);
	        break;
	      }
	    }

	    if (window.removeEventListener) {
	      window.removeEventListener('hashchange', onHashChange, false);
	    } else {
	      window.removeEvent('onhashchange', onHashChange);
	    }

	    if (_changeListeners.length === 0)
	      _isListening = false;
	  },



	  push: function (path) {
	    _actionType = LocationActions.PUSH;
	    window.location.hash = Path.encode(path);
	  },

	  replace: function (path) {
	    _actionType = LocationActions.REPLACE;
	    window.location.replace(window.location.pathname + '#' + Path.encode(path));
	  },

	  pop: function () {
	    _actionType = LocationActions.POP;
	    History.back();
	  },

	  getCurrentPath: getHashPath,

	  toString: function () {
	    return '<HashLocation>';
	  }

	};

	module.exports = HashLocation;


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var LocationActions = __webpack_require__(43);
	var History = __webpack_require__(32);
	var Path = __webpack_require__(44);

	/**
	 * Returns the current URL path from `window.location`, including query string.
	 */
	function getWindowPath() {
	  return Path.decode(
	    window.location.pathname + window.location.search
	  );
	}

	var _changeListeners = [];

	function notifyChange(type) {
	  var change = {
	    path: getWindowPath(),
	    type: type
	  };

	  _changeListeners.forEach(function (listener) {
	    listener(change);
	  });
	}

	var _isListening = false;

	function onPopState() {
	  notifyChange(LocationActions.POP);
	}

	/**
	 * A Location that uses HTML5 history.
	 */
	var HistoryLocation = {

	  addChangeListener: function (listener) {
	    _changeListeners.push(listener);

	    if (_isListening)
	      return;

	    if (window.addEventListener) {
	      window.addEventListener('popstate', onPopState, false);
	    } else {
	      window.attachEvent('popstate', onPopState);
	    }

	    _isListening = true;
	  },

	  removeChangeListener: function(listener) {
	    for (var i = 0, l = _changeListeners.length; i < l; i ++) {
	      if (_changeListeners[i] === listener) {
	        _changeListeners.splice(i, 1);
	        break;
	      }
	    }

	    if (window.addEventListener) {
	      window.removeEventListener('popstate', onPopState);
	    } else {
	      window.removeEvent('popstate', onPopState);
	    }

	    if (_changeListeners.length === 0)
	      _isListening = false;
	  },



	  push: function (path) {
	    window.history.pushState({ path: path }, '', Path.encode(path));
	    History.length += 1;
	    notifyChange(LocationActions.PUSH);
	  },

	  replace: function (path) {
	    window.history.replaceState({ path: path }, '', Path.encode(path));
	    notifyChange(LocationActions.REPLACE);
	  },

	  pop: History.back,

	  getCurrentPath: getWindowPath,

	  toString: function () {
	    return '<HistoryLocation>';
	  }

	};

	module.exports = HistoryLocation;


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var HistoryLocation = __webpack_require__(24);
	var History = __webpack_require__(32);
	var Path = __webpack_require__(44);

	/**
	 * A Location that uses full page refreshes. This is used as
	 * the fallback for HistoryLocation in browsers that do not
	 * support the HTML5 history API.
	 */
	var RefreshLocation = {

	  push: function (path) {
	    window.location = Path.encode(path);
	  },

	  replace: function (path) {
	    window.location.replace(Path.encode(path));
	  },

	  pop: History.back,

	  getCurrentPath: HistoryLocation.getCurrentPath,

	  toString: function () {
	    return '<RefreshLocation>';
	  }

	};

	module.exports = RefreshLocation;


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var LocationActions = __webpack_require__(43);

	/**
	 * A scroll behavior that attempts to imitate the default behavior
	 * of modern browsers.
	 */
	var ImitateBrowserBehavior = {

	  updateScrollPosition: function (position, actionType) {
	    switch (actionType) {
	      case LocationActions.PUSH:
	      case LocationActions.REPLACE:
	        window.scrollTo(0, 0);
	        break;
	      case LocationActions.POP:
	        if (position) {
	          window.scrollTo(position.x, position.y);
	        } else {
	          window.scrollTo(0, 0);
	        }
	        break;
	    }
	  }

	};

	module.exports = ImitateBrowserBehavior;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A scroll behavior that always scrolls to the top of the page
	 * after a transition.
	 */
	var ScrollToTopBehavior = {

	  updateScrollPosition: function () {
	    window.scrollTo(0, 0);
	  }

	};

	module.exports = ScrollToTopBehavior;


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);

	/**
	 * A mixin for components that modify the URL.
	 *
	 * Example:
	 *
	 *   var MyLink = React.createClass({
	 *     mixins: [ Router.Navigation ],
	 *     handleClick: function (event) {
	 *       event.preventDefault();
	 *       this.transitionTo('aRoute', { the: 'params' }, { the: 'query' });
	 *     },
	 *     render: function () {
	 *       return (
	 *         <a onClick={this.handleClick}>Click me!</a>
	 *       );
	 *     }
	 *   });
	 */
	var Navigation = {

	  contextTypes: {
	    makePath: React.PropTypes.func.isRequired,
	    makeHref: React.PropTypes.func.isRequired,
	    transitionTo: React.PropTypes.func.isRequired,
	    replaceWith: React.PropTypes.func.isRequired,
	    goBack: React.PropTypes.func.isRequired
	  },

	  /**
	   * Returns an absolute URL path created from the given route
	   * name, URL parameters, and query values.
	   */
	  makePath: function (to, params, query) {
	    return this.context.makePath(to, params, query);
	  },

	  /**
	   * Returns a string that may safely be used as the href of a
	   * link to the route with the given name.
	   */
	  makeHref: function (to, params, query) {
	    return this.context.makeHref(to, params, query);
	  },

	  /**
	   * Transitions to the URL specified in the arguments by pushing
	   * a new URL onto the history stack.
	   */
	  transitionTo: function (to, params, query) {
	    this.context.transitionTo(to, params, query);
	  },

	  /**
	   * Transitions to the URL specified in the arguments by replacing
	   * the current URL in the history stack.
	   */
	  replaceWith: function (to, params, query) {
	    this.context.replaceWith(to, params, query);
	  },

	  /**
	   * Transitions to the previous URL.
	   */
	  goBack: function () {
	    this.context.goBack();
	  }

	};

	module.exports = Navigation;


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);

	/**
	 * A mixin for components that need to know the path, routes, URL
	 * params and query that are currently active.
	 *
	 * Example:
	 *
	 *   var AboutLink = React.createClass({
	 *     mixins: [ Router.State ],
	 *     render: function () {
	 *       var className = this.props.className;
	 *   
	 *       if (this.isActive('about'))
	 *         className += ' is-active';
	 *   
	 *       return React.DOM.a({ className: className }, this.props.children);
	 *     }
	 *   });
	 */
	var State = {

	  contextTypes: {
	    getCurrentPath: React.PropTypes.func.isRequired,
	    getCurrentRoutes: React.PropTypes.func.isRequired,
	    getCurrentPathname: React.PropTypes.func.isRequired,
	    getCurrentParams: React.PropTypes.func.isRequired,
	    getCurrentQuery: React.PropTypes.func.isRequired,
	    isActive: React.PropTypes.func.isRequired
	  },

	  /**
	   * Returns the current URL path.
	   */
	  getPath: function () {
	    return this.context.getCurrentPath();
	  },

	  /**
	   * Returns an array of the routes that are currently active.
	   */
	  getRoutes: function () {
	    return this.context.getCurrentRoutes();
	  },

	  /**
	   * Returns the current URL path without the query string.
	   */
	  getPathname: function () {
	    return this.context.getCurrentPathname();
	  },

	  /**
	   * Returns an object of the URL params that are currently active.
	   */
	  getParams: function () {
	    return this.context.getCurrentParams();
	  },

	  /**
	   * Returns an object of the query params that are currently active.
	   */
	  getQuery: function () {
	    return this.context.getCurrentQuery();
	  },

	  /**
	   * A helper method to determine if a given route, params, and query
	   * are active.
	   */
	  isActive: function (to, params, query) {
	    return this.context.isActive(to, params, query);
	  }

	};

	module.exports = State;


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	/* jshint -W058 */
	var React = __webpack_require__(1);
	var warning = __webpack_require__(37);
	var invariant = __webpack_require__(38);
	var canUseDOM = __webpack_require__(39).canUseDOM;
	var ImitateBrowserBehavior = __webpack_require__(26);
	var RouteHandler = __webpack_require__(22);
	var LocationActions = __webpack_require__(43);
	var HashLocation = __webpack_require__(23);
	var HistoryLocation = __webpack_require__(24);
	var RefreshLocation = __webpack_require__(25);
	var NavigationContext = __webpack_require__(45);
	var StateContext = __webpack_require__(46);
	var Scrolling = __webpack_require__(47);
	var createRoutesFromChildren = __webpack_require__(48);
	var supportsHistory = __webpack_require__(49);
	var Transition = __webpack_require__(50);
	var PropTypes = __webpack_require__(41);
	var Redirect = __webpack_require__(51);
	var History = __webpack_require__(32);
	var Cancellation = __webpack_require__(52);
	var Path = __webpack_require__(44);

	/**
	 * The default location for new routers.
	 */
	var DEFAULT_LOCATION = canUseDOM ? HashLocation : '/';

	/**
	 * The default scroll behavior for new routers.
	 */
	var DEFAULT_SCROLL_BEHAVIOR = canUseDOM ? ImitateBrowserBehavior : null;

	/**
	 * The default error handler for new routers.
	 */
	function defaultErrorHandler(error) {
	  // Throw so we don't silently swallow async errors.
	  throw error; // This error probably originated in a transition hook.
	}

	/**
	 * The default aborted transition handler for new routers.
	 */
	function defaultAbortHandler(abortReason, location) {
	  if (typeof location === 'string')
	    throw new Error('Unhandled aborted transition! Reason: ' + abortReason);

	  if (abortReason instanceof Cancellation) {
	    return;
	  } else if (abortReason instanceof Redirect) {
	    location.replace(this.makePath(abortReason.to, abortReason.params, abortReason.query));
	  } else {
	    location.pop();
	  }
	}

	function findMatch(pathname, routes, defaultRoute, notFoundRoute) {
	  var match, route, params;

	  for (var i = 0, len = routes.length; i < len; ++i) {
	    route = routes[i];

	    // Check the subtree first to find the most deeply-nested match.
	    match = findMatch(pathname, route.childRoutes, route.defaultRoute, route.notFoundRoute);

	    if (match != null) {
	      match.routes.unshift(route);
	      return match;
	    }

	    // No routes in the subtree matched, so check this route.
	    params = Path.extractParams(route.path, pathname);

	    if (params)
	      return createMatch(route, params);
	  }

	  // No routes matched, so try the default route if there is one.
	  if (defaultRoute && (params = Path.extractParams(defaultRoute.path, pathname)))
	    return createMatch(defaultRoute, params);

	  // Last attempt: does the "not found" route match?
	  if (notFoundRoute && (params = Path.extractParams(notFoundRoute.path, pathname)))
	    return createMatch(notFoundRoute, params);

	  return match;
	}

	function createMatch(route, params) {
	  return { routes: [ route ], params: params };
	}

	function hasProperties(object, properties) {
	  for (var propertyName in properties)
	    if (properties.hasOwnProperty(propertyName) && object[propertyName] !== properties[propertyName])
	      return false;

	  return true;
	}

	function hasMatch(routes, route, prevParams, nextParams, prevQuery, nextQuery) {
	  return routes.some(function (r) {
	    if (r !== route)
	      return false;

	    var paramNames = route.paramNames;
	    var paramName;

	    // Ensure that all params the route cares about did not change.
	    for (var i = 0, len = paramNames.length; i < len; ++i) {
	      paramName = paramNames[i];

	      if (nextParams[paramName] !== prevParams[paramName])
	        return false;
	    }

	    // Ensure the query hasn't changed.
	    return hasProperties(prevQuery, nextQuery) && hasProperties(nextQuery, prevQuery);
	  });
	}

	/**
	 * Creates and returns a new router using the given options. A router
	 * is a ReactComponent class that knows how to react to changes in the
	 * URL and keep the contents of the page in sync.
	 *
	 * Options may be any of the following:
	 *
	 * - routes           (required) The route config
	 * - location         The location to use. Defaults to HashLocation when
	 *                    the DOM is available, "/" otherwise
	 * - scrollBehavior   The scroll behavior to use. Defaults to ImitateBrowserBehavior
	 *                    when the DOM is available, null otherwise
	 * - onError          A function that is used to handle errors
	 * - onAbort          A function that is used to handle aborted transitions
	 *
	 * When rendering in a server-side environment, the location should simply
	 * be the URL path that was used in the request, including the query string.
	 */
	function createRouter(options) {
	  options = options || {};

	  if (typeof options === 'function') {
	    options = { routes: options }; // Router.create(<Route>)
	  } else if (Array.isArray(options)) {
	    options = { routes: options }; // Router.create([ <Route>, <Route> ])
	  }

	  var routes = [];
	  var namedRoutes = {};
	  var components = [];
	  var location = options.location || DEFAULT_LOCATION;
	  var scrollBehavior = options.scrollBehavior || DEFAULT_SCROLL_BEHAVIOR;
	  var onError = options.onError || defaultErrorHandler;
	  var onAbort = options.onAbort || defaultAbortHandler;
	  var state = {};
	  var nextState = {};
	  var pendingTransition = null;

	  function updateState() {
	    state = nextState;
	    nextState = {};
	  }

	  if (typeof location === 'string') {
	    warning(
	      !canUseDOM || process.env.NODE_ENV === 'test',
	      'You should not use a static location in a DOM environment because ' +
	      'the router will not be kept in sync with the current URL'
	    );
	  } else {
	    invariant(
	      canUseDOM,
	      'You cannot use %s without a DOM',
	      location
	    );
	  }

	  // Automatically fall back to full page refreshes in
	  // browsers that don't support the HTML history API.
	  if (location === HistoryLocation && !supportsHistory())
	    location = RefreshLocation;

	  var router = React.createClass({

	    displayName: 'Router',

	    mixins: [ NavigationContext, StateContext, Scrolling ],

	    statics: {

	      defaultRoute: null,
	      notFoundRoute: null,

	      /**
	       * Adds routes to this router from the given children object (see ReactChildren).
	       */
	      addRoutes: function (children) {
	        routes.push.apply(routes, createRoutesFromChildren(children, this, namedRoutes));
	      },

	      /**
	       * Returns an absolute URL path created from the given route
	       * name, URL parameters, and query.
	       */
	      makePath: function (to, params, query) {
	        var path;
	        if (Path.isAbsolute(to)) {
	          path = Path.normalize(to);
	        } else {
	          var route = namedRoutes[to];

	          invariant(
	            route,
	            'Unable to find <Route name="%s">',
	            to
	          );

	          path = route.path;
	        }

	        return Path.withQuery(Path.injectParams(path, params), query);
	      },

	      /**
	       * Returns a string that may safely be used as the href of a link
	       * to the route with the given name, URL parameters, and query.
	       */
	      makeHref: function (to, params, query) {
	        var path = this.makePath(to, params, query);
	        return (location === HashLocation) ? '#' + path : path;
	      },

	      /**
	       * Transitions to the URL specified in the arguments by pushing
	       * a new URL onto the history stack.
	       */
	      transitionTo: function (to, params, query) {
	        invariant(
	          typeof location !== 'string',
	          'You cannot use transitionTo with a static location'
	        );

	        var path = this.makePath(to, params, query);

	        if (pendingTransition) {
	          // Replace so pending location does not stay in history.
	          location.replace(path);
	        } else {
	          location.push(path);
	        }
	      },

	      /**
	       * Transitions to the URL specified in the arguments by replacing
	       * the current URL in the history stack.
	       */
	      replaceWith: function (to, params, query) {
	        invariant(
	          typeof location !== 'string',
	          'You cannot use replaceWith with a static location'
	        );

	        location.replace(this.makePath(to, params, query));
	      },

	      /**
	       * Transitions to the previous URL if one is available. Returns true if the
	       * router was able to go back, false otherwise.
	       *
	       * Note: The router only tracks history entries in your application, not the
	       * current browser session, so you can safely call this function without guarding
	       * against sending the user back to some other site. However, when using
	       * RefreshLocation (which is the fallback for HistoryLocation in browsers that
	       * don't support HTML5 history) this method will *always* send the client back
	       * because we cannot reliably track history length.
	       */
	      goBack: function () {
	        invariant(
	          typeof location !== 'string',
	          'You cannot use goBack with a static location'
	        );

	        if (History.length > 1 || location === RefreshLocation) {
	          location.pop();
	          return true;
	        }

	        warning(false, 'goBack() was ignored because there is no router history');

	        return false;
	      },

	      /**
	       * Performs a match of the given pathname against this router and returns an object
	       * with the { routes, params } that match. Returns null if no match can be made.
	       */
	      match: function (pathname) {
	        return findMatch(pathname, routes, this.defaultRoute, this.notFoundRoute) || null;
	      },

	      /**
	       * Performs a transition to the given path and calls callback(error, abortReason)
	       * when the transition is finished. If both arguments are null the router's state
	       * was updated. Otherwise the transition did not complete.
	       *
	       * In a transition, a router first determines which routes are involved by beginning
	       * with the current route, up the route tree to the first parent route that is shared
	       * with the destination route, and back down the tree to the destination route. The
	       * willTransitionFrom hook is invoked on all route handlers we're transitioning away
	       * from, in reverse nesting order. Likewise, the willTransitionTo hook is invoked on
	       * all route handlers we're transitioning to.
	       *
	       * Both willTransitionFrom and willTransitionTo hooks may either abort or redirect the
	       * transition. To resolve asynchronously, they may use transition.wait(promise). If no
	       * hooks wait, the transition is fully synchronous.
	       */
	      dispatch: function (path, action, callback) {
	        if (pendingTransition) {
	          pendingTransition.abort(new Cancellation);
	          pendingTransition = null;
	        }

	        var prevPath = state.path;
	        if (prevPath === path)
	          return; // Nothing to do!

	        // Record the scroll position as early as possible to
	        // get it before browsers try update it automatically.
	        if (prevPath && action !== LocationActions.REPLACE)
	          this.recordScrollPosition(prevPath);

	        var pathname = Path.withoutQuery(path);
	        var match = this.match(pathname);

	        warning(
	          match != null,
	          'No route matches path "%s". Make sure you have <Route path="%s"> somewhere in your routes',
	          path, path
	        );

	        if (match == null)
	          match = {};

	        var prevRoutes = state.routes || [];
	        var prevParams = state.params || {};
	        var prevQuery = state.query || {};

	        var nextRoutes = match.routes || [];
	        var nextParams = match.params || {};
	        var nextQuery = Path.extractQuery(path) || {};

	        var fromRoutes, toRoutes;
	        if (prevRoutes.length) {
	          fromRoutes = prevRoutes.filter(function (route) {
	            return !hasMatch(nextRoutes, route, prevParams, nextParams, prevQuery, nextQuery);
	          });

	          toRoutes = nextRoutes.filter(function (route) {
	            return !hasMatch(prevRoutes, route, prevParams, nextParams, prevQuery, nextQuery);
	          });
	        } else {
	          fromRoutes = [];
	          toRoutes = nextRoutes;
	        }

	        var transition = new Transition(path, this.replaceWith.bind(this, path));
	        pendingTransition = transition;

	        transition.from(fromRoutes, components, function (error) {
	          if (error || transition.isAborted)
	            return callback.call(router, error, transition);

	          transition.to(toRoutes, nextParams, nextQuery, function (error) {
	            if (error || transition.isAborted)
	              return callback.call(router, error, transition);

	            nextState.path = path;
	            nextState.action = action;
	            nextState.pathname = pathname;
	            nextState.routes = nextRoutes;
	            nextState.params = nextParams;
	            nextState.query = nextQuery;

	            callback.call(router, null, transition);
	          });
	        });
	      },

	      /**
	       * Starts this router and calls callback(router, state) when the route changes.
	       *
	       * If the router's location is static (i.e. a URL path in a server environment)
	       * the callback is called only once. Otherwise, the location should be one of the
	       * Router.*Location objects (e.g. Router.HashLocation or Router.HistoryLocation).
	       */
	      run: function (callback) {
	        var dispatchHandler = function (error, transition) {
	          pendingTransition = null;

	          if (error) {
	            onError.call(router, error);
	          } else if (transition.isAborted) {
	            onAbort.call(router, transition.abortReason, location);
	          } else {
	            callback.call(router, router, nextState);
	          }
	        };

	        if (typeof location === 'string') {
	          router.dispatch(location, null, dispatchHandler);
	        } else {
	          // Listen for changes to the location.
	          var changeListener = function (change) {
	            router.dispatch(change.path, change.type, dispatchHandler);
	          };

	          if (location.addChangeListener)
	            location.addChangeListener(changeListener);

	          // Bootstrap using the current path.
	          router.dispatch(location.getCurrentPath(), null, dispatchHandler);
	        }
	      },

	      teardown: function() {
	        location.removeChangeListener(this.changeListener);
	      }

	    },

	    propTypes: {
	      children: PropTypes.falsy
	    },

	    getLocation: function () {
	      return location;
	    },

	    getScrollBehavior: function () {
	      return scrollBehavior;
	    },

	    getRouteAtDepth: function (depth) {
	      var routes = this.state.routes;
	      return routes && routes[depth];
	    },

	    getRouteComponents: function () {
	      return components;
	    },

	    getInitialState: function () {
	      updateState();
	      return state;
	    },

	    componentWillReceiveProps: function () {
	      updateState();
	      this.setState(state);
	    },

	    componentWillUnmount: function() {
	      router.teardown();
	    },

	    render: function () {
	      return this.getRouteAtDepth(0) ? React.createElement(RouteHandler, this.props) : null;
	    },

	    childContextTypes: {
	      getRouteAtDepth: React.PropTypes.func.isRequired,
	      getRouteComponents: React.PropTypes.func.isRequired,
	      routeHandlers: React.PropTypes.array.isRequired
	    },

	    getChildContext: function () {
	      return {
	        getRouteComponents: this.getRouteComponents,
	        getRouteAtDepth: this.getRouteAtDepth,
	        routeHandlers: [ this ]
	      };
	    }

	  });

	  if (options.routes)
	    router.addRoutes(options.routes);

	  return router;
	}

	module.exports = createRouter;


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var createRouter = __webpack_require__(30);

	/**
	 * A high-level convenience method that creates, configures, and
	 * runs a router in one shot. The method signature is:
	 *
	 *   Router.run(routes[, location ], callback);
	 *
	 * Using `window.location.hash` to manage the URL, you could do:
	 *
	 *   Router.run(routes, function (Handler) {
	 *     React.render(<Handler/>, document.body);
	 *   });
	 * 
	 * Using HTML5 history and a custom "cursor" prop:
	 * 
	 *   Router.run(routes, Router.HistoryLocation, function (Handler) {
	 *     React.render(<Handler cursor={cursor}/>, document.body);
	 *   });
	 *
	 * Returns the newly created router.
	 *
	 * Note: If you need to specify further options for your router such
	 * as error/abort handling or custom scroll behavior, use Router.create
	 * instead.
	 *
	 *   var router = Router.create(options);
	 *   router.run(function (Handler) {
	 *     // ...
	 *   });
	 */
	function runRouter(routes, location, callback) {
	  if (typeof location === 'function') {
	    callback = location;
	    location = null;
	  }

	  var router = createRouter({
	    routes: routes,
	    location: location
	  });

	  router.run(callback);

	  return router;
	}

	module.exports = runRouter;


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(38);
	var canUseDOM = __webpack_require__(39).canUseDOM;

	var History = {

	  /**
	   * Sends the browser back one entry in the history.
	   */
	  back: function () {
	    invariant(
	      canUseDOM,
	      'Cannot use History.back without a DOM'
	    );

	    // Do this first so that History.length will
	    // be accurate in location change listeners.
	    History.length -= 1;

	    window.history.back();
	  },

	  /**
	   * The current number of entries in the history.
	   */
	  length: 1

	};

	module.exports = History;


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var React = __webpack_require__(1);
	var ItemsStoreLease = __webpack_require__(55);
	var ItemsStoreFetcher = __webpack_require__(56);
	var ReactUpdates = __webpack_require__(53);

	function makeStores(stores, addDepenency) {
		if(!addDepenency) {
			return stores;
		}
		return Object.keys(stores).reduce(function(obj, key) {
			obj[key] = {
				getItem: function(id) {
					addDepenency(stores[key], id);
					return stores[key].getItem(id);
				},
				getItemInfo: function(id) {
					addDepenency(stores[key], id);
					return stores[key].getItemInfo(id);
				},
				isItemAvailable: function(id) {
					addDepenency(stores[key], id);
					return stores[key].isItemAvailable(id);
				},
				isItemUpToDate: function(id) {
					addDepenency(stores[key], id);
					return stores[key].isItemUpToDate(id);
				},
			};
			return obj;
		}, {});
	}

	module.exports = {
		statics: {
			chargeStores: function(stores, params, callback) {
				ItemsStoreFetcher.fetch(function(addDepenency) {
					this.getState(makeStores(stores, addDepenency), params);
				}.bind(this), callback);
			}
		},
		componentWillUnmount: function() {
			if(this.itemsStoreLease) this.itemsStoreLease.close();
		},
		getInitialState: function() {
			var This = this.constructor;
			if(!this.itemsStoreLease) this.itemsStoreLease = new ItemsStoreLease();
			return this.itemsStoreLease.capture(function(addDepenency) {
				return This.getState(makeStores(this.context.stores, addDepenency), this.getParams && this.getParams());
			}.bind(this), this.StateFromStoresMixin_onUpdate);
		},
		StateFromStoresMixin_onUpdate: function() {
			if(this.StateFromStoresMixin_updateScheduled)
				return;
			this.StateFromStoresMixin_updateScheduled = true;
			ReactUpdates.asap(this.StateFromStoresMixin_doUpdate);
		},
		StateFromStoresMixin_doUpdate: function() {
			this.StateFromStoresMixin_updateScheduled = false;
			if(!this.isMounted()) return;
			var This = this.constructor;
			this.setState(this.itemsStoreLease.capture(function(addDepenency) {
				return This.getState(makeStores(this.context.stores, addDepenency), this.getParams && this.getParams());
			}.bind(this), this.StateFromStoresMixin_onUpdate));
		},
		componentWillReceiveProps: function(newProps, newContext) {
			if(!newContext) return;
			var This = this.constructor;
			this.setState(this.itemsStoreLease.capture(function(addDepenency) {
				return This.getState(makeStores(newContext.stores, addDepenency), newContext.getCurrentParams && newContext.getCurrentParams());
			}.bind(this), this.StateFromStoresMixin_onUpdate));
		},
		contextTypes: {
			stores: React.PropTypes.object.isRequired
		}
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var Actions = __webpack_require__(57);

	// All the actions of the application

	exports.Todo = Actions.create([
		"add",
		"update",
		"reload"
	]);


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("react/lib/cx");

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("react/lib/Object.assign");

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("react/lib/warning");

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("react/lib/invariant");

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("react/lib/ExecutionEnvironment");

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(38);

	var FakeNode = {

	  render: function () {
	    invariant(
	      false,
	      '%s elements should not be rendered',
	      this.constructor.displayName
	    );
	  }

	};

	module.exports = FakeNode;


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var PropTypes = {

	  /**
	   * Requires that the value of a prop be falsy.
	   */
	  falsy: function (props, propName, componentName) {
	    if (props[propName])
	      return new Error('<' + componentName + '> may not have a "' + propName + '" prop');
	  }

	};

	module.exports = PropTypes;


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);

	module.exports = {
	  contextTypes: {
	    getRouteAtDepth: React.PropTypes.func.isRequired,
	    getRouteComponents: React.PropTypes.func.isRequired,
	    routeHandlers: React.PropTypes.array.isRequired
	  },

	  childContextTypes: {
	    routeHandlers: React.PropTypes.array.isRequired
	  },

	  getChildContext: function () {
	    return {
	      routeHandlers: this.context.routeHandlers.concat([ this ])
	    };
	  },

	  getRouteDepth: function () {
	    return this.context.routeHandlers.length - 1;
	  },

	  componentDidMount: function () {
	    this._updateRouteComponent();
	  },

	  componentDidUpdate: function () {
	    this._updateRouteComponent();
	  },

	  _updateRouteComponent: function () {
	    var depth = this.getRouteDepth();
	    var components = this.context.getRouteComponents();
	    components[depth] = this.refs[this.props.ref || '__routeHandler__'];
	  },

	  getRouteHandler: function (props) {
	    var route = this.context.getRouteAtDepth(this.getRouteDepth());
	    return route ? React.createElement(route.handler, props || this.props) : null;
	  }
	};

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Actions that modify the URL.
	 */
	var LocationActions = {

	  /**
	   * Indicates a new location is being pushed to the history stack.
	   */
	  PUSH: 'push',

	  /**
	   * Indicates the current location should be replaced.
	   */
	  REPLACE: 'replace',

	  /**
	   * Indicates the most recent entry should be removed from the history stack.
	   */
	  POP: 'pop'

	};

	module.exports = LocationActions;


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(38);
	var merge = __webpack_require__(62).merge;
	var qs = __webpack_require__(63);

	var paramCompileMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|[*.()\[\]\\+|{}^$]/g;
	var paramInjectMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$?]*[?]?)|[*]/g;
	var paramInjectTrailingSlashMatcher = /\/\/\?|\/\?/g;
	var queryMatcher = /\?(.+)/;

	var _compiledPatterns = {};

	function compilePattern(pattern) {
	  if (!(pattern in _compiledPatterns)) {
	    var paramNames = [];
	    var source = pattern.replace(paramCompileMatcher, function (match, paramName) {
	      if (paramName) {
	        paramNames.push(paramName);
	        return '([^/?#]+)';
	      } else if (match === '*') {
	        paramNames.push('splat');
	        return '(.*?)';
	      } else {
	        return '\\' + match;
	      }
	    });

	    _compiledPatterns[pattern] = {
	      matcher: new RegExp('^' + source + '$', 'i'),
	      paramNames: paramNames
	    };
	  }

	  return _compiledPatterns[pattern];
	}

	var Path = {

	  /**
	   * Safely decodes special characters in the given URL path.
	   */
	  decode: function (path) {
	    return decodeURI(path.replace(/\+/g, ' '));
	  },

	  /**
	   * Safely encodes special characters in the given URL path.
	   */
	  encode: function (path) {
	    return encodeURI(path).replace(/%20/g, '+');
	  },

	  /**
	   * Returns an array of the names of all parameters in the given pattern.
	   */
	  extractParamNames: function (pattern) {
	    return compilePattern(pattern).paramNames;
	  },

	  /**
	   * Extracts the portions of the given URL path that match the given pattern
	   * and returns an object of param name => value pairs. Returns null if the
	   * pattern does not match the given path.
	   */
	  extractParams: function (pattern, path) {
	    var object = compilePattern(pattern);
	    var match = path.match(object.matcher);

	    if (!match)
	      return null;

	    var params = {};

	    object.paramNames.forEach(function (paramName, index) {
	      params[paramName] = match[index + 1];
	    });

	    return params;
	  },

	  /**
	   * Returns a version of the given route path with params interpolated. Throws
	   * if there is a dynamic segment of the route path for which there is no param.
	   */
	  injectParams: function (pattern, params) {
	    params = params || {};

	    var splatIndex = 0;

	    return pattern.replace(paramInjectMatcher, function (match, paramName) {
	      paramName = paramName || 'splat';

	      // If param is optional don't check for existence
	      if (paramName.slice(-1) !== '?') {
	        invariant(
	          params[paramName] != null,
	          'Missing "' + paramName + '" parameter for path "' + pattern + '"'
	        );
	      } else {
	        paramName = paramName.slice(0, -1);

	        if (params[paramName] == null)
	          return '';
	      }

	      var segment;
	      if (paramName === 'splat' && Array.isArray(params[paramName])) {
	        segment = params[paramName][splatIndex++];

	        invariant(
	          segment != null,
	          'Missing splat # ' + splatIndex + ' for path "' + pattern + '"'
	        );
	      } else {
	        segment = params[paramName];
	      }

	      return segment;
	    }).replace(paramInjectTrailingSlashMatcher, '/');
	  },

	  /**
	   * Returns an object that is the result of parsing any query string contained
	   * in the given path, null if the path contains no query string.
	   */
	  extractQuery: function (path) {
	    var match = path.match(queryMatcher);
	    return match && qs.parse(match[1]);
	  },

	  /**
	   * Returns a version of the given path without the query string.
	   */
	  withoutQuery: function (path) {
	    return path.replace(queryMatcher, '');
	  },

	  /**
	   * Returns a version of the given path with the parameters in the given
	   * query merged into the query string.
	   */
	  withQuery: function (path, query) {
	    var existingQuery = Path.extractQuery(path);

	    if (existingQuery)
	      query = query ? merge(existingQuery, query) : existingQuery;

	    var queryString = query && qs.stringify(query);

	    if (queryString)
	      return Path.withoutQuery(path) + '?' + queryString;

	    return path;
	  },

	  /**
	   * Returns true if the given path is absolute.
	   */
	  isAbsolute: function (path) {
	    return path.charAt(0) === '/';
	  },

	  /**
	   * Returns a normalized version of the given path.
	   */
	  normalize: function (path, parentRoute) {
	    return path.replace(/^\/*/, '/');
	  },

	  /**
	   * Joins two URL paths together.
	   */
	  join: function (a, b) {
	    return a.replace(/\/*$/, '/') + b;
	  }

	};

	module.exports = Path;


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);

	/**
	 * Provides the router with context for Router.Navigation.
	 */
	var NavigationContext = {

	  childContextTypes: {
	    makePath: React.PropTypes.func.isRequired,
	    makeHref: React.PropTypes.func.isRequired,
	    transitionTo: React.PropTypes.func.isRequired,
	    replaceWith: React.PropTypes.func.isRequired,
	    goBack: React.PropTypes.func.isRequired
	  },

	  getChildContext: function () {
	    return {
	      makePath: this.constructor.makePath,
	      makeHref: this.constructor.makeHref,
	      transitionTo: this.constructor.transitionTo,
	      replaceWith: this.constructor.replaceWith,
	      goBack: this.constructor.goBack
	    };
	  }

	};

	module.exports = NavigationContext;


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(1);
	var assign = __webpack_require__(36);
	var Path = __webpack_require__(44);

	function routeIsActive(activeRoutes, routeName) {
	  return activeRoutes.some(function (route) {
	    return route.name === routeName;
	  });
	}

	function paramsAreActive(activeParams, params) {
	  for (var property in params)
	    if (String(activeParams[property]) !== String(params[property]))
	      return false;

	  return true;
	}

	function queryIsActive(activeQuery, query) {
	  for (var property in query)
	    if (String(activeQuery[property]) !== String(query[property]))
	      return false;

	  return true;
	}

	/**
	 * Provides the router with context for Router.State.
	 */
	var StateContext = {

	  /**
	   * Returns the current URL path + query string.
	   */
	  getCurrentPath: function () {
	    return this.state.path;
	  },

	  /**
	   * Returns a read-only array of the currently active routes.
	   */
	  getCurrentRoutes: function () {
	    return this.state.routes.slice(0);
	  },

	  /**
	   * Returns the current URL path without the query string.
	   */
	  getCurrentPathname: function () {
	    return this.state.pathname;
	  },

	  /**
	   * Returns a read-only object of the currently active URL parameters.
	   */
	  getCurrentParams: function () {
	    return assign({}, this.state.params);
	  },

	  /**
	   * Returns a read-only object of the currently active query parameters.
	   */
	  getCurrentQuery: function () {
	    return assign({}, this.state.query);
	  },

	  /**
	   * Returns true if the given route, params, and query are active.
	   */
	  isActive: function (to, params, query) {
	    if (Path.isAbsolute(to))
	      return to === this.state.path;

	    return routeIsActive(this.state.routes, to) &&
	      paramsAreActive(this.state.params, params) &&
	      (query == null || queryIsActive(this.state.query, query));
	  },

	  childContextTypes: {
	    getCurrentPath: React.PropTypes.func.isRequired,
	    getCurrentRoutes: React.PropTypes.func.isRequired,
	    getCurrentPathname: React.PropTypes.func.isRequired,
	    getCurrentParams: React.PropTypes.func.isRequired,
	    getCurrentQuery: React.PropTypes.func.isRequired,
	    isActive: React.PropTypes.func.isRequired
	  },

	  getChildContext: function () {
	    return {
	      getCurrentPath: this.getCurrentPath,
	      getCurrentRoutes: this.getCurrentRoutes,
	      getCurrentPathname: this.getCurrentPathname,
	      getCurrentParams: this.getCurrentParams,
	      getCurrentQuery: this.getCurrentQuery,
	      isActive: this.isActive
	    };
	  }

	};

	module.exports = StateContext;


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(38);
	var canUseDOM = __webpack_require__(39).canUseDOM;
	var getWindowScrollPosition = __webpack_require__(58);

	function shouldUpdateScroll(state, prevState) {
	  if (!prevState)
	    return true;

	  // Don't update scroll position when only the query has changed.
	  if (state.pathname === prevState.pathname)
	    return false;

	  var routes = state.routes;
	  var prevRoutes = prevState.routes;

	  var sharedAncestorRoutes = routes.filter(function (route) {
	    return prevRoutes.indexOf(route) !== -1;
	  });

	  return !sharedAncestorRoutes.some(function (route) {
	    return route.ignoreScrollBehavior;
	  });
	}

	/**
	 * Provides the router with the ability to manage window scroll position
	 * according to its scroll behavior.
	 */
	var Scrolling = {

	  statics: {
	    /**
	     * Records curent scroll position as the last known position for the given URL path.
	     */
	    recordScrollPosition: function (path) {
	      if (!this.scrollHistory)
	        this.scrollHistory = {};

	      this.scrollHistory[path] = getWindowScrollPosition();
	    },

	    /**
	     * Returns the last known scroll position for the given URL path.
	     */
	    getScrollPosition: function (path) {
	      if (!this.scrollHistory)
	        this.scrollHistory = {};

	      return this.scrollHistory[path] || null;
	    }
	  },

	  componentWillMount: function () {
	    invariant(
	      this.getScrollBehavior() == null || canUseDOM,
	      'Cannot use scroll behavior without a DOM'
	    );
	  },

	  componentDidMount: function () {
	    this._updateScroll();
	  },

	  componentDidUpdate: function (prevProps, prevState) {
	    this._updateScroll(prevState);
	  },

	  _updateScroll: function (prevState) {
	    if (!shouldUpdateScroll(this.state, prevState))
	      return;

	    var scrollBehavior = this.getScrollBehavior();

	    if (scrollBehavior)
	      scrollBehavior.updateScrollPosition(
	        this.constructor.getScrollPosition(this.state.path),
	        this.state.action
	      );
	  }

	};

	module.exports = Scrolling;


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	/* jshint -W084 */
	var React = __webpack_require__(1);
	var warning = __webpack_require__(37);
	var invariant = __webpack_require__(38);
	var DefaultRoute = __webpack_require__(17);
	var NotFoundRoute = __webpack_require__(19);
	var Redirect = __webpack_require__(20);
	var Route = __webpack_require__(21);
	var Path = __webpack_require__(44);

	var CONFIG_ELEMENT_TYPES = [
	  DefaultRoute.type,
	  NotFoundRoute.type,
	  Redirect.type,
	  Route.type
	];

	function createRedirectHandler(to, _params, _query) {
	  return React.createClass({
	    statics: {
	      willTransitionTo: function (transition, params, query) {
	        transition.redirect(to, _params || params, _query || query);
	      }
	    },

	    render: function () {
	      return null;
	    }
	  });
	}

	function checkPropTypes(componentName, propTypes, props) {
	  for (var propName in propTypes) {
	    if (propTypes.hasOwnProperty(propName)) {
	      var error = propTypes[propName](props, propName, componentName);

	      if (error instanceof Error)
	        warning(false, error.message);
	    }
	  }
	}

	function createRoute(element, parentRoute, namedRoutes) {
	  var type = element.type;
	  var props = element.props;
	  var componentName = (type && type.displayName) || 'UnknownComponent';

	  invariant(
	    CONFIG_ELEMENT_TYPES.indexOf(type) !== -1,
	    'Unrecognized route configuration element "<%s>"',
	    componentName
	  );

	  if (type.propTypes)
	    checkPropTypes(componentName, type.propTypes, props);

	  var route = { name: props.name };

	  if (props.ignoreScrollBehavior) {
	    route.ignoreScrollBehavior = true;
	  }

	  if (type === Redirect.type) {
	    route.handler = createRedirectHandler(props.to, props.params, props.query);
	    props.path = props.path || props.from || '*';
	  } else {
	    route.handler = props.handler;
	  }

	  var parentPath = (parentRoute && parentRoute.path) || '/';

	  if ((props.path || props.name) && type !== DefaultRoute.type && type !== NotFoundRoute.type) {
	    var path = props.path || props.name;

	    // Relative paths extend their parent.
	    if (!Path.isAbsolute(path))
	      path = Path.join(parentPath, path);

	    route.path = Path.normalize(path);
	  } else {
	    route.path = parentPath;

	    if (type === NotFoundRoute.type)
	      route.path += '*';
	  }

	  route.paramNames = Path.extractParamNames(route.path);

	  // Make sure the route's path has all params its parent needs.
	  if (parentRoute && Array.isArray(parentRoute.paramNames)) {
	    parentRoute.paramNames.forEach(function (paramName) {
	      invariant(
	        route.paramNames.indexOf(paramName) !== -1,
	        'The nested route path "%s" is missing the "%s" parameter of its parent path "%s"',
	        route.path, paramName, parentRoute.path
	      );
	    });
	  }

	  // Make sure the route can be looked up by <Link>s.
	  if (props.name) {
	    invariant(
	      namedRoutes[props.name] == null,
	      'You cannot use the name "%s" for more than one route',
	      props.name
	    );

	    namedRoutes[props.name] = route;
	  }

	  // Handle <NotFoundRoute>.
	  if (type === NotFoundRoute.type) {
	    invariant(
	      parentRoute,
	      '<NotFoundRoute> must have a parent <Route>'
	    );

	    invariant(
	      parentRoute.notFoundRoute == null,
	      'You may not have more than one <NotFoundRoute> per <Route>'
	    );

	    parentRoute.notFoundRoute = route;

	    return null;
	  }

	  // Handle <DefaultRoute>.
	  if (type === DefaultRoute.type) {
	    invariant(
	      parentRoute,
	      '<DefaultRoute> must have a parent <Route>'
	    );

	    invariant(
	      parentRoute.defaultRoute == null,
	      'You may not have more than one <DefaultRoute> per <Route>'
	    );

	    parentRoute.defaultRoute = route;

	    return null;
	  }

	  route.childRoutes = createRoutesFromChildren(props.children, route, namedRoutes);

	  return route;
	}

	/**
	 * Creates and returns an array of route objects from the given ReactChildren.
	 */
	function createRoutesFromChildren(children, parentRoute, namedRoutes) {
	  var routes = [];

	  React.Children.forEach(children, function (child) {
	    // Exclude <DefaultRoute>s and <NotFoundRoute>s.
	    if (child = createRoute(child, parentRoute, namedRoutes))
	      routes.push(child);
	  });

	  return routes;
	}

	module.exports = createRoutesFromChildren;


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	function supportsHistory() {
	  /*! taken from modernizr
	   * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
	   * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
	   * changed to avoid false negatives for Windows Phones: https://github.com/rackt/react-router/issues/586
	   */
	  var ua = navigator.userAgent;
	  if ((ua.indexOf('Android 2.') !== -1 ||
	      (ua.indexOf('Android 4.0') !== -1)) &&
	      ua.indexOf('Mobile Safari') !== -1 &&
	      ua.indexOf('Chrome') === -1 &&
	      ua.indexOf('Windows Phone') === -1) {
	    return false;
	  }
	  return (window.history && 'pushState' in window.history);
	}

	module.exports = supportsHistory;


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var assign = __webpack_require__(36);
	var reversedArray = __webpack_require__(59);
	var Redirect = __webpack_require__(51);
	var Promise = __webpack_require__(60);

	/**
	 * Runs all hook functions serially and calls callback(error) when finished.
	 * A hook may return a promise if it needs to execute asynchronously.
	 */
	function runHooks(hooks, callback) {
	  var promise;
	  try {
	    promise = hooks.reduce(function (promise, hook) {
	      // The first hook to use transition.wait makes the rest
	      // of the transition async from that point forward.
	      return promise ? promise.then(hook) : hook();
	    }, null);
	  } catch (error) {
	    return callback(error); // Sync error.
	  }

	  if (promise) {
	    // Use setTimeout to break the promise chain.
	    promise.then(function () {
	      setTimeout(callback);
	    }, function (error) {
	      setTimeout(function () {
	        callback(error);
	      });
	    });
	  } else {
	    callback();
	  }
	}

	/**
	 * Calls the willTransitionFrom hook of all handlers in the given matches
	 * serially in reverse with the transition object and the current instance of
	 * the route's handler, so that the deepest nested handlers are called first.
	 * Calls callback(error) when finished.
	 */
	function runTransitionFromHooks(transition, routes, components, callback) {
	  components = reversedArray(components);

	  var hooks = reversedArray(routes).map(function (route, index) {
	    return function () {
	      var handler = route.handler;

	      if (!transition.isAborted && handler.willTransitionFrom)
	        return handler.willTransitionFrom(transition, components[index]);

	      var promise = transition._promise;
	      transition._promise = null;

	      return promise;
	    };
	  });

	  runHooks(hooks, callback);
	}

	/**
	 * Calls the willTransitionTo hook of all handlers in the given matches
	 * serially with the transition object and any params that apply to that
	 * handler. Calls callback(error) when finished.
	 */
	function runTransitionToHooks(transition, routes, params, query, callback) {
	  var hooks = routes.map(function (route) {
	    return function () {
	      var handler = route.handler;

	      if (!transition.isAborted && handler.willTransitionTo)
	        handler.willTransitionTo(transition, params, query);

	      var promise = transition._promise;
	      transition._promise = null;

	      return promise;
	    };
	  });

	  runHooks(hooks, callback);
	}

	/**
	 * Encapsulates a transition to a given path.
	 *
	 * The willTransitionTo and willTransitionFrom handlers receive
	 * an instance of this class as their first argument.
	 */
	function Transition(path, retry) {
	  this.path = path;
	  this.abortReason = null;
	  this.isAborted = false;
	  this.retry = retry.bind(this);
	  this._promise = null;
	}

	assign(Transition.prototype, {

	  abort: function (reason) {
	    if (this.isAborted) {
	      // First abort wins.
	      return;
	    }

	    this.abortReason = reason;
	    this.isAborted = true;
	  },

	  redirect: function (to, params, query) {
	    this.abort(new Redirect(to, params, query));
	  },

	  wait: function (value) {
	    this._promise = Promise.resolve(value);
	  },

	  from: function (routes, components, callback) {
	    return runTransitionFromHooks(this, routes, components, callback);
	  },

	  to: function (routes, params, query, callback) {
	    return runTransitionToHooks(this, routes, params, query, callback);
	  }

	});

	module.exports = Transition;


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Encapsulates a redirect to the given route.
	 */
	function Redirect(to, params, query) {
	  this.to = to;
	  this.params = params;
	  this.query = query;
	}

	module.exports = Redirect;


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Represents a cancellation caused by navigating away
	 * before the previous transition has fully resolved.
	 */
	function Cancellation() { }

	module.exports = Cancellation;


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("react/lib/ReactUpdates");

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	// empty (null-loader)

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	function ItemsStoreLease() {
		this.leases = undefined;
	}

	module.exports = ItemsStoreLease;

	ItemsStoreLease.prototype.capture = function(fn, onUpdate) {
		var newLeases = [];
		var leases = this.leases;
		function listenTo(Store, id) {
			var lease = Store.listenToItem(id, onUpdate);
			var idx = newLeases.indexOf(lease);
			if(idx < 0) {
				if(leases) {
					idx = leases.indexOf(lease);
					if(idx >= 0)
						leases.splice(idx, 1);
				}
				newLeases.push(lease);
			}
		}
		var error = null;
		try {
			var ret = fn(listenTo);
		} catch(e) {
			error = e;
		}
		if(leases) {
			leases.forEach(function(lease) {
				lease.close();
			});
		}
		this.leases = newLeases;
		if(error) throw error;
		return ret;
	};

	ItemsStoreLease.prototype.close = function() {
		if(this.leases) {
			this.leases.forEach(function(lease) {
				lease.close();
			});
		}
		this.leases = undefined;
	};


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var ItemsStoreFetcher = module.exports = exports;

	ItemsStoreFetcher.fetch = function(fn, callback) {
		var ident = this.ident;
		var unavailableItems;
		function onItemAvailable() {
			if(--unavailableItems === 0)
				runFn();
		}
		function listenTo(Store, id) {
			if(!Store.isItemUpToDate(id)) {
				unavailableItems++;
				Store.waitForItem(id, onItemAvailable);
			}
		}
		function runFn() {
			unavailableItems = 1;
			try {
				var ret = fn(listenTo);
			} catch(e) {
				unavailableItems = NaN;
				callback(e);
			}
			if(--unavailableItems === 0) {
				callback(null, ret);
			}
		}
		runFn();
	};


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var EventEmitter = __webpack_require__(61).EventEmitter;

	var Actions = module.exports = exports;

	Actions.create = function create(array) {
		var obj = {};
		if(Array.isArray(array)) {
			array.forEach(function(name) {
				obj[name] = create();
			});
			return obj;
		} else {
			var ee = new EventEmitter();
			var action = function() {
				var args = Array.prototype.slice.call(arguments);
				ee.emit("trigger", args);
			};
			action.listen = function(callback, bindContext) {
				ee.addListener("trigger", function(args) {
					callback.apply(bindContext, args);
				});
			};
			return action;
		}
	};


/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(38);
	var canUseDOM = __webpack_require__(39).canUseDOM;

	/**
	 * Returns the current scroll position of the window as { x, y }.
	 */
	function getWindowScrollPosition() {
	  invariant(
	    canUseDOM,
	    'Cannot get current scroll position without a DOM'
	  );

	  return {
	    x: window.pageXOffset || document.documentElement.scrollLeft,
	    y: window.pageYOffset || document.documentElement.scrollTop
	  };
	}

	module.exports = getWindowScrollPosition;


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	function reversedArray(array) {
	  return array.slice(0).reverse();
	}

	module.exports = reversedArray;


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var Promise = __webpack_require__(64);

	// TODO: Use process.env.NODE_ENV check + envify to enable
	// when's promise monitor here when in dev.

	module.exports = Promise;


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("events");

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules


	// Declare internals

	var internals = {};


	exports.arrayToObject = function (source) {

	    var obj = {};
	    for (var i = 0, il = source.length; i < il; ++i) {
	        if (typeof source[i] !== 'undefined') {

	            obj[i] = source[i];
	        }
	    }

	    return obj;
	};


	exports.merge = function (target, source) {

	    if (!source) {
	        return target;
	    }

	    if (Array.isArray(source)) {
	        for (var i = 0, il = source.length; i < il; ++i) {
	            if (typeof source[i] !== 'undefined') {
	                if (typeof target[i] === 'object') {
	                    target[i] = exports.merge(target[i], source[i]);
	                }
	                else {
	                    target[i] = source[i];
	                }
	            }
	        }

	        return target;
	    }

	    if (Array.isArray(target)) {
	        if (typeof source !== 'object') {
	            target.push(source);
	            return target;
	        }
	        else {
	            target = exports.arrayToObject(target);
	        }
	    }

	    var keys = Object.keys(source);
	    for (var k = 0, kl = keys.length; k < kl; ++k) {
	        var key = keys[k];
	        var value = source[key];

	        if (value &&
	            typeof value === 'object') {

	            if (!target[key]) {
	                target[key] = value;
	            }
	            else {
	                target[key] = exports.merge(target[key], value);
	            }
	        }
	        else {
	            target[key] = value;
	        }
	    }

	    return target;
	};


	exports.decode = function (str) {

	    try {
	        return decodeURIComponent(str.replace(/\+/g, ' '));
	    } catch (e) {
	        return str;
	    }
	};


	exports.compact = function (obj, refs) {

	    if (typeof obj !== 'object' ||
	        obj === null) {

	        return obj;
	    }

	    refs = refs || [];
	    var lookup = refs.indexOf(obj);
	    if (lookup !== -1) {
	        return refs[lookup];
	    }

	    refs.push(obj);

	    if (Array.isArray(obj)) {
	        var compacted = [];

	        for (var i = 0, l = obj.length; i < l; ++i) {
	            if (typeof obj[i] !== 'undefined') {
	                compacted.push(obj[i]);
	            }
	        }

	        return compacted;
	    }

	    var keys = Object.keys(obj);
	    for (var i = 0, il = keys.length; i < il; ++i) {
	        var key = keys[i];
	        obj[key] = exports.compact(obj[key], refs);
	    }

	    return obj;
	};


	exports.isRegExp = function (obj) {
	    return Object.prototype.toString.call(obj) === '[object RegExp]';
	};


	exports.isBuffer = function (obj) {

	    if (typeof Buffer !== 'undefined') {
	        return Buffer.isBuffer(obj);
	    }
	    else {
	        return false;
	    }
	};


/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(65);


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require) {

		var makePromise = __webpack_require__(67);
		var Scheduler = __webpack_require__(68);
		var async = __webpack_require__(69);

		return makePromise({
			scheduler: new Scheduler(async)
		});

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	})(__webpack_require__(66));


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Stringify = __webpack_require__(70);
	var Parse = __webpack_require__(71);


	// Declare internals

	var internals = {};


	module.exports = {
	    stringify: Stringify,
	    parse: Parse
	};


/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		return function makePromise(environment) {

			var tasks = environment.scheduler;

			var objectCreate = Object.create ||
				function(proto) {
					function Child() {}
					Child.prototype = proto;
					return new Child();
				};

			/**
			 * Create a promise whose fate is determined by resolver
			 * @constructor
			 * @returns {Promise} promise
			 * @name Promise
			 */
			function Promise(resolver, handler) {
				this._handler = resolver === Handler ? handler : init(resolver);
			}

			/**
			 * Run the supplied resolver
			 * @param resolver
			 * @returns {Pending}
			 */
			function init(resolver) {
				var handler = new Pending();

				try {
					resolver(promiseResolve, promiseReject, promiseNotify);
				} catch (e) {
					promiseReject(e);
				}

				return handler;

				/**
				 * Transition from pre-resolution state to post-resolution state, notifying
				 * all listeners of the ultimate fulfillment or rejection
				 * @param {*} x resolution value
				 */
				function promiseResolve (x) {
					handler.resolve(x);
				}
				/**
				 * Reject this promise with reason, which will be used verbatim
				 * @param {Error|*} reason rejection reason, strongly suggested
				 *   to be an Error type
				 */
				function promiseReject (reason) {
					handler.reject(reason);
				}

				/**
				 * Issue a progress event, notifying all progress listeners
				 * @param {*} x progress event payload to pass to all listeners
				 */
				function promiseNotify (x) {
					handler.notify(x);
				}
			}

			// Creation

			Promise.resolve = resolve;
			Promise.reject = reject;
			Promise.never = never;

			Promise._defer = defer;
			Promise._handler = getHandler;

			/**
			 * Returns a trusted promise. If x is already a trusted promise, it is
			 * returned, otherwise returns a new trusted Promise which follows x.
			 * @param  {*} x
			 * @return {Promise} promise
			 */
			function resolve(x) {
				return isPromise(x) ? x
					: new Promise(Handler, new Async(getHandler(x)));
			}

			/**
			 * Return a reject promise with x as its reason (x is used verbatim)
			 * @param {*} x
			 * @returns {Promise} rejected promise
			 */
			function reject(x) {
				return new Promise(Handler, new Async(new Rejected(x)));
			}

			/**
			 * Return a promise that remains pending forever
			 * @returns {Promise} forever-pending promise.
			 */
			function never() {
				return foreverPendingPromise; // Should be frozen
			}

			/**
			 * Creates an internal {promise, resolver} pair
			 * @private
			 * @returns {Promise}
			 */
			function defer() {
				return new Promise(Handler, new Pending());
			}

			// Transformation and flow control

			/**
			 * Transform this promise's fulfillment value, returning a new Promise
			 * for the transformed result.  If the promise cannot be fulfilled, onRejected
			 * is called with the reason.  onProgress *may* be called with updates toward
			 * this promise's fulfillment.
			 * @param {function=} onFulfilled fulfillment handler
			 * @param {function=} onRejected rejection handler
			 * @deprecated @param {function=} onProgress progress handler
			 * @return {Promise} new promise
			 */
			Promise.prototype.then = function(onFulfilled, onRejected) {
				var parent = this._handler;
				var state = parent.join().state();

				if ((typeof onFulfilled !== 'function' && state > 0) ||
					(typeof onRejected !== 'function' && state < 0)) {
					// Short circuit: value will not change, simply share handler
					return new this.constructor(Handler, parent);
				}

				var p = this._beget();
				var child = p._handler;

				parent.chain(child, parent.receiver, onFulfilled, onRejected,
						arguments.length > 2 ? arguments[2] : void 0);

				return p;
			};

			/**
			 * If this promise cannot be fulfilled due to an error, call onRejected to
			 * handle the error. Shortcut for .then(undefined, onRejected)
			 * @param {function?} onRejected
			 * @return {Promise}
			 */
			Promise.prototype['catch'] = function(onRejected) {
				return this.then(void 0, onRejected);
			};

			/**
			 * Creates a new, pending promise of the same type as this promise
			 * @private
			 * @returns {Promise}
			 */
			Promise.prototype._beget = function() {
				var parent = this._handler;
				var child = new Pending(parent.receiver, parent.join().context);
				return new this.constructor(Handler, child);
			};

			// Array combinators

			Promise.all = all;
			Promise.race = race;

			/**
			 * Return a promise that will fulfill when all promises in the
			 * input array have fulfilled, or will reject when one of the
			 * promises rejects.
			 * @param {array} promises array of promises
			 * @returns {Promise} promise for array of fulfillment values
			 */
			function all(promises) {
				/*jshint maxcomplexity:8*/
				var resolver = new Pending();
				var pending = promises.length >>> 0;
				var results = new Array(pending);

				var i, h, x, s;
				for (i = 0; i < promises.length; ++i) {
					x = promises[i];

					if (x === void 0 && !(i in promises)) {
						--pending;
						continue;
					}

					if (maybeThenable(x)) {
						h = getHandlerMaybeThenable(x);

						s = h.state();
						if (s === 0) {
							h.fold(settleAt, i, results, resolver);
						} else if (s > 0) {
							results[i] = h.value;
							--pending;
						} else {
							unreportRemaining(promises, i+1, h);
							resolver.become(h);
							break;
						}

					} else {
						results[i] = x;
						--pending;
					}
				}

				if(pending === 0) {
					resolver.become(new Fulfilled(results));
				}

				return new Promise(Handler, resolver);

				function settleAt(i, x, resolver) {
					/*jshint validthis:true*/
					this[i] = x;
					if(--pending === 0) {
						resolver.become(new Fulfilled(this));
					}
				}
			}

			function unreportRemaining(promises, start, rejectedHandler) {
				var i, h, x;
				for(i=start; i<promises.length; ++i) {
					x = promises[i];
					if(maybeThenable(x)) {
						h = getHandlerMaybeThenable(x);

						if(h !== rejectedHandler) {
							h.visit(h, void 0, h._unreport);
						}
					}
				}
			}

			/**
			 * Fulfill-reject competitive race. Return a promise that will settle
			 * to the same state as the earliest input promise to settle.
			 *
			 * WARNING: The ES6 Promise spec requires that race()ing an empty array
			 * must return a promise that is pending forever.  This implementation
			 * returns a singleton forever-pending promise, the same singleton that is
			 * returned by Promise.never(), thus can be checked with ===
			 *
			 * @param {array} promises array of promises to race
			 * @returns {Promise} if input is non-empty, a promise that will settle
			 * to the same outcome as the earliest input promise to settle. if empty
			 * is empty, returns a promise that will never settle.
			 */
			function race(promises) {
				// Sigh, race([]) is untestable unless we return *something*
				// that is recognizable without calling .then() on it.
				if(Object(promises) === promises && promises.length === 0) {
					return never();
				}

				var h = new Pending();
				var i, x;
				for(i=0; i<promises.length; ++i) {
					x = promises[i];
					if (x !== void 0 && i in promises) {
						getHandler(x).visit(h, h.resolve, h.reject);
					}
				}
				return new Promise(Handler, h);
			}

			// Promise internals
			// Below this, everything is @private

			/**
			 * Get an appropriate handler for x, without checking for cycles
			 * @param {*} x
			 * @returns {object} handler
			 */
			function getHandler(x) {
				if(isPromise(x)) {
					return x._handler.join();
				}
				return maybeThenable(x) ? getHandlerUntrusted(x) : new Fulfilled(x);
			}

			/**
			 * Get a handler for thenable x.
			 * NOTE: You must only call this if maybeThenable(x) == true
			 * @param {object|function|Promise} x
			 * @returns {object} handler
			 */
			function getHandlerMaybeThenable(x) {
				return isPromise(x) ? x._handler.join() : getHandlerUntrusted(x);
			}

			/**
			 * Get a handler for potentially untrusted thenable x
			 * @param {*} x
			 * @returns {object} handler
			 */
			function getHandlerUntrusted(x) {
				try {
					var untrustedThen = x.then;
					return typeof untrustedThen === 'function'
						? new Thenable(untrustedThen, x)
						: new Fulfilled(x);
				} catch(e) {
					return new Rejected(e);
				}
			}

			/**
			 * Handler for a promise that is pending forever
			 * @constructor
			 */
			function Handler() {}

			Handler.prototype.when
				= Handler.prototype.become
				= Handler.prototype.notify
				= Handler.prototype.fail
				= Handler.prototype._unreport
				= Handler.prototype._report
				= noop;

			Handler.prototype._state = 0;

			Handler.prototype.state = function() {
				return this._state;
			};

			/**
			 * Recursively collapse handler chain to find the handler
			 * nearest to the fully resolved value.
			 * @returns {object} handler nearest the fully resolved value
			 */
			Handler.prototype.join = function() {
				var h = this;
				while(h.handler !== void 0) {
					h = h.handler;
				}
				return h;
			};

			Handler.prototype.chain = function(to, receiver, fulfilled, rejected, progress) {
				this.when({
					resolver: to,
					receiver: receiver,
					fulfilled: fulfilled,
					rejected: rejected,
					progress: progress
				});
			};

			Handler.prototype.visit = function(receiver, fulfilled, rejected, progress) {
				this.chain(failIfRejected, receiver, fulfilled, rejected, progress);
			};

			Handler.prototype.fold = function(f, z, c, to) {
				this.visit(to, function(x) {
					f.call(c, z, x, this);
				}, to.reject, to.notify);
			};

			/**
			 * Handler that invokes fail() on any handler it becomes
			 * @constructor
			 */
			function FailIfRejected() {}

			inherit(Handler, FailIfRejected);

			FailIfRejected.prototype.become = function(h) {
				h.fail();
			};

			var failIfRejected = new FailIfRejected();

			/**
			 * Handler that manages a queue of consumers waiting on a pending promise
			 * @constructor
			 */
			function Pending(receiver, inheritedContext) {
				Promise.createContext(this, inheritedContext);

				this.consumers = void 0;
				this.receiver = receiver;
				this.handler = void 0;
				this.resolved = false;
			}

			inherit(Handler, Pending);

			Pending.prototype._state = 0;

			Pending.prototype.resolve = function(x) {
				this.become(getHandler(x));
			};

			Pending.prototype.reject = function(x) {
				if(this.resolved) {
					return;
				}

				this.become(new Rejected(x));
			};

			Pending.prototype.join = function() {
				if (!this.resolved) {
					return this;
				}

				var h = this;

				while (h.handler !== void 0) {
					h = h.handler;
					if (h === this) {
						return this.handler = cycle();
					}
				}

				return h;
			};

			Pending.prototype.run = function() {
				var q = this.consumers;
				var handler = this.join();
				this.consumers = void 0;

				for (var i = 0; i < q.length; ++i) {
					handler.when(q[i]);
				}
			};

			Pending.prototype.become = function(handler) {
				if(this.resolved) {
					return;
				}

				this.resolved = true;
				this.handler = handler;
				if(this.consumers !== void 0) {
					tasks.enqueue(this);
				}

				if(this.context !== void 0) {
					handler._report(this.context);
				}
			};

			Pending.prototype.when = function(continuation) {
				if(this.resolved) {
					tasks.enqueue(new ContinuationTask(continuation, this.handler));
				} else {
					if(this.consumers === void 0) {
						this.consumers = [continuation];
					} else {
						this.consumers.push(continuation);
					}
				}
			};

			Pending.prototype.notify = function(x) {
				if(!this.resolved) {
					tasks.enqueue(new ProgressTask(x, this));
				}
			};

			Pending.prototype.fail = function(context) {
				var c = typeof context === 'undefined' ? this.context : context;
				this.resolved && this.handler.join().fail(c);
			};

			Pending.prototype._report = function(context) {
				this.resolved && this.handler.join()._report(context);
			};

			Pending.prototype._unreport = function() {
				this.resolved && this.handler.join()._unreport();
			};

			/**
			 * Wrap another handler and force it into a future stack
			 * @param {object} handler
			 * @constructor
			 */
			function Async(handler) {
				this.handler = handler;
			}

			inherit(Handler, Async);

			Async.prototype.when = function(continuation) {
				tasks.enqueue(new ContinuationTask(continuation, this));
			};

			Async.prototype._report = function(context) {
				this.join()._report(context);
			};

			Async.prototype._unreport = function() {
				this.join()._unreport();
			};

			/**
			 * Handler that wraps an untrusted thenable and assimilates it in a future stack
			 * @param {function} then
			 * @param {{then: function}} thenable
			 * @constructor
			 */
			function Thenable(then, thenable) {
				Pending.call(this);
				tasks.enqueue(new AssimilateTask(then, thenable, this));
			}

			inherit(Pending, Thenable);

			/**
			 * Handler for a fulfilled promise
			 * @param {*} x fulfillment value
			 * @constructor
			 */
			function Fulfilled(x) {
				Promise.createContext(this);
				this.value = x;
			}

			inherit(Handler, Fulfilled);

			Fulfilled.prototype._state = 1;

			Fulfilled.prototype.fold = function(f, z, c, to) {
				runContinuation3(f, z, this, c, to);
			};

			Fulfilled.prototype.when = function(cont) {
				runContinuation1(cont.fulfilled, this, cont.receiver, cont.resolver);
			};

			var errorId = 0;

			/**
			 * Handler for a rejected promise
			 * @param {*} x rejection reason
			 * @constructor
			 */
			function Rejected(x) {
				Promise.createContext(this);

				this.id = ++errorId;
				this.value = x;
				this.handled = false;
				this.reported = false;

				this._report();
			}

			inherit(Handler, Rejected);

			Rejected.prototype._state = -1;

			Rejected.prototype.fold = function(f, z, c, to) {
				to.become(this);
			};

			Rejected.prototype.when = function(cont) {
				if(typeof cont.rejected === 'function') {
					this._unreport();
				}
				runContinuation1(cont.rejected, this, cont.receiver, cont.resolver);
			};

			Rejected.prototype._report = function(context) {
				tasks.afterQueue(new ReportTask(this, context));
			};

			Rejected.prototype._unreport = function() {
				this.handled = true;
				tasks.afterQueue(new UnreportTask(this));
			};

			Rejected.prototype.fail = function(context) {
				Promise.onFatalRejection(this, context === void 0 ? this.context : context);
			};

			function ReportTask(rejection, context) {
				this.rejection = rejection;
				this.context = context;
			}

			ReportTask.prototype.run = function() {
				if(!this.rejection.handled) {
					this.rejection.reported = true;
					Promise.onPotentiallyUnhandledRejection(this.rejection, this.context);
				}
			};

			function UnreportTask(rejection) {
				this.rejection = rejection;
			}

			UnreportTask.prototype.run = function() {
				if(this.rejection.reported) {
					Promise.onPotentiallyUnhandledRejectionHandled(this.rejection);
				}
			};

			// Unhandled rejection hooks
			// By default, everything is a noop

			// TODO: Better names: "annotate"?
			Promise.createContext
				= Promise.enterContext
				= Promise.exitContext
				= Promise.onPotentiallyUnhandledRejection
				= Promise.onPotentiallyUnhandledRejectionHandled
				= Promise.onFatalRejection
				= noop;

			// Errors and singletons

			var foreverPendingHandler = new Handler();
			var foreverPendingPromise = new Promise(Handler, foreverPendingHandler);

			function cycle() {
				return new Rejected(new TypeError('Promise cycle'));
			}

			// Task runners

			/**
			 * Run a single consumer
			 * @constructor
			 */
			function ContinuationTask(continuation, handler) {
				this.continuation = continuation;
				this.handler = handler;
			}

			ContinuationTask.prototype.run = function() {
				this.handler.join().when(this.continuation);
			};

			/**
			 * Run a queue of progress handlers
			 * @constructor
			 */
			function ProgressTask(value, handler) {
				this.handler = handler;
				this.value = value;
			}

			ProgressTask.prototype.run = function() {
				var q = this.handler.consumers;
				if(q === void 0) {
					return;
				}

				for (var c, i = 0; i < q.length; ++i) {
					c = q[i];
					runNotify(c.progress, this.value, this.handler, c.receiver, c.resolver);
				}
			};

			/**
			 * Assimilate a thenable, sending it's value to resolver
			 * @param {function} then
			 * @param {object|function} thenable
			 * @param {object} resolver
			 * @constructor
			 */
			function AssimilateTask(then, thenable, resolver) {
				this._then = then;
				this.thenable = thenable;
				this.resolver = resolver;
			}

			AssimilateTask.prototype.run = function() {
				var h = this.resolver;
				tryAssimilate(this._then, this.thenable, _resolve, _reject, _notify);

				function _resolve(x) { h.resolve(x); }
				function _reject(x)  { h.reject(x); }
				function _notify(x)  { h.notify(x); }
			};

			function tryAssimilate(then, thenable, resolve, reject, notify) {
				try {
					then.call(thenable, resolve, reject, notify);
				} catch (e) {
					reject(e);
				}
			}

			// Other helpers

			/**
			 * @param {*} x
			 * @returns {boolean} true iff x is a trusted Promise
			 */
			function isPromise(x) {
				return x instanceof Promise;
			}

			/**
			 * Test just enough to rule out primitives, in order to take faster
			 * paths in some code
			 * @param {*} x
			 * @returns {boolean} false iff x is guaranteed *not* to be a thenable
			 */
			function maybeThenable(x) {
				return (typeof x === 'object' || typeof x === 'function') && x !== null;
			}

			function runContinuation1(f, h, receiver, next) {
				if(typeof f !== 'function') {
					return next.become(h);
				}

				Promise.enterContext(h);
				tryCatchReject(f, h.value, receiver, next);
				Promise.exitContext();
			}

			function runContinuation3(f, x, h, receiver, next) {
				if(typeof f !== 'function') {
					return next.become(h);
				}

				Promise.enterContext(h);
				tryCatchReject3(f, x, h.value, receiver, next);
				Promise.exitContext();
			}

			function runNotify(f, x, h, receiver, next) {
				if(typeof f !== 'function') {
					return next.notify(x);
				}

				Promise.enterContext(h);
				tryCatchReturn(f, x, receiver, next);
				Promise.exitContext();
			}

			/**
			 * Return f.call(thisArg, x), or if it throws return a rejected promise for
			 * the thrown exception
			 */
			function tryCatchReject(f, x, thisArg, next) {
				try {
					next.become(getHandler(f.call(thisArg, x)));
				} catch(e) {
					next.become(new Rejected(e));
				}
			}

			/**
			 * Same as above, but includes the extra argument parameter.
			 */
			function tryCatchReject3(f, x, y, thisArg, next) {
				try {
					f.call(thisArg, x, y, next);
				} catch(e) {
					next.become(new Rejected(e));
				}
			}

			/**
			 * Return f.call(thisArg, x), or if it throws, *return* the exception
			 */
			function tryCatchReturn(f, x, thisArg, next) {
				try {
					next.notify(f.call(thisArg, x));
				} catch(e) {
					next.notify(e);
				}
			}

			function inherit(Parent, Child) {
				Child.prototype = objectCreate(Parent.prototype);
				Child.prototype.constructor = Child;
			}

			function noop() {}

			return Promise;
		};
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(66)));


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {

		var Queue = __webpack_require__(72);

		// Credit to Twisol (https://github.com/Twisol) for suggesting
		// this type of extensible queue + trampoline approach for next-tick conflation.

		/**
		 * Async task scheduler
		 * @param {function} async function to schedule a single async function
		 * @constructor
		 */
		function Scheduler(async) {
			this._async = async;
			this._queue = new Queue(15);
			this._afterQueue = new Queue(5);
			this._running = false;

			var self = this;
			this.drain = function() {
				self._drain();
			};
		}

		/**
		 * Enqueue a task
		 * @param {{ run:function }} task
		 */
		Scheduler.prototype.enqueue = function(task) {
			this._add(this._queue, task);
		};

		/**
		 * Enqueue a task to run after the main task queue
		 * @param {{ run:function }} task
		 */
		Scheduler.prototype.afterQueue = function(task) {
			this._add(this._afterQueue, task);
		};

		/**
		 * Drain the handler queue entirely, and then the after queue
		 */
		Scheduler.prototype._drain = function() {
			runQueue(this._queue);
			this._running = false;
			runQueue(this._afterQueue);
		};

		/**
		 * Add a task to the q, and schedule drain if not already scheduled
		 * @param {Queue} queue
		 * @param {{run:function}} task
		 * @private
		 */
		Scheduler.prototype._add = function(queue, task) {
			queue.push(task);
			if(!this._running) {
				this._running = true;
				this._async(this.drain);
			}
		};

		/**
		 * Run all the tasks in the q
		 * @param queue
		 */
		function runQueue(queue) {
			while(queue.length > 0) {
				queue.shift().run();
			}
		}

		return Scheduler;

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(66)));


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;var require;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {

		// Sniff "best" async scheduling option
		// Prefer process.nextTick or MutationObserver, then check for
		// vertx and finally fall back to setTimeout

		/*jshint maxcomplexity:6*/
		/*global process,document,setTimeout,MutationObserver,WebKitMutationObserver*/
		var nextTick, MutationObs;

		if (typeof process !== 'undefined' && process !== null &&
			typeof process.nextTick === 'function') {
			nextTick = function(f) {
				process.nextTick(f);
			};

		} else if (MutationObs =
			(typeof MutationObserver === 'function' && MutationObserver) ||
			(typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)) {
			nextTick = (function (document, MutationObserver) {
				var scheduled;
				var el = document.createElement('div');
				var o = new MutationObserver(run);
				o.observe(el, { attributes: true });

				function run() {
					var f = scheduled;
					scheduled = void 0;
					f();
				}

				return function (f) {
					scheduled = f;
					el.setAttribute('class', 'x');
				};
			}(document, MutationObs));

		} else {
			nextTick = (function(cjsRequire) {
				var vertx;
				try {
					// vert.x 1.x || 2.x
					vertx = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"vertx\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
				} catch (ignore) {}

				if (vertx) {
					if (typeof vertx.runOnLoop === 'function') {
						return vertx.runOnLoop;
					}
					if (typeof vertx.runOnContext === 'function') {
						return vertx.runOnContext;
					}
				}

				// capture setTimeout to avoid being caught by fake timers
				// used in time based tests
				var capturedSetTimeout = setTimeout;
				return function (t) {
					capturedSetTimeout(t, 0);
				};
			}(require));
		}

		return nextTick;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(66)));


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Utils = __webpack_require__(62);


	// Declare internals

	var internals = {
	    delimiter: '&'
	};


	internals.stringify = function (obj, prefix) {

	    if (Utils.isBuffer(obj)) {
	        obj = obj.toString();
	    }
	    else if (obj instanceof Date) {
	        obj = obj.toISOString();
	    }
	    else if (obj === null) {
	        obj = '';
	    }

	    if (typeof obj === 'string' ||
	        typeof obj === 'number' ||
	        typeof obj === 'boolean') {

	        return [encodeURIComponent(prefix) + '=' + encodeURIComponent(obj)];
	    }

	    var values = [];

	    for (var key in obj) {
	        if (obj.hasOwnProperty(key)) {
	            values = values.concat(internals.stringify(obj[key], prefix + '[' + key + ']'));
	        }
	    }

	    return values;
	};


	module.exports = function (obj, options) {

	    options = options || {};
	    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;

	    var keys = [];

	    for (var key in obj) {
	        if (obj.hasOwnProperty(key)) {
	            keys = keys.concat(internals.stringify(obj[key], key));
	        }
	    }

	    return keys.join(delimiter);
	};


/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Utils = __webpack_require__(62);


	// Declare internals

	var internals = {
	    delimiter: '&',
	    depth: 5,
	    arrayLimit: 20,
	    parameterLimit: 1000
	};


	internals.parseValues = function (str, options) {

	    var obj = {};
	    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

	    for (var i = 0, il = parts.length; i < il; ++i) {
	        var part = parts[i];
	        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

	        if (pos === -1) {
	            obj[Utils.decode(part)] = '';
	        }
	        else {
	            var key = Utils.decode(part.slice(0, pos));
	            var val = Utils.decode(part.slice(pos + 1));

	            if (!obj[key]) {
	                obj[key] = val;
	            }
	            else {
	                obj[key] = [].concat(obj[key]).concat(val);
	            }
	        }
	    }

	    return obj;
	};


	internals.parseObject = function (chain, val, options) {

	    if (!chain.length) {
	        return val;
	    }

	    var root = chain.shift();

	    var obj = {};
	    if (root === '[]') {
	        obj = [];
	        obj = obj.concat(internals.parseObject(chain, val, options));
	    }
	    else {
	        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
	        var index = parseInt(cleanRoot, 10);
	        if (!isNaN(index) &&
	            root !== cleanRoot &&
	            index <= options.arrayLimit) {

	            obj = [];
	            obj[index] = internals.parseObject(chain, val, options);
	        }
	        else {
	            obj[cleanRoot] = internals.parseObject(chain, val, options);
	        }
	    }

	    return obj;
	};


	internals.parseKeys = function (key, val, options) {

	    if (!key) {
	        return;
	    }

	    // The regex chunks

	    var parent = /^([^\[\]]*)/;
	    var child = /(\[[^\[\]]*\])/g;

	    // Get the parent

	    var segment = parent.exec(key);

	    // Don't allow them to overwrite object prototype properties

	    if (Object.prototype.hasOwnProperty(segment[1])) {
	        return;
	    }

	    // Stash the parent if it exists

	    var keys = [];
	    if (segment[1]) {
	        keys.push(segment[1]);
	    }

	    // Loop through children appending to the array until we hit depth

	    var i = 0;
	    while ((segment = child.exec(key)) !== null && i < options.depth) {

	        ++i;
	        if (!Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
	            keys.push(segment[1]);
	        }
	    }

	    // If there's a remainder, just add whatever is left

	    if (segment) {
	        keys.push('[' + key.slice(segment.index) + ']');
	    }

	    return internals.parseObject(keys, val, options);
	};


	module.exports = function (str, options) {

	    if (str === '' ||
	        str === null ||
	        typeof str === 'undefined') {

	        return {};
	    }

	    options = options || {};
	    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
	    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
	    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
	    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;

	    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
	    var obj = {};

	    // Iterate over the keys and setup the new object

	    var keys = Object.keys(tempObj);
	    for (var i = 0, il = keys.length; i < il; ++i) {
	        var key = keys[i];
	        var newObj = internals.parseKeys(key, tempObj[key], options);
	        obj = Utils.merge(obj, newObj);
	    }

	    return Utils.compact(obj);
	};


/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
		/**
		 * Circular queue
		 * @param {number} capacityPow2 power of 2 to which this queue's capacity
		 *  will be set initially. eg when capacityPow2 == 3, queue capacity
		 *  will be 8.
		 * @constructor
		 */
		function Queue(capacityPow2) {
			this.head = this.tail = this.length = 0;
			this.buffer = new Array(1 << capacityPow2);
		}

		Queue.prototype.push = function(x) {
			if(this.length === this.buffer.length) {
				this._ensureCapacity(this.length * 2);
			}

			this.buffer[this.tail] = x;
			this.tail = (this.tail + 1) & (this.buffer.length - 1);
			++this.length;
			return this.length;
		};

		Queue.prototype.shift = function() {
			var x = this.buffer[this.head];
			this.buffer[this.head] = void 0;
			this.head = (this.head + 1) & (this.buffer.length - 1);
			--this.length;
			return x;
		};

		Queue.prototype._ensureCapacity = function(capacity) {
			var head = this.head;
			var buffer = this.buffer;
			var newBuffer = new Array(capacity);
			var i = 0;
			var len;

			if(head === 0) {
				len = this.length;
				for(; i<len; ++i) {
					newBuffer[i] = buffer[i];
				}
			} else {
				capacity = buffer.length;
				len = this.tail;
				for(; head<capacity; ++i, ++head) {
					newBuffer[i] = buffer[head];
				}

				for(head=0; head<len; ++i, ++head) {
					newBuffer[i] = buffer[head];
				}
			}

			this.buffer = newBuffer;
			this.head = 0;
			this.tail = this.length;
		};

		return Queue;

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(66)));


/***/ }
/******/ ])