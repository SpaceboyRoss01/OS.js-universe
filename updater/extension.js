/* global OSjs */
(function(Utils,VFS,API,GUI) {
    var Core = OSjs.Core;
    function init(metadata,done) {
        var pm = Core.getPackageManager();
        setInterval(function() {
            OSjs.Extensions["updater"].process._onMessage("update",{},{});
        },60000);
        OSjs.Extensions["updater"].process = new OSjs.Core.Process("Updater",{},metadata);
        OSjs.Extensions["updater"].process._on("message",function(msg, object, options) {
            var pm = Core.getPackageManager();
            for(var i = 0;i < pm.getPackages().length;i++) {
                console.log("[Updater] Checking "+pm.getPackages()[i]+" for updates");
                if(pm.getPackages()[i]) {
                    console.log("[Updater] "+pm.getPackages()[i]+" has an update availible");
                    API.createNotification({
                        icon: "status/dialog-information.png",
                        title: "Update Availible",
                        message: "A new update is availible for "+pm.getPackages()[i],
                        timeout: 60000,
                        onClick: function(event) {
                        }
                    });
                }
                console.log("[Updater] Checked "+pm.getPackages()[i]+" for updates");
            }
        });
        for(var i = 0;i < Object.keys(OSjs.Extensions["updater"]).length;i++) {
            OSjs.Extensions["updater"].process[Object.keys(OSjs.Extensions["updater"])[i]] = OSjs.Extensions["updater"].process[Object.keys(OSjs.Extensions["updater"])[i]];
        }
        done();
    }
    function checkPackage(name) {
        var pm = Core.getPackageManager();
        var pkg = pm.getPackage(name);
        
        var package = OSjs.Applications[pkg.className] || OSjs.Extensions[pkg.className];
        
        if(package.onUpdate) {
            return package.onUpdate(OSjs.Extensions["updater"].Events.CHECK);
        }
        return false;
    }
    
    function updatePackage(name) {
        if(!checkPackage(name)) return false;
        
        var pm = Core.getPackageManager();
        var pkg = pm.getPackage(name);
        
        var package = OSjs.Applications[pkg.className] || OSjs.Extensions[pkg.className];
        
        if(package.onUpdate) {
            return package.onUpdate(OSjs.Extensions["updater"].Events.UPDATE);
        }
        return false;
    }
    
    function onUpdate(event) {
        switch(event) {
            case OSjs.Extensions["updater"].Events.CHECK:
                var response = false;
                API.curl({
                    url: "https://raw.githubusercontent.com/SpaceboyRoss01/OS.js-universe/master/updater/metadata.json",
                    method: "GET"
                },function(err,res) {
                    if(err) throw new Error(err);
                    var metadata = JSON.parse(res.body);
                    console.log(metadata.version + " > "+OSjs.Extensions["updater"].VERSION);
                    response = metadata.version > OSjs.Extensions["updater"].VERSION;
                });
                return response;
            case OSjs.Extensions["updater"].Events.UPDATE:
                var r = false;
                var pm = Core.getPackageManager();
                API.curl({
                    url: "https://raw.githubusercontent.com/SpaceboyRoss01/OS.js-universe/master/bin/updater.zip",
                    method: "GET"
                },function(err,res) {
                    if(err) throw new Error(err);
                    VFS.write("home:///.updater.zip",res.body,function(error,response) {
                        if(error) throw new Error(error);
                        pm.install(new VFS.File("home:///.updater.zip"),"home:///.packages",function(e) {
                            if(e) throw new Error(e);
                        });
                    });
                });
                return r;
        }
    }
    
    OSjs.Extensions["updater"] = OSjs.Extensions["updater"] || {};
    OSjs.Extensions["updater"].init = init;
    OSjs.Extensions["updater"].checkPackage = checkPackage;
    OSjs.Extensions["updater"].updatePackage = updatePackage;
    OSjs.Extensions["updater"].onUpdate = onUpdate;
    OSjs.Extensions["updater"].Events = {
        CHECK: 0,
        UPDATE: 1
    };
    OSjs.Extensions["updater"].VERSION = 0;
})(OSjs.Utils,OSjs.VFS,OSjs.API,OSjs.GUI);