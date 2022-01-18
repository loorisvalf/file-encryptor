var config = {
  "blob": null,
  "reader": {
    "encrypt": new FileReader(),
    "decrypt": new FileReader()
  },
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "key": function (p) {
    var usages = ["encrypt", "decrypt"];
    var buffer = config.file.convert.to.arraybuffer.string(p);
    var algo = {"digest": {"name": "SHA-256"}, "import": {"name": "AES-CBC"}};
    return crypto.subtle.digest(algo.digest, buffer).then(data => crypto.subtle.importKey("raw", data, algo.import, false, usages));
  },
  "error": function (e) {
    window.alert(e);
    config.loader.hide();
    /*  */
    document.querySelector(".info").removeAttribute("state");
    document.querySelector(".result").removeAttribute("state");
  },
  "encrypt": async function (ivector, key) {
    try {
      return await crypto.subtle.encrypt({
        "iv": ivector,
        "name": "AES-CBC"
      }, key, config.file.convert.to.arraybuffer.encrypt);
    } catch (e) {}
  },
  "decrypt": async function (ivector, key) {
    try {
      return await crypto.subtle.decrypt({
        "iv": ivector,
        "name": "AES-CBC",
      }, key, config.file.convert.to.arraybuffer.decrypt);
    } catch (e) {}
  },
  "password": function (name) {
    var password_1 = document.getElementById(name + "-password-1").value;
    var password_2 = document.getElementById(name + "-password-2").value;
    /*  */
    if (!password_1) window.alert("Please enter a password in the 1st field (min 7 characters).");
    else if (!password_2) window.alert("Please enter a password in the 2nd field (min 7 characters).");
    else if (password_1 && password_1.length < 7) window.alert("Please choose a longer password for the 1st field!");
    else if (password_2 && password_2.length < 7) window.alert("Please choose a longer password for the 2nd field!");
    else if (password_1 && password_2 &&  password_1 !== password_2) window.alert("Passwords (fields 1 & 2) must be the same!");
    else {}
    /*  */
    return password_1 && password_2 && password_1 === password_2 && password_1.length >= 7 ? password_1 : null;
  },
  "file": {
    "encrypt": null,
    "decrypt": null,
    "convert": {
      "to": {
        "arraybuffer": {
          "encrypt": null,
          "decrypt": null,
          "string": function (s) {
            var bytes = new Uint8Array(s.length);
            for (var i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
            return bytes;
          }
        }
      }
    }
  },
  "loader": {
    "hide": function () {
      var loader = document.querySelector(".loader");
      if (loader) loader.remove();
    },
    "show": function () {
      var loader = document.createElement("div");
      var result = document.querySelector(".result");
      /*  */
      loader.setAttribute("class", "loader");
      loader.appendChild(document.createElement("div"));
      loader.appendChild(document.createElement("div"));
      loader.appendChild(document.createElement("div"));
      loader.appendChild(document.createElement("div"));
      result.appendChild(loader);
    }
  },
  "download": function (href, filename) {
    var a = document.createElement('a');
    var result = document.querySelector(".result");
    result.textContent = '';
    /*  */
    a.href = href;
    a.download = filename;
    a.textContent = filename;
    result.appendChild(a);
    result.setAttribute("state", filename.indexOf("encrypted") !== -1 ? "encrypted" : "decrypted");
    a.click();
    /*  */
    window.setTimeout(function () {
      config.loader.hide();
      URL.revokeObjectURL(href);
      delete config.blob;
    }, 300);
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          var current = await chrome.windows.getCurrent();
          /*  */
          config.storage.write("interface.size", {
            "top": current.top,
            "left": current.left,
            "width": current.width,
            "height": current.height
          });
        }, 1000);
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.documentElement.style.width = "600px";
              document.documentElement.style.height = "500px";
            }
            /*  */
            chrome.runtime.connect({"name": config.port.name});
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          var tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "load": function () {
    var reload = document.getElementById("reload");
    var support = document.getElementById("support");
    var donation = document.getElementById("donation");
    /*  */
    reload.addEventListener("click", function () {
      document.location.reload();
    }, false);
    /*  */
    support.addEventListener("click", function () {
      var url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      var url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "app": {
    "start": function () {
      config.loader.hide();
      /*  */
      var encrypt = {}, decrypt = {};
      encrypt.input = document.getElementById("encrypt-input");
      decrypt.input = document.getElementById("decrypt-input");
      decrypt.button = document.getElementById("decrypt-button");
      encrypt.button = document.getElementById("encrypt-button");
      /*  */
      encrypt.input.addEventListener("change", function (e) {
        if (e.target.files.length !== 1) return window.alert("Please select a file to encrypt!");
        /*  */
        var filereader = new FileReader();
        var info = document.querySelector(".info");
        var result = document.querySelector(".result");
        /*  */
        result.textContent = '';
        result.removeAttribute("state");
        config.file.encrypt = e.target.files[0];
        info.textContent = config.file.encrypt.name;
        filereader.readAsArrayBuffer(config.file.encrypt);
        filereader.onload = function (e) {config.file.convert.to.arraybuffer.encrypt = e.target.result};
        info.setAttribute("state", config.file.encrypt.name.indexOf("encrypted") !== -1 ? "encrypted" : "decrypted");
      });
      /*  */
      decrypt.input.addEventListener("change", function (e) {
        if (e.target.files.length !== 1) return window.alert("Please select a file to decrypt!");
        /*  */
        var filereader = new FileReader();
        var info = document.querySelector(".info");
        var result = document.querySelector(".result");
        /*  */
        result.textContent = '';
        result.removeAttribute("state");
        config.file.decrypt = e.target.files[0];
        info.textContent = config.file.decrypt.name;
        filereader.readAsArrayBuffer(config.file.decrypt);
        filereader.onload = function (e) {config.file.convert.to.arraybuffer.decrypt = e.target.result};
        info.setAttribute("state", config.file.decrypt.name.indexOf("encrypted") !== -1 ? "encrypted" : "decrypted");
      });
      /*  */
      encrypt.button.addEventListener("click", function () {
        if (!config.file.convert.to.arraybuffer.encrypt) {
          return window.alert("Please select a file to encrypt!");
        }
        /*  */
        var password = config.password("encrypt");
        var ivector = crypto.getRandomValues(new Uint8Array(16));
        /*  */
        if (password) {
          config.loader.show();
          window.setTimeout(function () {
            config.key(password).then(key => {
              config.encrypt(ivector, key).then(function (result) {
                if (result) {
                  result = (new Uint8Array(result));
                  if (result) {
                    config.blob = new Blob([ivector, result], {"type": "application/octet-binary"});
                    if (config.blob) {
                      var href = URL.createObjectURL(config.blob);
                      var filename = config.file.encrypt.name + ".encrypted";
                      /*  */
                      config.download(href, filename);
                    } else {
                      config.error("Error (0), corrupted file!");
                    }
                  } else {
                    config.error("Error (1), corrupted file!");
                  }
                } else {
                  config.error("Error (2), corrupted file!");
                }
              });
            });
          }, 1000);
        }
      });
      /*  */
      decrypt.button.addEventListener("click", function () {
        if (!config.file.convert.to.arraybuffer.decrypt) {
          return window.alert("Please select a file to decrypt!");
        }
        /*  */
        var password = config.password("decrypt");
        var ivector = crypto.getRandomValues(new Uint8Array(16));
        /*  */
        if (password) {
          config.loader.show();
          config.key(password).then(key => {
            window.setTimeout(function () {
              config.decrypt(ivector, key).then(function (result) {
                if (result) {
                  result = (new Uint8Array(result)).subarray(16);
                  if (result) {
                    config.blob = new Blob([result], {"type": "application/octet-binary"});
                    if (config.blob) {
                      var href = URL.createObjectURL(config.blob);
                      var filename = config.file.decrypt.name.replace(".encrypted", '');
                      /*  */
                      config.download(href, filename);
                    } else {
                      config.error("Error (0), incorrect password, wrong encrypted, or corrupted file!");
                    }
                  } else {
                    config.error("Error (1), incorrect password, wrong encrypted, or corrupted file!");
                  }
                } else {
                  config.error("Error (2), incorrect password, wrong encrypted, or corrupted file!");
                }
              });
            }, 1000);
          });
        }
      });
    }
  }
};

config.port.connect();

window.addEventListener("dragover", function (e) {
  e.preventDefault();
});

window.addEventListener("drop", function (e) {
  if (!e.target.id || e.target.id.indexOf("-input") === -1) {
    e.preventDefault();
  }
});

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
