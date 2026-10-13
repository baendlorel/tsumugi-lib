if (!Map.prototype.getOrInsert) {
  Map.prototype.getOrInsert = function (key, value) {
    if (!this.has(key)) {
      this.set(key, value);
    }
    return this.get(key);
  };
}

if (!Map.prototype.getOrInsertComputed) {
  Map.prototype.getOrInsertComputed = function (key, compute) {
    if (!this.has(key)) {
      this.set(key, compute(key));
    }
    return this.get(key);
  };
}
