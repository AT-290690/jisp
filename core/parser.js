import { prettier, printErrors } from '../commands/utils.js';
import evaluate from './interpreter.js';
const tailCallOpt = (children, name, parent) => {
  for (let i = 0; i < children.length; i++) {
    if (children[i].args) {
      if (children[i]?.operator?.name === name) {
        children[i].operator.name = '$_tail_' + name;
        children[i] = {
          args: [children[i]],
          class: 'function',
          operator: { type: 'word', name: '->' },
          type: 'apply'
        };
        parent[1] = {
          args: [
            {
              class: 'function',
              operator: { type: 'word', name: ':=' },
              type: 'apply',
              args: [{ type: 'word', name: '$_tail_' + name }, parent[1]]
            }
          ],
          class: 'function',
          operator: { type: 'word', name: 'tco' },
          type: 'apply'
        };
        break;
      } else {
        tailCallOpt(children[i].args, name, parent);
      }
    }
  }
};

const pipeArgs = expr => {
  const [first, ...rest] = expr.args;
  if (!rest.every(x => x.operator.name[0] === '|')) {
    printErrors(`SyntaxError Pipe functions have to start with |`, expr);
    throw new SyntaxError(`Pipe functions have to start with |`, expr);
  }

  expr.args = [
    first,
    ...rest.map(arg => ({
      args: [
        { type: 'word', name: '$*' },
        {
          args: [{ type: 'word', name: '$*' }, ...(arg.args ?? [])],
          class: 'function',
          type: 'apply',
          operator: { name: arg.operator.name.substring(1), type: 'word' }
        }
      ],
      class: 'function',
      type: 'apply',
      operator: { name: '->', type: 'word' }
    }))
  ];
};

export const parseApply = (expr, program) => {
  if (program[0] !== '[') {
    return { expr: expr, rest: program };
  }

  program = program.slice(1);
  expr = {
    type: 'apply',
    operator: expr,
    args: [],
    class: 'function'
  };

  while (program[0] !== ']') {
    const arg = parseExpression(program);
    expr.args.push(arg.expr);
    program = arg.rest;
    if (program[0] === ';') {
      program = program.slice(1);
    } else if (program[0] !== ']') {
      printErrors(
        `SyntaxError Unexpected token - Expected ';' or ']'" but got "${program[0]}"`,
        expr
      );
      throw new SyntaxError(
        `Unexpected token - Expected ';' or ']'" but got "${program[0]}"`,
        expr
      );
    }
  }
  if (expr.operator.name === '|>') {
    pipeArgs(expr);
  } else if (expr.operator.name === '~=') {
    tailCallOpt(expr.args, expr.args[0].name, expr.args);
  }

  return parseApply(expr, program.slice(1));
};
export const parseExpression = program => {
  let match, expr;
  if ((match = /^"([^"]*)"/.exec(program))) {
    expr = {
      type: 'value',
      value: match[1],
      class: 'string'
    };
  } else if ((match = /^-?\d*\.{0,1}\d+\b/.exec(program))) {
    expr = {
      type: 'value',
      value: Number(match[0]),
      class: 'number'
    };
  } else if ((match = /^[^\s\[\];"]+/.exec(program))) {
    expr = { type: 'word', name: match[0] };
  } else {
    const snapshot = prettier(program.split('];')[0].split(']')[0]).trim();
    printErrors(`SyntaxError Unexpect syntax: "${snapshot}"`);
    throw new SyntaxError(`Unexpect syntax: "${snapshot}"`);
  }
  return parseApply(expr, program.slice(match[0].length));
};

export const parse = program => {
  const result = parseExpression(program);
  if (result.rest.length > 0) {
    printErrors('SyntaxError Unexpected text after program');
    throw new SyntaxError('Unexpected text after program');
  }
  return result.expr;
};

export const cell = (env, run = true) => {
  return args => {
    const AST = parse(args);
    if (run) {
      const result = evaluate(AST, env);
      return { result, env, AST };
    } else {
      return { result: null, env, AST };
    }
  };
};
