if (typeof DEBUG === 'undefined') DEBUG = true; // will be removed

$(document).ready(function () {
	
	// tooltip stuff:s
	$("body").on("mouseenter", ".tooltip-target", function(ev) {
		var title = $(this).data("tooltip-title");
		var body = $(this).data("tooltip-body");
		var tclass = $(this).data("tooltip-class");

		var $tooltip = $(tooltipTemplate);
		var $target = $(ev.target);
		if (!$target.hasClass("tooltip-target")) { // search up to find the true tooltip target
			$target = $target.parents(".tooltip-target");
		}
		var targetOffset = $target.offset();
		$tooltip.css({
			left: targetOffset.left + ($target.width()/2),
			top: targetOffset.top + ($target.height())
		}).addClass(tclass)
			.find(".title").text(title)
		.end()
			.find(".body").text(body);

		this.tooltip_timer = setTimeout(function () {
			$("body").append($tooltip);
			$tooltip.fadeIn();
		},350);
	}).on("mouseleave", ".tooltip-target", function (ev) {
		clearTimeout(this.tooltip_timer);
		$("body .tooltip").fadeOut(function () {
			$(this).remove();
		});
	});

	// consider these persistent options
	// we use a cookie for these since they're small and more compatible
	window.OPTIONS = {
		"autoload_media": true,
		"suppress_join": false,
		"highlight_mine": true
	};

	function updateOption (option) {
		// update the options hash based upon the cookie
		var $option = $("#" + option);
		if ($.cookie(option) !== null) {
			if ($.cookie(option) === "false") {
				$option.removeAttr("checked");
				OPTIONS[option] = false;
			} else {
				$option.attr("checked", "checked");
				OPTIONS[option] = true;
			}

			if (OPTIONS[option]) {
				$("body").addClass(option);
			} else {
				$("body").removeClass(option);
			}
		}
		// bind events to the click of the element of the same ID as the option's key
		$option.on("click", function () {
			$.cookie(option, $(this).prop("checked"));
			OPTIONS[option] = !OPTIONS[option];
			if (OPTIONS[option]) {
				$("body").addClass(option);
			} else {
				$("body").removeClass(option);
			}
			// chat.scroll();
		});
	}

	_.each(_.keys(OPTIONS), updateOption); // update all options we know about

	$(".options-list .header").on("click", function () {
		var panel = $(this).siblings(".options");
		if (panel.is(":visible")) {
			panel.slideUp();
		} else {
			panel.slideDown();
		}
	});


	// ghetto templates:
	var tooltipTemplate = $("#tooltip").html();

	window.notifications = new Notifications();
	window.uniqueImages = {};

	$(window).on("blur", function () {
		$("body").addClass("blurred");
	}).on("focus", function () {
		$("body").removeClass("blurred");
	});

	// $(window).on("keydown mousemove", function () {
	// 	chatClient.me.active();
	// });

	io.connect(window.location.origin);

	var channelSwitcherView = new ChannelSwitcher();
	var channelSwitcher = new channelSwitcherView();
	$("header").append(channelSwitcher.$el);

	// $("#chatting").append(defaultChat.$el);

	// socket.on('connect', function () {

		// notifications.enable();

		// function applyChanges (editor, change) {
		// 	editor.replaceRange(change.text, change.from, change.to);
		// 	while (change.next !== undefined) { // apply all the changes we receive until there are no more
		// 		change = change.next;
		// 		editor.replaceRange(change.text, change.from, change.to);
		// 	}
		// }






	// socket.on('disconnect', function () {
	// 	setTimeout(function () { // for dev, cheap auto-reload
	// 		window.location = window.location;
	// 	}, 2000);
	// 	socket.removeAllListeners();
	// 	socket.removeAllListeners('chat'); 
	// 	socket.removeAllListeners('userlist');
	// 	socket.removeAllListeners('code:change code:authoritative_push code:sync code:request');
	// 	$("#chatinput textarea").off();
	// 	chat.renderChatMessage({body: "Unexpected d/c from server", log: false});
	// });

	$("#chatting").on("hover", ".chatMessage", function (ev) {
		$(this).attr("title", "sent " + moment($(".time", this).data("timestamp")).fromNow());
	});
	$("#chatting").on("hover", ".user", function (ev) {
		var $idle = $(this).find(".idle");
		if ($idle.length) {
			$(this).attr("title", "Idle since " + moment($(".time", this).data("timestamp")).fromNow());
		}
	});

	$("span.options").on("click", function (ev) {
		$(this).siblings("div.options").toggle();
	});

	$(window).on("click", function () {
		notifications.request();
	});

	$("#codeButton").on("click", function (ev) {
		ev.preventDefault();
		if ($("#coding:visible").length === 0) {
			$("#chatting").fadeOut();
			$("#coding").fadeIn(function () {
				$("body").trigger("codeSectionActive");
			});
		}
	});

	$("#chatButton").on("click", function (ev) {
		ev.preventDefault();
		if ($("#chatting:visible").length === 0) {
			$("#coding").fadeOut();
			$("#chatting").fadeIn();
		}
	});

	$("#syncButton").on("click", function (ev) {
		// var missed = log.getMissingIDs(10);
		// var missed = [0,1,2];
		if (missed.length) {
			// defaultChat.socket.emit("chat:history_request", {
			// 	requestRange: missed,
			// 	room: "/"
			// });
		}
	});

	$("#deleteLocalStorage").on('click', function (ev) {
		ev.preventDefault();
		window.localStorage.setObj("log", null);
	});



});