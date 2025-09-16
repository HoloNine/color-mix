// Lightweight version of chroma.js with only the functions needed for color palette generation
// Supports: chroma constructor, get('hsl.l'), set('hsl.l'), saturate(), desaturate(), hex()

// Math utility functions
var min = Math.min;
var max = Math.max;
var sqrt = Math.sqrt;
var atan2 = Math.atan2;
var round = Math.round;
var sin = Math.sin;
var cos = Math.cos;
var pow = Math.pow;
var sign = Math.sign;

// Constants
var PI = Math.PI;
var DEG2RAD = PI / 180;
var RAD2DEG = 180 / PI;

// Utility functions
function limit(x, low = 0, high = 1) {
  return min(max(low, x), high);
}

function clip_rgb(rgb) {
  rgb._clipped = false;
  rgb._unclipped = rgb.slice(0);
  for (var i = 0; i <= 3; i++) {
    if (i < 3) {
      if (rgb[i] < 0 || rgb[i] > 255) {
        rgb._clipped = true;
      }
      rgb[i] = limit(rgb[i], 0, 255);
    } else if (i === 3) {
      rgb[i] = limit(rgb[i], 0, 1);
    }
  }
  return rgb;
}

// Type detection (simplified)
var classToType = {};
[
  "Boolean",
  "Number",
  "String",
  "Function",
  "Array",
  "Date",
  "RegExp",
  "Undefined",
  "Null",
].forEach((name, i) => {
  classToType["[object " + name + "]"] = name.toLowerCase();
});

function type(obj) {
  return classToType[Object.prototype.toString.call(obj)] || "object";
}

function unpack(args, keyOrder = null) {
  if (args.length >= 3) {
    return Array.prototype.slice.call(args);
  }
  if (type(args[0]) === "object" && keyOrder) {
    return keyOrder
      .split("")
      .filter((k) => args[0][k] !== undefined)
      .map((k) => args[0][k]);
  }
  return args[0].slice(0);
}

function last(args) {
  if (args.length < 2) return null;
  var l = args.length - 1;
  if (type(args[l]) === "string") {
    return args[l].toLowerCase();
  }
  return null;
}

// Lab constants
var labConstants = {
  Kn: 18,
  labWhitePoint: "d65",
  Xn: 0.95047,
  Yn: 1,
  Zn: 1.08883,
  t0: 0.137931034,
  t1: 0.206896552,
  t2: 0.12841855,
  t3: 0.008856452,
  kE: 216.0 / 24389.0,
  kKE: 8.0,
  kK: 24389.0 / 27.0,
  RefWhiteRGB: {
    X: 0.95047,
    Y: 1,
    Z: 1.08883,
  },
  MtxRGB2XYZ: {
    m00: 0.4124564390896922,
    m01: 0.21267285140562253,
    m02: 0.0193338955823293,
    m10: 0.357576077643909,
    m11: 0.715152155287818,
    m12: 0.11919202588130297,
    m20: 0.18043748326639894,
    m21: 0.07217499330655958,
    m22: 0.9503040785363679,
  },
  MtxXYZ2RGB: {
    m00: 3.2404541621141045,
    m01: -0.9692660305051868,
    m02: 0.055643430959114726,
    m10: -1.5371385127977166,
    m11: 1.8760108454466942,
    m12: -0.2040259135167538,
    m20: -0.498531409556016,
    m21: 0.041556017530349834,
    m22: 1.0572251882231791,
  },
  As: 0.9414285350000001,
  Bs: 1.040417467,
  Cs: 1.089532651,
  MtxAdaptMa: {
    m00: 0.8951,
    m01: -0.7502,
    m02: 0.0389,
    m10: 0.2664,
    m11: 1.7135,
    m12: -0.0685,
    m20: -0.1614,
    m21: 0.0367,
    m22: 1.0296,
  },
  MtxAdaptMaI: {
    m00: 0.9869929054667123,
    m01: 0.43230526972339456,
    m02: -0.008528664575177328,
    m10: -0.14705425642099013,
    m11: 0.5183602715367776,
    m12: 0.04004282165408487,
    m20: 0.15996265166373125,
    m21: 0.0492912282128556,
    m22: 0.9684866957875502,
  },
};

