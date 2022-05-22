import { printErrors } from '../commands/utils.js';
import evaluate from './interpreter.js';
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
  ['+=']: (args, env) => {
    if (args.length === 0 || args[0].type !== 'word') {
      printErrors('SyntaxError Invalid use of operation +=', args);

      throw new SyntaxError('Invalid use of operation +=');
    }
    const entityName = args[0].name;
    let value = evaluate(args[0], env);
    const inc = args[1] ? evaluate(args[1], env) : 1;
    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
        value += inc;
        scope[entityName] = value;
        return value;
      }
    }
    printErrors(
      `ReferenceError Tried incrementing an undefined variable: ${entityName}`,
      sthd
    );

    throw new ReferenceError(
      `Tried incrementing an undefined variable: ${entityName}`
    );
  },

  ['-=']: (args, env) => {
    if (args.length === 0 || args[0].type !== 'word') {
      printErrors('SyntaxError Invalid use of operation -=', args);

      throw new SyntaxError('Invalid use of operation -=');
    }
    const entityName = args[0].name;
    let value = evaluate(args[0], env);
    const inc = args[1] ? evaluate(args[1], env) : 1;
    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
        value -= inc;
        scope[entityName] = value;
        return value;
      }
    }
    printErrors(
      `ReferenceError Tried incrementing an undefined variable: ${entityName}`,
      args
    );

    throw new ReferenceError(
      `Tried incrementing an undefined variable: ${entityName}`
    );
  },

  ['*=']: (args, env) => {
    if (args.length === 0 || args[0].type !== 'word') {
      printErrors('SyntaxError Invalid use of operation *=', args);

      throw new SyntaxError('Invalid use of operation *=');
    }
    const entityName = args[0].name;
    let value = evaluate(args[0], env);
    const inc = args[1] ? evaluate(args[1], env) : 1;
    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
        value *= inc;
        scope[entityName] = value;
        return value;
      }
    }
    printErrors(
      `ReferenceError Tried incrementing an undefined variable: ${entityName}`,
      sthd
    );

    throw new ReferenceError(
      `Tried incrementing an undefined variable: ${entityName}`
    );
  },
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
    if (args.length !== 3 || main.type === 'value') {
      printErrors('SyntaxError Invalid use of operation .=', args);
      throw new SyntaxError('Invalid use of operation .=');
    }

    const prop = parsePath(args[1], env);
    const value = evaluate(args[2], env);

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
        entity[prop] = value;
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
            entity[prop] = value;
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
    if (args.length !== 2 || args[0].type !== 'word') {
      printErrors('SyntaxError Invalid use of operation .-', args);
      throw new SyntaxError('Invalid use of operation .-');
    }

    const entityName = args[0].name;
    const prop = parsePath(args[1], env);
    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
        if (prop.length === 1) {
          scope[entityName][prop];
          delete scope[entityName][prop];
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
    if (args.length !== 2) {
      printErrors('SyntaxError Invalid use of operation .', args);
      throw new SyntaxError('Invalid use of operation .');
    }

    if (args[0].type === 'apply') {
      env['0_annonymous'] = evaluate(args[0], env);
      return tokens['.'](
        [{ name: '0_annonymous', type: 'word' }, args[1]],
        env
      );
    }

    const entityName = args[0].name;
    const prop = parsePath(args[1], env);

    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
        if (prop.length === 1) {
          return scope[entityName][prop] ?? VOID;
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

  ['?.']: (args, env) => {
    if (args.length !== 2) {
      printErrors('SyntaxError Invalid use of operation ?.', args);
      throw new SyntaxError('Invalid use of operation ?.');
    }

    if (args[0].type === 'apply') {
      env['0_annonymous'] = evaluate(args[0], env);
      return tokens['?.'](
        [{ name: '0_annonymous', type: 'word' }, args[1]],
        env
      );
    }

    const entityName = args[0].name;

    const prop = parsePath(args[1], env);
    for (let scope = env; scope; scope = Object.getPrototypeOf(scope)) {
      if (Object.prototype.hasOwnProperty.call(scope, entityName)) {
        if (prop.length === 1) {
          return scope[entityName][prop] ?? VOID;
        } else {
          let temp = scope[entityName];
          for (let i = 0; i < prop.length; i++) {
            temp = temp[prop[i]];
            if (temp === undefined) break;
          }

          return temp ?? VOID;
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
