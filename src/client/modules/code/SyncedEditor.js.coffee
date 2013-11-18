define ["jquery", "underscore", "backbone", "client"], ($, _, Backbone, Client) ->
  ->
    ColorModel = Client.ColorModel
    ClientsCollection = Client.ClientsCollection
    ClientModel = Client.ClientModel
    SyncedEditorView = Backbone.View.extend(
      class: "syncedEditor"
      initialize: (opts) ->
        self = this
        _.bindAll this
        throw "There was no editor supplied to SyncedEditor"  unless opts.hasOwnProperty("editor")
        throw "There was no room supplied to SyncedEditor"  unless opts.hasOwnProperty("room")
        @editor = opts.editor
        @clients = opts.clients
        @channelName = opts.room
        @subchannelName = opts.subchannel
        @channelKey = @channelName + ":" + @subchannelName
        @socket = io.connect(opts.host + "/code")
        @active = false
        @listen()
        @attachEvents()

        # initialize the channel
        @socket.emit "subscribe",
          room: @channelName
          subchannel: @subchannelName
        , @postSubscribe
        @on "show", ->
          self.active = true
          self.editor.refresh()  if self.editor

        @on "hide", ->
          self.active = false
          $(".ghost-cursor").remove()


        # remove their ghost-cursor when they leave
        @clients.on "remove", (model) ->
          $(".ghost-cursor[rel='" + self.channelKey + model.get("id") + "']").remove()

        $("body").on "codeSectionActive", -> # sloppy, forgive me
          self.trigger "eval"


      postSubscribe: ->

      kill: ->
        self = this
        DEBUG and console.log("killing SyncedEditorView")
        _.each @socketEvents, (method, key) ->
          self.socket.removeAllListeners key + ":" + self.channelKey

        @socket.emit "unsubscribe:" + @channelKey,
          room: @channelName


      attachEvents: ->
        self = this
        socket = @socket
        @editor.on "change", (instance, change) ->
          if change.origin isnt `undefined` and change.origin isnt "setValue"
            console.log self.channelKey
            socket.emit "code:change:" + self.channelKey, change
          self.trigger "eval"  if codingModeActive()

        @editor.on "cursorActivity", (instance) ->
          return  if not self.active or not codingModeActive() # don't report cursor events if we aren't looking at the document
          socket.emit "code:cursorActivity:" + self.channelKey,
            cursor: instance.getCursor()



      listen: ->
        self = this
        editor = @editor
        socket = @socket
        @socketEvents =
          "code:change": (change) ->

            # received a change from another client, update our view
            self.applyChanges change

          "code:request": ->

            # received a transcript request from server, it thinks we're authority
            # send a copy of the entirety of our code
            socket.emit "code:full_transcript:" + self.channelKey,
              code: editor.getValue()


          "code:sync": (data) ->

            # hard reset / overwrite our code with the value from the server
            editor.setValue data.code  if editor.getValue() isnt data.code

          "code:authoritative_push": (data) ->

            # received a batch of changes and a starting value to apply those changes to
            editor.setValue data.start
            i = 0

            while i < data.ops.length
              self.applyChanges data.ops[i]
              i++

          "code:cursorActivity": (data) -> # show the other users' cursors in our view
            return  if not self.active or not codingModeActive()
            pos = editor.cursorCoords(data.cursor, "local") # their position
            fromClient = self.clients.get(data.id) # our knowledge of their client object
            return  if fromClient is null # this should never happen

            # try to find an existing ghost cursor:
            $ghostCursor = $(".ghost-cursor[rel='" + self.channelKey + data.id + "']") # NOT SCOPED: it's appended and positioned absolutely in the body!
            unless $ghostCursor.length # if non-existent, create one
              $ghostCursor = $("<div class='ghost-cursor' rel=" + self.channelKey + data.id + "></div>")
              $(editor.getWrapperElement()).find(".CodeMirror-lines > div").append $ghostCursor
              $ghostCursor.append "<div class='user'>" + fromClient.get("nick") + "</div>"
            clientColor = fromClient.get("color").toRGB()
            $ghostCursor.css
              background: clientColor
              color: clientColor
              top: pos.top
              left: pos.left


        _.each @socketEvents, (value, key) ->
          socket.on key + ":" + self.channelKey, value


        #On successful reconnect, attempt to rejoin the room
        socket.on "reconnect", ->

          #Resend the subscribe event
          socket.emit "subscribe",
            room: self.channelName
            subchannel: self.subchannelName
            reconnect: true



      applyChanges: (change) ->
        editor = @editor
        editor.replaceRange change.text, change.from, change.to
        while change.next isnt `undefined` # apply all the changes we receive until there are no more
          change = change.next
          editor.replaceRange change.text, change.from, change.to
    )
    SyncedEditorView