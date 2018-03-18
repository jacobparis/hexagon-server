module.exports.createHandler = function (method) {
    return new Handler(method);
}

class Handler {
    constructor(method) {
        this.method = method;
    };

    process(params) {
        return this.method.apply(this, params);
    }
}