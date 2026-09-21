.pragma library

// Arithmetic evaluator for the calculator overlay. Hand-written parser, no eval().
//
//   + - * /               basic arithmetic, usual precedence
//   ^ or **               power, right-associative, binds tighter than unary minus (-2^2 = -4)
//   %                     percent when nothing follows: 50% = 0.5, 200*15% = 30
//                         a ± b% applies b percent of a: 80+10% = 88, 80-25% = 60
//                         modulo when an operand follows: 17%5 = 2
//   ( )                   grouping; a number before a group or name multiplies: 2(3+4), 2pi
//   sqrt(x), √x           square root
//   round(x), round(x; n) round half away from zero, optionally to n decimals
//   floor(x), ceil(x)     round down / up
//   pi, π                 3.14159…
//
// Input may use a decimal comma (0,5), ' as thousands separator (1'000), and × ÷ −.
// prettify() is what puts × and − into the field while the user types * and -.
// Function arguments are separated by ";" or by ", " with a space.

var FUNCTIONS = {
  sqrt: { min: 1, max: 1, apply: function(args) { return Math.sqrt(args[0]) } },
  round: { min: 1, max: 2, apply: function(args) { return roundTo(args[0], args.length > 1 ? args[1] : 0) } },
  floor: { min: 1, max: 1, apply: function(args) { return Math.floor(args[0]) } },
  ceil: { min: 1, max: 1, apply: function(args) { return Math.ceil(args[0]) } }
}

var CONSTANTS = {
  pi: Math.PI,
  "π": Math.PI
}

function roundTo(value, digits) {
  if (digits !== Math.floor(digits) || digits < 0 || digits > 15) return NaN
  var sign = value < 0 ? -1 : 1
  // Shifting through the exponent string avoids 1.005 * 100 = 100.49999….
  var shifted = Math.round(Number(Math.abs(value) + "e" + digits))
  return sign * Number(shifted + "e-" + digits)
}

