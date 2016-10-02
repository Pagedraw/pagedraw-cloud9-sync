define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "ui", "commands", "menus", "preferences", "settings", "fs"
    ];
    main.provides = ["pagedraw_sync"];
    return main;

    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var ui = imports.ui;
        var menus = imports.menus;
        var commands = imports.commands;
        var settings = imports.settings;
        var prefs = imports.preferences;
        var fs = imports.fs;

        /***** Initialization *****/

        var plugin = new Plugin("Pagedraw.io", main.consumes);
        var emit = plugin.getEmitter();

        var iframe;

        function load() {
            // Set up communication iframe
            fs.readFile(".pagedraw_sync_app", function(err, contents) {
                if (err) {
                    console.log("[Pagedraw] config not found")
                    return;
                }

                var app_id = JSON.parse(contents).app_id;

                iframe = document.createElement("iframe");
                iframe.src = "https://pagedraw.io/apps/"+app_id+"/_cloud9/sync";
                iframe.style.display = "none";
                document.body.appendChild(iframe);
                window.addEventListener("message", postMessageHandler, false);
            });
        }

        function postMessageHandler(event) {
            // if (event.origin != "https://pagedraw.io") {
            //     throw new Error("under attack! Taking evasive action!");
            // }

            if (event.data.sender !== "PagedrawSyncPage") {
                // this message isn't for us
                return;
            }

            if (event.data.content.error) {
                console.error("[PagedrawSync] error", event.data.content.error);
                return;
            }

            var files = event.data.content.files;

            for (let [file_path, content] of files) {
                fs.writeFile(file_path, content, function(err){
                    if (err) {
                        console.log("[PagedrawSync] error writing", file_path, err);
                        return;
                    }
                    console.log("[PagedrawSync] wrote", file_path);
                });
            }
        }

        /***** Methods *****/

        /***** Lifecycle *****/

        plugin.on("load", function() {
            load();
        });
        plugin.on("unload", function() {
            if (iframe) {
                window.removeEventListener("message", postMessageHandler);
                document.removeChild(iframe);
                iframe = null;
            }
        });

        register(null, {
            "pagedraw_sync": plugin
        });
    }
});
