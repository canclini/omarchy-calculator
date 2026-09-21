#!/usr/bin/env node
'use strict'

// Regression tests for CalcModel.js without a QML host: node test/calc-model.test.js
// CalcModel.js is a QML `.pragma library` module; stripping that line lets node run it as is.

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const source = fs.readFileSync(path.join(__dirname, '..', 'CalcModel.js'), 'utf8')
  .replace(/^\.pragma library\s*/, '')
const model = {}
vm.createContext(model)
vm.runInContext(source, model, { filename: 'CalcModel.js' })

let checks = 0
let failures = 0

function check(label, actual, expected) {
  checks++
  const same = JSON.stringify(actual) === JSON.stringify(expected)
  if (!same) {
    failures++
    console.error(`FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

const evaluations = [
  // Basic arithmetic and precedence
  ['20*3', '60'],
  ['1+2*3', '7'],
  ['(1+2)*3', '9'],
  ['10/4', '2.5'],
  ['10/3', '3.33333333333333'],
  ['0.1+0.2', '0.3'],
  ['-(3-5)*2', '4'],
  ['100/7=', '14.2857142857143'],
  // Swiss and calculator notation
  ['0,1+0,2', '0.3'],
  ["1'000'000/4", '250000'],
  ['3x4', '12'],
  ['3 × 4 ÷ 2 − 1', '5'],
  // Percent and modulo
  ['50%', '0.5'],
  ['200*15%', '30'],
  ['80+10%', '88'],
  ['80-25%', '60'],
  ['(10+10)%', '0.2'],
  ['17 % 5', '2'],
  ['17%(2+3)', '2'],
  // Powers
  ['2^10', '1024'],
  ['2**8', '256'],
  ['2^3^2', '512'],
  ['-2^2', '-4'],
  ['(-2)^2', '4'],
  ['2^-1', '0.5'],
  ['10^2%', '1'],
  ['100+2^3%', '108'],
  // Roots
  ['sqrt(144)', '12'],
  ['√16+1', '5'],
  ['√(9+16)', '5'],
  ['2√9', '6'],
  ['sqrt(2)', '1.4142135623731'],
  // Rounding
  ['round(2.5)', '3'],
  ['round(-2.5)', '-3'],
  ['round(3,14159; 2)', '3.14'],
  ['round(3.14159, 2)', '3.14'],
  ['round(1.005; 2)', '1.01'],
  ['floor(2.7)', '2'],
  ['ceil(2.1)', '3'],
  // pi and implicit multiplication
  ['pi', '3.14159265358979'],
  ['2pi', '6.28318530717959'],
  ['π*2^2', '12.5663706143592'],
  ['2(3+4)', '14'],
  ['(1+1)(2+2)', '8'],
  // No result
  ['20', null],
  ['-5', null],
  ['', null],
  ['1+', null],
  ['2*(3+', null],
  ['2/0', null],
  ['sqrt(-1)', null],
  ['round(2.5; 1.5)', null],
  ['sqrt(1; 2)', null],
  ['foo(2)', null],
  ['abc', null],
]

for (const [input, expected] of evaluations) check(`evaluate(${input})`, model.evaluate(input), expected)

// What the field shows must evaluate to what was typed.
for (const [input, expected] of evaluations) {
  const shown = model.prettify(input, input.length).text
  check(`evaluate(prettify(${input}))`, model.evaluate(shown), expected)
}

check('* becomes ×', model.prettify('3*2', 2), { text: '3×2', cursor: 2 })
check('- becomes −', model.prettify('80-25%', 3), { text: '80−25%', cursor: 3 })
check('unary - becomes −', model.prettify('-2^2', 1), { text: '−2^2', cursor: 1 })
check('x between numbers becomes ×', model.prettify('3x2', 3), { text: '3×2', cursor: 3 })
check('x waits for its right operand', model.prettify('3x', 2), { text: '3x', cursor: 2 })
check('x in a name stays', model.prettify('2*exp', 5), { text: '2×exp', cursor: 5 })
check('/ stays', model.prettify('12/4', 3), { text: '12/4', cursor: 3 })
check('a second * makes ^', model.prettify('2×*', 3), { text: '2^', cursor: 2 })
check('pasted ** makes ^', model.prettify('2**10', 5), { text: '2^10', cursor: 4 })
check('cursor before ** stays', model.prettify('2**10', 1), { text: '2^10', cursor: 1 })
check('already pretty is unchanged', model.prettify('3×2−1', 5), { text: '3×2−1', cursor: 5 })

const text = '2*((1+2)*3)'
check('delete outer "("', model.deleteParenPair(text, 2), { text: '2*(1+2)*3', cursor: 2 })
check('delete inner "("', model.deleteParenPair(text, 3), { text: '2*(1+2*3)', cursor: 3 })
check('delete inner ")"', model.deleteParenPair(text, 7), { text: '2*(1+2*3)', cursor: 6 })
check('delete outer ")"', model.deleteParenPair(text, 10), { text: '2*(1+2)*3', cursor: 9 })
check('unmatched "("', model.deleteParenPair('(1+2', 0), null)
check('not a paren', model.deleteParenPair('1+2', 1), null)

console.log(`${checks - failures}/${checks} checks passed`)
process.exit(failures ? 1 : 0)