// Hex color recognition patterns
var RE_HEX = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
var RE_HEXA = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/;

// Conversion functions

// Gamma adjustment for sRGB
function gammaAdjustSRGB(companded) {
  var sign = Math.sign(companded);
  companded = Math.abs(companded);
  var linear =
    companded <= 0.04045
      ? companded / 12.92
      : Math.pow((companded + 0.055) / 1.055, 2.4);
  return linear * sign;
}

// RGB to XYZ conversion
var rgb2xyz = function (r, g, b) {
  r = gammaAdjustSRGB(r / 255);
  g = gammaAdjustSRGB(g / 255);
  b = gammaAdjustSRGB(b / 255);

  var MtxRGB2XYZ = labConstants.MtxRGB2XYZ;
  var MtxAdaptMa = labConstants.MtxAdaptMa;
  var MtxAdaptMaI = labConstants.MtxAdaptMaI;
  var Xn = labConstants.Xn;
  var Yn = labConstants.Yn;
  var Zn = labConstants.Zn;
  var As = labConstants.As;
  var Bs = labConstants.Bs;
  var Cs = labConstants.Cs;

  var x = r * MtxRGB2XYZ.m00 + g * MtxRGB2XYZ.m10 + b * MtxRGB2XYZ.m20;
  var y = r * MtxRGB2XYZ.m01 + g * MtxRGB2XYZ.m11 + b * MtxRGB2XYZ.m21;
  var z = r * MtxRGB2XYZ.m02 + g * MtxRGB2XYZ.m12 + b * MtxRGB2XYZ.m22;

  var Ad = Xn * MtxAdaptMa.m00 + Yn * MtxAdaptMa.m10 + Zn * MtxAdaptMa.m20;
  var Bd = Xn * MtxAdaptMa.m01 + Yn * MtxAdaptMa.m11 + Zn * MtxAdaptMa.m21;
  var Cd = Xn * MtxAdaptMa.m02 + Yn * MtxAdaptMa.m12 + Zn * MtxAdaptMa.m22;

  var X = x * MtxAdaptMa.m00 + y * MtxAdaptMa.m10 + z * MtxAdaptMa.m20;
  var Y = x * MtxAdaptMa.m01 + y * MtxAdaptMa.m11 + z * MtxAdaptMa.m21;
  var Z = x * MtxAdaptMa.m02 + y * MtxAdaptMa.m12 + z * MtxAdaptMa.m22;

  X *= Ad / As;
  Y *= Bd / Bs;
  Z *= Cd / Cs;

  x = X * MtxAdaptMaI.m00 + Y * MtxAdaptMaI.m10 + Z * MtxAdaptMaI.m20;
  y = X * MtxAdaptMaI.m01 + Y * MtxAdaptMaI.m11 + Z * MtxAdaptMaI.m21;
  z = X * MtxAdaptMaI.m02 + Y * MtxAdaptMaI.m12 + Z * MtxAdaptMaI.m22;

  return [x, y, z];
};

