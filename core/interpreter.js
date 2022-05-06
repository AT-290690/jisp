import { printErrors, onError } from '../commands/utils.js';

const evaluate = (expr, env) => {
  try {
    switch (expr.type) {
      case 'value':
        return expr.value;
      case 'word':
        if (expr.name in env) {
          return env[expr.name];
        } else {
          throw new ReferenceError(`Undefined variable: ${expr.name}`);
        }
      case 'apply':
        if (expr.operator.type === 'word' && expr.operator.name in env.tokens) {
          return env.tokens[expr.operator.name](expr.args, env);
        }

        const op = evaluate(expr.operator, env);
        if (typeof op !== 'function') {
          throw new TypeError(expr.operator.name + ' is not a function.');
        }
        return op.apply(
          null,
          expr.args.map(function (arg) {
            return evaluate(arg, env);
          })
        );
    }
  } catch (err) {
    printErrors(err);
    onError(err);
  }
};
export default evaluate;
