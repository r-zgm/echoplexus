function SyncedEditor () {
	var SyncedEditorView = Backbone.View.extend({
		class: "syncedEditor",

		initialize: function (opts) {
			_.bindAll(this);
			if (!opts.hasOwnProperty("editor")) {
				throw "There was no editor supplied to SyncedEditor";
			}
			if (!opts.hasOwnProperty("room")) {
				throw "There was no room supplied to SyncedEditor";
			}

			this.editor = opts.editor;
			this.channelName = opts.room;
			this.subchannelName = opts.subchannel;
			this.channelKey = this.channelName + ":" + this.subchannelName;
			this.socket = io.connect("/code");

			this.listen();
			this.attachEvents();

			// initialize the channel
			this.socket.emit("subscribe", {
				room: this.channelName,
				subchannel: this.subchannelName
			});
		},

		attachEvents: function () {
			var self = this,
				socket = this.socket;
				
			this.editor.on("change", function (instance, change) {
				if (change.origin !== undefined && change.origin !== "setValue") {
					socket.emit("code:change:" + self.channelKey, change);
				}
				self.trigger("eval");
			});
			this.editor.on("cursorActivity", function (instance) {
				socket.emit("code:cursorActivity:" + self.channelKey, {
					cursor: instance.getCursor()
				});
			});
		},

		listen: function () {
			var self = this,
				editor = this.editor,
				socket = this.socket;

			this.socketEvents = {
				"code:change": function (change) {
					// received a change from another client, update our view
					self.applyChanges(change);
				},
				"code:request": function () {
					// received a transcript request from server, it thinks we're authority
					// send a copy of the entirety of our code
					socket.emit("code:full_transcript:" + self.channelKey, {
						code: editor.getValue()
					});
				},
				"code:sync": function (data) {
					// hard reset / overwrite our code with the value from the server
					if (editor.getValue() !== data.code) {
						editor.setValue(data.code);
					}
				},
				"code:authoritative_push": function (data) {
					// received a batch of changes and a starting value to apply those changes to
					editor.setValue(data.start);
					for (var i = 0; i < data.ops.length; i ++) {
						self.applyChanges(data.ops[i]);
					}
				},
				"code:cursorActivity": function (data) {
					// show the other users' cursors in our view
					var pos = editor.charCoords(data.cursor); // their position

					// try to find an existing ghost cursor:
					var $ghostCursor = $(".ghost-cursor[rel='" + data.id + "']", this.$el);
					if (!$ghostCursor.length) { // if non-existent, create one
						$ghostCursor = $("<div class='ghost-cursor' rel=" + data.id +"></div>");
						$("body").append($ghostCursor); // it's absolutely positioned wrt body
					}

					// position it:
					// TODO:
					// if view.is.active { show cursor } else { hide }

					$ghostCursor.css({
						background: Color().toRGB(),
						top: pos.top,
						left: pos.left
					});
				}
			};

			_.each(this.socketEvents, function (value, key) {
				socket.on(key + ":" + self.channelKey, value);
			});
		},

		applyChanges: function (change) {
			var editor = this.editor;
			
			editor.replaceRange(change.text, change.from, change.to);
			while (change.next !== undefined) { // apply all the changes we receive until there are no more
				change = change.next;
				editor.replaceRange(change.text, change.from, change.to);
			}
		}
	});

	return SyncedEditorView;
}