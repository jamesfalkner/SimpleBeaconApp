function loadDDL(url, o, tries) {

    tries = tries || 0;

    request({
        url : url,
        method : 'POST',
        params : {
            ddlRecordSetId : o.ddlRecordSetId
        },
        onSuccess : function(result) {
            var resArray = [];

            result.forEach(function(el) {
                if (el.dynamicElements) {
                    resArray.push(el.dynamicElements);
                }
            });
            if (resArray === null) {
                if (o.error) {
                    o.error("not sure what went wrong");
                }
            } else {
                if (o.success) {
                    o.success(resArray);
                }
            }
        },
        onFailure : function(err) {
            if (tries < 3) {
                tries++;
                exports.loadDDL(url, o, tries);
                return;
            } else {
                if (o.error) {
                    o.error("Tried 3 times, and failed, sorry");
                }
                return;
            }

        }
    });
}


function request(options) {

    console.log("request: " + JSON.stringify(options));
    if (!options || !options.url) {
        throw "Request Error: Invalid arguments";
    }

    var xhr = Ti.Network.createHTTPClient({
        timeout : 30000
    });

    xhr.onload = function(e) {
        if (this.responseText == null) {
            if (options.onFailure) {
                options.onFailure("unknown", "none");
                return;
            }
        }
        var resultObj = null;
        try {
            resultObj = JSON.parse(this.responseText);
        } catch (ex) {
            if (options.onFailure) {
                options.onFailure(ex, this.responseText);
                return;
            }
        }
        if (options.onSuccess) {
            options.onSuccess(resultObj);
        }
    };

    xhr.onerror = function(e) {
        if (options.onFailure) {
            options.onFailure('Request failed:' + e.error);
        }
    };
    xhr.open(options.method || 'GET', options.url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    if (options.method == 'POST' && options.params) {
        xhr.send(options.params);
    } else {
        xhr.send();
    }
}

exports.loadDDL = loadDDL;
exports.request = request;