function normalize(expression) {
  return String(expression || "")
    .replace(/=\s*$/, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/([\d)]\s*)[xX](?=\s*[\d(.])/g, "$1*")
    .replace(/(\d)'(?=\d)/g, "$1")
    .replace(/(\d),(?=\d)/g, "$1.")
    .trim()
}

function prettyOperators(text) {
  return text
    .replace(/[*×]\*/g, "^")
    .replace(/\*/g, "×")
    .replace(/-/g, "−")
    .replace(/([\d)]\s*)[xX](?=\s*[\d(.])/g, "$1×")
}

// The expression as the field shows it: * and x become ×, - becomes −, and a second * turns
// the × before it into ^. The slash stays, since ISO 80000-2 advises against ÷. `cursor`
// moves with the text, because ** → ^ is the one replacement that shortens it.
function prettify(text, cursor) {
  var value = String(text || "")
  return {
    text: prettyOperators(value),
    cursor: prettyOperators(value.slice(0, cursor)).length
  }
}

function tokenize(text) {
  var tokens = []
  var i = 0
  while (i < text.length) {
    var rest = text.slice(i)
    var ch = text[i]
    if (/\s/.test(ch)) { i++; continue }
    var number = /^(\d+\.?\d*|\.\d+)/.exec(rest)
    if (number) {
      tokens.push({ type: "num", value: parseFloat(number[0]) })
      i += number[0].length
      continue
    }
    var name = /^([a-zA-Z]+|π)/.exec(rest)
    if (name) {
      tokens.push({ type: "name", value: name[0].toLowerCase() })
      i += name[0].length
      continue
    }
    if (rest.indexOf("**") === 0) {
      tokens.push({ type: "^" })
      i += 2
      continue
    }
    if ("+-*/%^()√;,".indexOf(ch) >= 0) {
      tokens.push({ type: ch === "," ? ";" : ch })
      i++
      continue
    }
    return null
  }
  return tokens
}

function parse(tokens) {
  var pos = 0
  function peek(offset) { return tokens[pos + (offset || 0)] }
  function next() { return tokens[pos++] }
  function fail() { throw new Error("invalid") }
  function is(token, type) { return !!token && token.type === type }
  function startsOperand(token) {
    return !!token && (token.type === "num" || token.type === "(" || token.type === "name" || token.type === "√")
  }

  // Values carry { value, percent }: percent holds the raw number of a trailing b%
  // so that a ± b% can apply it relative to a.
  function expression() {
    var left = term()
    while (is(peek(), "+") || is(peek(), "-")) {
      var op = next().type
      var right = term()
      var amount = right.percent !== null ? left.value * right.percent / 100 : right.value
      left = { value: op === "+" ? left.value + amount : left.value - amount, percent: null }
    }
    return left
  }

  function term() {
    var left = unary()
    while (true) {
      var token = peek()
      var op
      if (is(token, "*") || is(token, "/") || is(token, "%")) op = next().type
      else if (is(token, "(") || is(token, "name") || is(token, "√")) op = "*"
      else break
      var right = unary()
      var value
      if (op === "*") value = left.value * right.value
      else if (op === "/") value = left.value / right.value
      else value = left.value % right.value
      left = { value: value, percent: null }
    }
    return left
  }

  function unary() {
    if (is(peek(), "+") || is(peek(), "-")) {
      var op = next().type
      var inner = unary()
      return op === "-" ? { value: -inner.value, percent: null } : inner
    }
    return percent()
  }

  function percent() {
    var base = power()
    if (is(peek(), "%") && !startsOperand(peek(1))) {
      next()
      return { value: base / 100, percent: base }
    }
    return { value: base, percent: null }
  }

  function power() {
    var base = primary()
    if (is(peek(), "^")) {
      next()
      return Math.pow(base, exponent())
    }
    return base
  }

  // Right operand of ^: signs and further powers, but no trailing percent.
  function exponent() {
    if (is(peek(), "+") || is(peek(), "-")) {
      var op = next().type
      var inner = exponent()
      return op === "-" ? -inner : inner
    }
    return power()
  }

  function primary() {
    var token = next()
    if (!token) fail()
    if (token.type === "num") return token.value
    if (token.type === "(") {
      var inner = expression()
      if (!is(next(), ")")) fail()
      return inner.value
    }
    if (token.type === "√") return Math.sqrt(primary())
    if (token.type === "name") {
      if (CONSTANTS.hasOwnProperty(token.value)) return CONSTANTS[token.value]
      var fn = FUNCTIONS.hasOwnProperty(token.value) ? FUNCTIONS[token.value] : null
      if (!fn || !is(next(), "(")) fail()
      var args = [expression().value]
      while (is(peek(), ";")) {
        next()
        args.push(expression().value)
      }
      if (!is(next(), ")")) fail()
      if (args.length < fn.min || args.length > fn.max) fail()
      return fn.apply(args)
    }
    fail()
  }

  var result = expression()
  if (pos !== tokens.length) fail()
  return result.value
}

function format(value) {
  if (!isFinite(value)) return null
  var rounded = parseFloat(value.toPrecision(15))
  if (rounded === 0) rounded = 0
  var text = String(rounded)
  if (/e/.test(text) && Math.abs(rounded) >= 1 && Math.abs(rounded) < 1e21) text = rounded.toFixed(0)
  return text
}

// Result string, or null when the input is not a complete calculation.
// A bare number is not a calculation, so it gets no result either.
function evaluate(expression) {
  var text = normalize(expression)
  if (!text || /^[+-]?(\d+\.?\d*|\.\d+)$/.test(text)) return null
  var tokens = tokenize(text)
  if (!tokens || tokens.length === 0) return null
  try {
    return format(parse(tokens))
  } catch (e) {
    return null
  }
}

// Index of the parenthesis matching the one at `index`, or -1 when unmatched.
function matchingParen(text, index) {
  var ch = text[index]
  if (ch !== "(" && ch !== ")") return -1
  var step = ch === "(" ? 1 : -1
  var depth = 0
  for (var i = index; i >= 0 && i < text.length; i += step) {
    if (text[i] === "(") depth += step
    else if (text[i] === ")") depth -= step
    if (depth === 0) return i
  }
  return -1
}

// Deleting the parenthesis at `index` also deletes its partner.
// Returns { text, cursor } with the cursor where the deleted paren was, or null.
function deleteParenPair(text, index) {
  var partner = matchingParen(text, index)
  if (partner < 0) return null
  var first = Math.min(index, partner)
  var second = Math.max(index, partner)
  var result = text.slice(0, first) + text.slice(first + 1, second) + text.slice(second + 1)
  return { text: result, cursor: index < partner ? index : index - 1 }
}
