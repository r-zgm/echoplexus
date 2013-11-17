((root, factory) ->

  # Set up Backbone appropriately for the environment.
  if typeof exports isnt "undefined"

    # Node/CommonJS, no need for jQuery in that case.
    factory exports
  else if typeof define is "function" and define.amd

    # AMD
    define ["exports"], (exports) ->

      # Export global even in AMD case in case this script is loaded with
      # others that may still expect a global Backbone.
      factory exports

) this, (exports) ->

  # utility: a container of useful regexes arranged into some a rough taxonomy
  exports.REGEXES =
    urls:
      image: /(\b(https?|http):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|].(jpeg|jpg|png|bmp|gif|svg))/g
      youtube: /((https?:\/\/)?(www\.)?youtu((?=\.)\.be\/|be\.com\/watch.*v=)([\w\d\-_]*))/g
      all_others: /(\b(https?|http):(\/\/|&#x2F;&#x2F;)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|;])/g

    users:
      mentions: /(@[^\b\s]*)/g

    commands:
      nick: /^\/(nick|n) /
      register: /^\/register/
      identify: /^\/(identify|id)/
      topic: /^\/(topic) /
      broadcast: /^\/(broadcast|bc) /
      failed_command: /^\//
      private: /^\/private/
      public: /^\/public/
      help: /^\/help/
      password: /^\/(password|pw)/
      private_message: /^\/(pm|w|whisper|t|tell) /
      join: /^\/(join|j)/
      leave: /^\/leave/
      pull_logs: /^\/(pull|p|sync|s) /
      set_color: /^\/(color|c) /
      edit: /^(\/edit) #?(\d*) /
      chown: /^\/chown /
      chmod: /^\/chmod /
      reply: /(>>|&gt;&gt;)(\d+)/g

    colors:
      hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i # matches 3 and 6-digit hex colour codes, optional #
