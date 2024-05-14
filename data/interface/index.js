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
  "key": async function (p) {
    const usages = ["encrypt", "decrypt"];
    const buffer = config.file.convert.to.arraybuffer.string(p);
    const algo = {"digest": {"name": "SHA-256"}, "import": {"name": "AES-CBC"}};
    /*  */
    return crypto.subtle.digest(algo.digest, buffer).then(data => crypto.subtle.importKey("raw", data, algo.import, false, usages));
  },
  "error": function (e) {
    window.alert(e);
    config.loader.hide();
    /*  */
    document.querySelector(".info").removeAttribute("state");
    document.querySelector(".result-file").removeAttribute("state");
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
  "listener": {
    "dragover": function (e) {
      e.preventDefault();
    },
    "drop": function (e) {
      if (!e.target.id || e.target.id.indexOf("-input") === -1) {
        e.preventDefault();
      }
    }
  },
  "password": function (name) {
    const password_1 = document.getElementById(name + "-password-1").value;
    const password_2 = document.getElementById(name + "-password-2").value;
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
            const bytes = new Uint8Array(s.length);
            for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
            return bytes;
          }
        }
      }
    }
  },
  "loader": {
    "hide": function () {
      const loader = document.querySelector(".loader");
      if (loader) loader.remove();
    },
    "show": function () {
      const loader = document.createElement("div");
      const result = document.querySelector(".result-file");
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
    const a = document.createElement('a');
    const icon = document.querySelector(".result-icon");
    const result = document.querySelector(".result-file");
    result.textContent = '';
    /*  */
    a.href = href;
    a.download = filename;
    result.appendChild(a);
    a.textContent = filename;
    icon.setAttribute("download", '');
    result.setAttribute("state", filename.indexOf("encrypted") !== -1 ? "encrypted" : "decrypted");
    a.click();
    /*  */
    window.setTimeout(function () {
      config.loader.hide();
    }, 300);
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          const current = await chrome.windows.getCurrent();
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
      const context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.documentElement.style.width = "750px";
              document.documentElement.style.height = "600px";
              document.querySelector(".separator").style.height = "38px";
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
          let tmp = {};
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
    const reload = document.getElementById("reload");
    const support = document.getElementById("support");
    const icon = document.querySelector(".result-icon");
    const donation = document.getElementById("donation");
    /*  */
    reload.addEventListener("click", function () {
      document.location.reload();
    }, false);
    /*  */
    support.addEventListener("click", function () {
      const url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      const url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    icon.addEventListener("click", function () {
      const file = document.querySelector(".result-file");
      const anchor = file.querySelector('a');
      if (anchor) {
        anchor.click();
      }
    }, false);
    /*  */
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "app": {
    "start": function () {
      config.loader.hide();
      /*  */
      const encrypt = {};
      const decrypt = {};
      /*  */
      encrypt.input = document.getElementById("encrypt-input");
      decrypt.input = document.getElementById("decrypt-input");
      decrypt.button = document.getElementById("decrypt-button");
      encrypt.button = document.getElementById("encrypt-button");
      /*  */
      encrypt.input.addEventListener("change", function (e) {
        if (e.target.files.length !== 1) return window.alert("Please select a file to encrypt!");
        /*  */
        const filereader = new FileReader();
        const info = document.querySelector(".info");
        const icon = document.querySelector(".result-icon");
        const result = document.querySelector(".result-file");
        /*  */
        result.textContent = '';
        result.removeAttribute("state");
        icon.removeAttribute("download");
        URL.revokeObjectURL(config.blob);
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
        const filereader = new FileReader();
        const info = document.querySelector(".info");
        const icon = document.querySelector(".result-icon");
        const result = document.querySelector(".result-file");
        /*  */
        result.textContent = '';
        result.removeAttribute("state");
        icon.removeAttribute("download");
        URL.revokeObjectURL(config.blob);
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
        const password = config.password("encrypt");
        const ivector = crypto.getRandomValues(new Uint8Array(16));
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
                      const href = URL.createObjectURL(config.blob);
                      const filename = config.file.encrypt.name + ".encrypted";
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
        const password = config.password("decrypt");
        const ivector = crypto.getRandomValues(new Uint8Array(16));
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
                      const href = URL.createObjectURL(config.blob);
                      const filename = config.file.decrypt.name.replace(".encrypted", '');
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

window.addEventListener("load", config.load, false);
window.addEventListener("drop", config.listener.drop);
window.addEventListener("dragover", config.listener.dragover);
window.addEventListener("resize", config.resize.method, false);