// XYZ to Lab conversion
function xyz2lab(x, y, z) {
  var Xn = labConstants.Xn;
  var Yn = labConstants.Yn;
  var Zn = labConstants.Zn;
  var kE = labConstants.kE;
  var kK = labConstants.kK;
  var xr = x / Xn;
  var yr = y / Yn;
  var zr = z / Zn;

  var fx = xr > kE ? pow(xr, 1 / 3) : (kK * xr + 16) / 116;
  var fy = yr > kE ? pow(yr, 1 / 3) : (kK * yr + 16) / 116;
  var fz = zr > kE ? pow(zr, 1 / 3) : (kK * zr + 16) / 116;

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

// RGB to Lab conversion
var rgb2lab = function () {
  var args = Array.prototype.slice.call(arguments);
  args = unpack(args, "rgb");
  var r = args[0];
  var g = args[1];
  var b = args[2];
  var rest = args.slice(3);
  var ref = rgb2xyz(r, g, b);
  var x = ref[0];
  var y = ref[1];
  var z = ref[2];
  var ref2 = xyz2lab(x, y, z);
  var L = ref2[0];
  var a = ref2[1];
  var b_ = ref2[2];
  return [L, a, b_].concat(rest.length > 0 && rest[0] < 1 ? [rest[0]] : []);
};

// Lab to LCH conversion
var lab2lch = function () {
  var args = Array.prototype.slice.call(arguments);
  args = unpack(args, "lab");
  var l = args[0];
  var a = args[1];
  var b = args[2];
  var c = sqrt(a * a + b * b);
  var h = (atan2(b, a) * RAD2DEG + 360) % 360;
  if (round(c * 10000) === 0) {
    h = Number.NaN;
  }
  return [l, c, h];
};

// RGB to LCH conversion
var rgb2lch = function () {
  var args = Array.prototype.slice.call(arguments);
  var ref = unpack(args, "rgb");
  var r = ref[0];
  var g = ref[1];
  var b = ref[2];
  var rest = ref.slice(3);
  var ref1 = rgb2lab(r, g, b);
  var l = ref1[0];
  var a = ref1[1];
  var b_ = ref1[2];
  var ref2 = lab2lch(l, a, b_);
  var L = ref2[0];
  var c = ref2[1];
  var h = ref2[2];
  return [L, c, h].concat(rest.length > 0 && rest[0] < 1 ? [rest[0]] : []);
};

// LCH to Lab conversion
var lch2lab = function () {
  var args = Array.prototype.slice.call(arguments);
  args = unpack(args, "lch");
  var l = args[0];
  var c = args[1];
  var h = args[2];
  if (isNaN(h)) h = 0;
  h = h * DEG2RAD;
  return [l, cos(h) * c, sin(h) * c];
};

// Lab to XYZ conversion
var lab2xyz = function (L, a, b) {
  var kE = labConstants.kE;
  var kK = labConstants.kK;
  var kKE = labConstants.kKE;
  var Xn = labConstants.Xn;
  var Yn = labConstants.Yn;
  var Zn = labConstants.Zn;

  var fy = (L + 16.0) / 116.0;
  var fx = 0.002 * a + fy;
  var fz = fy - 0.005 * b;

  var fx3 = fx * fx * fx;
  var fz3 = fz * fz * fz;

  var xr = fx3 > kE ? fx3 : (116.0 * fx - 16.0) / kK;
  var yr = L > kKE ? pow((L + 16.0) / 116.0, 3.0) : L / kK;
  var zr = fz3 > kE ? fz3 : (116.0 * fz - 16.0) / kK;

  var x = xr * Xn;
  var y = yr * Yn;
  var z = zr * Zn;

  return [x, y, z];
};

// XYZ to RGB conversion (reverse gamma)
var compand = function (linear) {
  var sign = Math.sign(linear);
  linear = Math.abs(linear);
  var companded =
    linear <= 0.0031308 ? linear * 12.92 : 1.055 * pow(linear, 1 / 2.4) - 0.055;
  return companded * sign;
};

var xyz2rgb = function (x, y, z) {
  var MtxXYZ2RGB = labConstants.MtxXYZ2RGB;
  var MtxAdaptMa = labConstants.MtxAdaptMa;
  var MtxAdaptMaI = labConstants.MtxAdaptMaI;
  var RefWhiteRGB = labConstants.RefWhiteRGB;
  var As = labConstants.As;
  var Bs = labConstants.Bs;
  var Cs = labConstants.Cs;

  var Ad =
    RefWhiteRGB.X * MtxAdaptMa.m00 +
    RefWhiteRGB.Y * MtxAdaptMa.m10 +
    RefWhiteRGB.Z * MtxAdaptMa.m20;
  var Bd =
    RefWhiteRGB.X * MtxAdaptMa.m01 +
    RefWhiteRGB.Y * MtxAdaptMa.m11 +
    RefWhiteRGB.Z * MtxAdaptMa.m21;
  var Cd =
    RefWhiteRGB.X * MtxAdaptMa.m02 +
    RefWhiteRGB.Y * MtxAdaptMa.m12 +
    RefWhiteRGB.Z * MtxAdaptMa.m22;

  var X = x * MtxAdaptMa.m00 + y * MtxAdaptMa.m10 + z * MtxAdaptMa.m20;
  var Y = x * MtxAdaptMa.m01 + y * MtxAdaptMa.m11 + z * MtxAdaptMa.m21;
  var Z = x * MtxAdaptMa.m02 + y * MtxAdaptMa.m12 + z * MtxAdaptMa.m22;

  X *= As / Ad;
  Y *= Bs / Bd;
  Z *= Cs / Cd;

  x = X * MtxAdaptMaI.m00 + Y * MtxAdaptMaI.m10 + Z * MtxAdaptMaI.m20;
  y = X * MtxAdaptMaI.m01 + Y * MtxAdaptMaI.m11 + Z * MtxAdaptMaI.m21;
  z = X * MtxAdaptMaI.m02 + Y * MtxAdaptMaI.m12 + Z * MtxAdaptMaI.m22;

  var r = x * MtxXYZ2RGB.m00 + y * MtxXYZ2RGB.m10 + z * MtxXYZ2RGB.m20;
  var g = x * MtxXYZ2RGB.m01 + y * MtxXYZ2RGB.m11 + z * MtxXYZ2RGB.m21;
  var b = x * MtxXYZ2RGB.m02 + y * MtxXYZ2RGB.m12 + z * MtxXYZ2RGB.m22;

  r = compand(r) * 255;
  g = compand(g) * 255;
  b = compand(b) * 255;

  return [r, g, b];
};

// Lab to RGB conversion
var lab2rgb = function () {
  var args = Array.prototype.slice.call(arguments);
  args = unpack(args, "lab");
  var L = args[0];
  var a = args[1];
  var b = args[2];
  var ref = lab2xyz(L, a, b);
  var x = ref[0];
  var y = ref[1];
  var z = ref[2];
  var ref1 = xyz2rgb(x, y, z);
  var r = ref1[0];
  var g = ref1[1];
  var b_ = ref1[2];
  return [r, g, b_, args.length > 3 ? args[3] : 1];
};

// LCH to RGB conversion
var lch2rgb = function () {
  var args = Array.prototype.slice.call(arguments);
  args = unpack(args, "lch");
  var l = args[0];
  var c = args[1];
  var h = args[2];
  var ref = lch2lab(l, c, h);
  var L = ref[0];
  var a = ref[1];
  var b_ = ref[2];
  var ref1 = lab2rgb(L, a, b_);
  var r = ref1[0];
  var g = ref1[1];
  var b = ref1[2];
  return [r, g, b, args.length > 3 ? args[3] : 1];
};

// RGB to HSL conversion
var rgb2hsl = function () {
  var args = Array.prototype.slice.call(arguments);
  args = unpack(args, "rgba");
  var r = args[0];
  var g = args[1];
  var b = args[2];

  r /= 255;
  g /= 255;
  b /= 255;

  var minRgb = min(r, g, b);
  var maxRgb = max(r, g, b);

  var l = (maxRgb + minRgb) / 2;
  var s, h;

  if (maxRgb === minRgb) {
    s = 0;
    h = Number.NaN;
  } else {
    s =
      l < 0.5
        ? (maxRgb - minRgb) / (maxRgb + minRgb)
        : (maxRgb - minRgb) / (2 - maxRgb - minRgb);
  }

  if (r == maxRgb) {
    h = (g - b) / (maxRgb - minRgb);
  } else if (g == maxRgb) {
    h = 2 + (b - r) / (maxRgb - minRgb);
  } else if (b == maxRgb) {
    h = 4 + (r - g) / (maxRgb - minRgb);
  }

  h *= 60;
  if (h < 0) h += 360;

  if (args.length > 3 && args[3] !== undefined) {
    return [h, s, l, args[3]];
  }
  return [h, s, l];
};

// HSL to RGB conversion
var hsl2rgb = function () {
  var args = Array.prototype.slice.call(arguments);
  args = unpack(args, "hsl");
  var h = args[0];
  var s = args[1];
  var l = args[2];
  var r, g, b;

  if (s === 0) {
    r = g = b = l * 255;
  } else {
    var t3 = [0, 0, 0];
    var c = [0, 0, 0];
    var t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var t1 = 2 * l - t2;
    var h_ = h / 360;
    t3[0] = h_ + 1 / 3;
    t3[1] = h_;
    t3[2] = h_ - 1 / 3;

    for (var i = 0; i < 3; i++) {
      if (t3[i] < 0) t3[i] += 1;
      if (t3[i] > 1) t3[i] -= 1;
      if (6 * t3[i] < 1) {
        c[i] = t1 + (t2 - t1) * 6 * t3[i];
      } else if (2 * t3[i] < 1) {
        c[i] = t2;
      } else if (3 * t3[i] < 2) {
        c[i] = t1 + (t2 - t1) * (2 / 3 - t3[i]) * 6;
      } else {
        c[i] = t1;
      }
    }
    r = c[0] * 255;
    g = c[1] * 255;
    b = c[2] * 255;
  }

  if (args.length > 3) {
    return [r, g, b, args[3]];
  }
  return [r, g, b, 1];
};

// Hex parsing and generation
var hex2rgb = function (hex) {
  if (hex.match(RE_HEX)) {
    // remove optional leading #
    if (hex.length === 4 || hex.length === 7) {
      hex = hex.substr(1);
    }
    // expand short-notation to full six-digit
    if (hex.length === 3) {
      hex = hex.split("");
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    var u = parseInt(hex, 16);
    var r = u >> 16;
    var g = (u >> 8) & 0xff;
    var b = u & 0xff;
    return [r, g, b, 1];
  }

  if (hex.match(RE_HEXA)) {
    if (hex.length === 5 || hex.length === 9) {
      // remove optional leading #
      hex = hex.substr(1);
    }
    // expand short-notation to full eight-digit
    if (hex.length === 4) {
      hex = hex.split("");
      hex =
        hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    var u1 = parseInt(hex, 16);
    var r1 = (u1 >> 24) & 0xff;
    var g1 = (u1 >> 16) & 0xff;
    var b1 = (u1 >> 8) & 0xff;
    var a = Math.round(((u1 & 0xff) / 0xff) * 100) / 100;
    return [r1, g1, b1, a];
  }

  throw new Error("unknown hex color: " + hex);
};

var rgb2hex = function () {
  var args = Array.prototype.slice.call(arguments);
  var ref = unpack(args, "rgba");
  var r = ref[0];
  var g = ref[1];
  var b = ref[2];
  var a = ref[3];
  var mode = last(args) || "auto";
  if (a === undefined) a = 1;
  if (mode === "auto") {
    mode = a < 1 ? "rgba" : "rgb";
  }
  r = round(r);
  g = round(g);
  b = round(b);
  var u = (r << 16) | (g << 8) | b;
  var str = "000000" + u.toString(16);
  str = str.substr(str.length - 6);
  var hxa = "0" + round(a * 255).toString(16);
  hxa = hxa.substr(hxa.length - 2);
  switch (mode.toLowerCase()) {
    case "rgba":
      return "#" + str + hxa;
    case "argb":
      return "#" + hxa + str;
    default:
      return "#" + str;
  }
};

// Input/format detection system
var input = {
  format: {},
  autodetect: [],
  sorted: false,
};

// Register hex format
input.format.hex = hex2rgb;
input.autodetect.push({
  p: 4,
  test: function (h) {
    var args = Array.prototype.slice.call(arguments);
    if (
      args.length === 1 &&
      type(args[0]) === "string" &&
      (args[0].match(RE_HEX) || args[0].match(RE_HEXA))
    ) {
      return "hex";
    }
  },
});

// Register HSL format
input.format.hsl = hsl2rgb;
input.autodetect.push({
  p: 2,
  test: function () {
    var args = Array.prototype.slice.call(arguments);
    args = unpack(args, "hsl");
    if (type(args) === "array" && args.length === 3) {
      return "hsl";
    }
  },
});

// Register LCH format
input.format.lch = lch2rgb;
input.autodetect.push({
  p: 2,
  test: function () {
    var args = Array.prototype.slice.call(arguments);
    args = unpack(args, "lch");
    if (type(args) === "array" && args.length === 3) {
      return "lch";
    }
  },
});

// Color class
var Color = function Color() {
  var args = Array.prototype.slice.call(arguments);
  var me = this;

  if (
    type(args[0]) === "object" &&
    args[0].constructor &&
    args[0].constructor === this.constructor
  ) {
    // the argument is already a Color instance
    return args[0];
  }

  // last argument could be the mode
  var mode = last(args);
  var autodetect = false;

  if (!mode) {
    autodetect = true;

    if (!input.sorted) {
      input.autodetect = input.autodetect.sort(function (a, b) {
        return b.p - a.p;
      });
      input.sorted = true;
    }

    // auto-detect format
    for (var i = 0; i < input.autodetect.length; i++) {
      var chk = input.autodetect[i];
      mode = chk.test.apply(chk, args);
      if (mode) break;
    }
  }

  if (input.format[mode]) {
    var rgb = input.format[mode].apply(
      null,
      autodetect ? args : args.slice(0, -1)
    );
    me._rgb = clip_rgb(rgb);
  } else {
    throw new Error("unknown format: " + args);
  }

  // add alpha channel
  if (me._rgb.length === 3) {
    me._rgb.push(1);
  }
};

// Color prototype methods
Color.prototype.toString = function () {
  if (type(this.hex) === "function") {
    return this.hex();
  }
  return "[" + this._rgb.join(",") + "]";
};

Color.prototype.hex = function (mode) {
  return rgb2hex(this._rgb, mode);
};

Color.prototype.hsl = function () {
  return rgb2hsl(this._rgb);
};

Color.prototype.lch = function () {
  return rgb2lch(this._rgb);
};

Color.prototype.alpha = function (a, mutate = false) {
  if (a !== undefined && type(a) === "number") {
    if (mutate) {
      this._rgb[3] = a;
      return this;
    }
    return new Color([this._rgb[0], this._rgb[1], this._rgb[2], a], "rgb");
  }
  return this._rgb[3];
};

Color.prototype.get = function (mc) {
  var ref = mc.split(".");
  var mode = ref[0];
  var channel = ref[1];
  var src = this[mode]();

  if (channel) {
    var i = mode.indexOf(channel) - (mode.substr(0, 2) === "ok" ? 2 : 0);
    if (i > -1) {
      return src[i];
    }
    throw new Error("unknown channel " + channel + " in mode " + mode);
  } else {
    return src;
  }
};

Color.prototype.set = function (mc, value, mutate = false) {
  var ref = mc.split(".");
  var mode = ref[0];
  var channel = ref[1];
  var src = this[mode]();

  if (channel) {
    var i = mode.indexOf(channel) - (mode.substr(0, 2) === "ok" ? 2 : 0);
    if (i > -1) {
      if (type(value) === "string") {
        switch (value.charAt(0)) {
          case "+":
            src[i] += +value;
            break;
          case "-":
            src[i] += +value;
            break;
          case "*":
            src[i] *= +value.substr(1);
            break;
          case "/":
            src[i] /= +value.substr(1);
            break;
          default:
            src[i] = +value;
        }
      } else if (type(value) === "number") {
        src[i] = value;
      } else {
        throw new Error("unsupported value for Color.set");
      }
      var out = new Color(src, mode);
      if (mutate) {
        this._rgb = out._rgb;
        return this;
      }
      return out;
    }
    throw new Error("unknown channel " + channel + " in mode " + mode);
  } else {
    return src;
  }
};

Color.prototype.saturate = function (amount = 1) {
  var me = this;
  var lch = me.lch();
  lch[1] += labConstants.Kn * amount;
  if (lch[1] < 0) lch[1] = 0;
  return new Color(lch, "lch").alpha(me.alpha(), true);
};

Color.prototype.desaturate = function (amount = 1) {
  return this.saturate(-amount);
};

// Main chroma constructor
var chroma = function () {
  var args = Array.prototype.slice.call(arguments);
  return new (Function.prototype.bind.apply(Color, [null].concat(args)))();
};

chroma.version = "3.1.2-light";

export default chroma;
