import { printErrors } from '../commands/utils.js';
import evaluate from './interpreter.js';
const isEqual = (a, b) => {
  const typeA = typeof a,
    typeB = typeof b;
  if (typeA !== typeB) return 0;
  if (typeA === 'number' || typeA === 'string' || typeA === 'boolean') {
    return +(a === b);
  }
  if (typeA === 'object') {
    const isArrayA = Array.isArray(a),
      isArrayB = Array.isArray(b);
    if (isArrayA !== isArrayB) return 0;
    if (isArrayA && isArrayB) {
      if (a.length !== b.length) return 0;
      return +a.every((item, index) => isEqual(item, b[index]));
    } else {
      if (a === undefined || a === null || b === undefined || b === null)
        return +(a === b);
      if (Object.keys(a).length !== Object.keys(b).length) return 0;
      for (const key in a) {
        if (!isEqual(a[key], b[key])) {
          return 0;
        }
      }
      return 1;
    }
  }
};

export const VOID = null;
export const pipe =
  (...fns) =>
  x =>
    fns.reduce((v, f) => f(v), x);
export const parsePath = (arg, env) => {
  const path =
    arg.type === 'value'
      ? arg.value?.toString()
      : evaluate(arg, env)?.toString();
  return path ? path.split(';').map(x => x.trim()) : VOID;
};
const tokens = {
  ['?']: (args, env) => {
    if (args.length > 3 || args.length <= 1) {
      printErrors('SyntaxError Invalid number of arguments to ?', args);
      throw new SyntaxError('Invalid number of arguments to ?');
    }
    if (!!evaluate(args[0], env)) {
      return evaluate(args[1], env);
    } else if (args[2]) {
      return evaluate(args[2], env);
    } else {
      return 0;
    }
  },

  ['*?']: (args, env) => {
    if (args.length === 0 || args.length % 2 !== 0) {
      printErrors('SyntaxError Invalid number of arguments to *?', args);
      throw new SyntaxError('Invalid number of arguments to *?');
    }
    let res = 0;
    for (let i = 0; i < args.length; i += 2) {
      if (!!evaluate(args[i], env)) {
        res = evaluate(args[i + 1], env);
        break;
      }
    }
    return res;
  },
  ['===']: (args, env) => {
    if (args.length < 2) {
      printErrors('SyntaxError Invalid number of arguments  to ===', args);
      throw new SyntaxError('Invalid number of arguments  to ===');
    }
    const [first, ...rest] = args;
    let res = 0;
    const match = evaluate(first, env);
    rest.forEach(item => {
      res = isEqual(match, evaluate(item, env));
    });
    return res;
  },
  ['==*']: (args, env) => {
    if (args.length % 2 !== 0) {
      printErrors('SyntaxError ==* has to end with a default case', args);
      throw new SyntaxError('==* has to end with a default case');
    }
    if (args.length < 4) {
      printErrors('SyntaxError Invalid number of arguments  to ==*', args);
      throw new SyntaxError('Invalid number of arguments  to ==*');
    }
    const [first, ...rest] = args;
    let res = 0;
    const match = evaluate(first, env);
    for (let i = 0; i < rest.length; i += 2) {
      if (i === rest.length - 1 && res === 0) {
        res = evaluate(rest[i], env);
        break;
      } else if (!!isEqual(match, evaluate(rest[i], env))) {
        res = evaluate(rest[i + 1], env);
        break;
      }
    }
    return res;
  },
  ['&&']: (args, env) => {
    if (args.length === 0) {
      printErrors('SyntaxError Invalid number of arguments to &&', args);

      throw new SyntaxError('Invalid number of arguments to &&');
    }
    for (let i = 0; i < args.length - 1; i++) {
      if (!!evaluate(args[i], env)) {
        continue;
      } else {
        return evaluate(args[i], env);
      }
    }
    return evaluate(args[args.length - 1], env);
  },

  ['||']: (args, env) => {
    if (args.length === 0) {
      printErrors('SyntaxError Invalid number of arguments  to ||', args);

      throw new SyntaxError('Invalid number of arguments  to ||');
    }
    for (let i = 0; i < args.length - 1; i++) {
      if (!!evaluate(args[i], env)) {
        return evaluate(args[i], env);
      } else {
        continue;
      }
    }
    return evaluate(args[args.length - 1], env);
  },

  ['??']: (args, env) => {
    if (args.length === 0) {
      printErrors('SyntaxError Invalid number of arguments  to ??', args);
      throw new SyntaxError('Invalid number of arguments  to ??');
    }
    for (let i = 0; i < args.length - 1; i++) {
      if (evaluate(args[i], env) !== VOID) {
        return evaluate(args[i], env);
      } else {
        continue;
      }
    }
    return evaluate(args[args.length - 1], env);
  },
  // ['++?']: (args, env) => {
  //   if (args.length !== 2) {
  //     printErrors('SyntaxError Invalid number of arguments to ++?', args);
  //
  //       throw new SyntaxError('Invalid number of arguments to ++?');
  //   }
  //   while (!!evaluate(args[0], env)) {
  //     evaluate(args[1], env);
  //   }
  //   // since there is no undefined so we return void when there's no meaningful result.
  //   return VOID;
  // },

  ['=>']: (args, env) => {
    let value = VOID;
    args.forEach(arg => (value = evaluate(arg, env)));
    return value;
  },

  [':=']: (args, env) => {
    if (!args.length || args?.[0].type !== 'word' || args.length > 2) {
      printErrors('SyntaxError Invalid use of operation :=', args);

      throw new SyntaxError('Invalid use of operation :=');
    }
    const value =
      args.length === 1 ? VOID : evaluate(args[args.length - 1], env);
    env[args[0].name] = value;
    return value;
  },
  // ['+=']: (args, env) => {
  //   if (args.length === 0 || args[0].type !== 'word') {
  //     printErrors('SyntaxError Invalid use of operation +=', args);

  //     throw new SyntaxError('Invalid use of operation +=');
  //   }
  //   const entityName = args[0].name;
  //   let value = evaluate(args[0], env);
  //   const inc = args[1] ? evaluate(args[1], env) : 1;
  //   for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
  //     if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
  //       value += inc;
  //       scope[entityName] = value;
  //       return value;
  //     }
  //   }
  //   printErrors(
  //     `ReferenceError Tried incrementing an undefined variable: ${entityName}`,
  //     sthd
  //   );

  //   throw new ReferenceError(
  //     `Tried incrementing an undefined variable: ${entityName}`
  //   );
  // },

  // ['-=']: (args, env) => {
  //   if (args.length === 0 || args[0].type !== 'word') {
  //     printErrors('SyntaxError Invalid use of operation -=', args);

  //     throw new SyntaxError('Invalid use of operation -=');
  //   }
  //   const entityName = args[0].name;
  //   let value = evaluate(args[0], env);
  //   const inc = args[1] ? evaluate(args[1], env) : 1;
  //   for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
  //     if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
  //       value -= inc;
  //       scope[entityName] = value;
  //       return value;
  //     }
  //   }
  //   printErrors(
  //     `ReferenceError Tried incrementing an undefined variable: ${entityName}`,
  //     args
  //   );

  //   throw new ReferenceError(
  //     `Tried incrementing an undefined variable: ${entityName}`
  //   );
  // },

  // ['*=']: (args, env) => {
  //   if (args.length === 0 || args[0].type !== 'word') {
  //     printErrors('SyntaxError Invalid use of operation *=', args);

  //     throw new SyntaxError('Invalid use of operation *=');
  //   }
  //   const entityName = args[0].name;
  //   let value = evaluate(args[0], env);
  //   const inc = args[1] ? evaluate(args[1], env) : 1;
  //   for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
  //     if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
  //       value *= inc;
  //       scope[entityName] = value;
  //       return value;
  //     }
  //   }
  //   printErrors(
  //     `ReferenceError Tried incrementing an undefined variable: ${entityName}`,
  //     sthd
  //   );

  //   throw new ReferenceError(
  //     `Tried incrementing an undefined variable: ${entityName}`
  //   );
  // },
  ['->']: (args, env) => {
    if (!args.length) {
      printErrors('SyntaxError Functions need a body', args);

      throw new SyntaxError('Functions need a body');
    }

    const name = expr => {
      if (expr.type !== 'word') {
        printErrors(
          'SyntaxError Arg names must be words',
          args.map(x => x.name)
        );

        throw new SyntaxError('Arg names must be words');
      }
      return expr.name;
    };
    const argNames = args.slice(0, args.length - 1).map(name);
    const body = args[args.length - 1];
    return (...args) => {
      if (args.length !== argNames.length) {
        printErrors(
          'TypeError Invalid number of arguments near ("' +
            argNames.join('; ') +
            '")',
          args.map(x => x.name)
        );

        throw new TypeError('Invalid number of arguments');
      }
      const localEnv = Object.create(env);
      for (let i = 0; i < args.length; i++) {
        localEnv[argNames[i]] = args[i];
      }
      return evaluate(body, localEnv);
    };
  },

  ['=']: (args, env) => {
    if (args.length !== 2 || args[0].type !== 'word') {
      printErrors('SyntaxError Invalid use of operation =', args);
      throw new SyntaxError('Invalid use of operation =');
    }

    const entityName = args[0].name;
    const value = evaluate(args[1], env);
    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
        scope[entityName] = value;
        return value;
      }
    }
    printErrors(
      `ReferenceError Tried setting an undefined variable: ${entityName}`,
      args
    );

    throw new ReferenceError(
      `Tried setting an undefined variable: ${entityName}`
    );
  },

  ['.=']: (args, env) => {
    const main = args[0];
    const last = args[args.length - 1];

    const prop = [];

    for (let i = 1; i < args.length - 1; i++) {
      const arg = args[i];
      prop.push(
        (arg.type === 'value'
          ? arg.value?.toString()
          : evaluate(arg, env)?.toString()) ?? VOID
      );
    }

    const value = evaluate(last, env);

    // if (prop.includes('innerHTML')) {
    //   printErrors(
    //     'SyntaxError Forbidden use of operation .= when setting innerHTML',
    //     null
    //   );
    //   throw new TypeError(
    //     'Forbidden use of operation .= when setting innerHTML'
    //   );
    // }

    if (main.type === 'apply') {
      const entity = evaluate(main, env);
      if (prop.length === 1) {
        entity[prop[0]] = value;
      } else {
        let temp = entity;
        const last = prop.pop();
        prop.forEach(item => {
          temp = temp[item];
        });
        temp[last] = value;
      }
      return entity;
    } else if (main.type === 'word') {
      const entityName = main.name;
      for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
        if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
          const entity = scope[entityName];
          if (prop.length === 1) {
            entity[prop[0]] = value;
          } else {
            let temp = entity;
            const last = prop.pop();
            prop.forEach(item => {
              temp = temp[item];
            });
            temp[last] = value;
          }
          return entity;
        }
      }
    }
  },

  ['.-']: (args, env) => {
    const prop = [];
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      prop.push(
        (arg.type === 'value'
          ? arg.value?.toString()
          : evaluate(arg, env)?.toString()) ?? VOID
      );
    }

    const entityName = args[0].name;
    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
        if (prop.length === 1) {
          scope[entityName][prop[0]];
          delete scope[entityName][prop[0]];
          return scope[entityName];
        } else {
          let temp = scope[entityName];
          const last = prop.pop();
          prop.forEach(item => {
            temp = temp[item];
          });
          //const value = temp[last];
          delete temp[last];
          return scope[entityName];
        }
      }
    }
  },

  ['.']: (args, env) => {
    const prop = [];
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      prop.push(
        (arg.type === 'value'
          ? arg.value?.toString()
          : evaluate(arg, env)?.toString()) ?? VOID
      );
    }

    if (args[0].type === 'apply') {
      env['0_annonymous'] = evaluate(args[0], env);
      return tokens['.'](
        [{ name: '0_annonymous', type: 'word' }, args[1]],
        env
      );
    }

    const entityName = args[0].name;

    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
        if (prop.length === 1) {
          return scope[entityName][prop[0]] ?? VOID;
        } else {
          let temp = scope[entityName];
          const last = prop.pop();
          prop.forEach(item => {
            temp = temp[item];
          });
          return temp[last] ?? VOID;
        }
      }
    }
  },

  ['...']: (args, env) => {
    if (!args.length) {
      printErrors('SyntaxError Invalid number of arguments to ...', args);
      throw new SyntaxError('Invalid number of arguments to ...');
    }
    try {
      const [first, ...rest] = args;
      const toSpread = evaluate(first, env);
      if (typeof toSpread !== 'object') {
        printErrors('TypeError ... can only be used on .: or ::', args);

        throw new SyntaxError('... can only be used on .: or ::');
      }
      return Array.isArray(toSpread)
        ? [
            ...toSpread,
            ...rest.reduce((acc, item) => [...acc, ...evaluate(item, env)], [])
          ]
        : {
            ...toSpread,
            ...rest.reduce(
              (acc, item) => ({ ...acc, ...evaluate(item, env) }),
              {}
            )
          };
    } catch (err) {
      printErrors(err, args);
    }
  },

  ['::']: (args, env) => {
    try {
      let count = 0;
      return Object.fromEntries(
        args.reduce((acc, item, i) => {
          if (i % 2) {
            acc[count].push(
              item.type === 'value' ? item.value : evaluate(item, env)
            );
            count++;
          } else {
            if (typeof item.value !== 'string') {
              printErrors(
                'SyntaxError Invalid use of operation :: (Only strings can be used as keys)',
                args
              );

              throw new SyntaxError(
                'Invalid use of operation :: (Only strings can be used as keys)'
              );
            }
            acc[count] = [item.value];
          }
          return acc;
        }, [])
      );
    } catch (err) {
      printErrors(err, args);
    }
  },

  ['.:']: (args, env) => {
    return args.map(item =>
      item.type === 'value' ? item.value : evaluate(item, env)
    );
  },

  [':']: (args, env) => {
    if (!args.length || (args[0].type !== 'apply' && args[0].type !== 'word')) {
      printErrors('SyntaxError Invalid number of arguments to :', args);
      throw new SyntaxError('Invalid number of arguments to :');
    }
    const [first, ...rest] = args;
    const fn = evaluate(first, env);
    return arg => fn(arg, ...rest.map(x => evaluate(x, env)));
  },

  ['<-']: (args, env) => exp =>
    args.forEach(arg => {
      env[arg.name] = env[exp][arg.name];
    }) ?? VOID,

  ['|>']: (args, env) => {
    const [param, ...rest] = args;
    return pipe(...rest.map(arg => p => evaluate(arg, env)(p)))(
      param.type === 'apply' || param.type === 'word'
        ? evaluate(param, env)
        : param.value
    );
  }

  // ['|?|']: (args, env) =>
  //   args[0]
  //     ? args[0].type === 'word' && env[args[0].name]
  //       ? typeof env[args[0].name] ?? VOID
  //       : args[0].class ?? VOID
  //     : VOID
};

tokens['~='] = tokens[':='];

export { tokens };
