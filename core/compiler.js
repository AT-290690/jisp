const vars = new Set();
const dfs = (tree, locals) => {
  if (!tree) return '';
  if (tree.type === 'apply') {
    switch (tree.operator.name) {
      case '=>':
        return `(()=>{${tree.args
          .map((x, i) => {
            const res = dfs(x, locals);
            if (res !== undefined && i === tree.args.length - 1) {
              return ';return ' + res.toString().trimStart();
            } else {
              return res;
            }
          })
          .join('')}})()`;
      case ':=':
      case '~=': {
        const res = dfs(tree.args[1], locals);
        locals.add(tree.args[0].name);
        if (res !== undefined) {
          return `(void(${tree.args[0].name}=${res})||${tree.args[0].name});`;
        }
        break;
      }
      case '=': {
        const res = dfs(tree.args[1], locals);
        return `(void(${tree.args[0].name}=${res})||${tree.args[0].name});`;
      }
      case '->': {
        const args = tree.args;
        const body = args.pop();
        const localVars = new Set();
        const evaluatedBody = dfs(body, localVars);
        const vars = localVars.size ? `var ${[...localVars].join(',')};` : '';
        return `(${args.map(x => dfs(x, locals))}) => {${vars} ${
          body.type === 'apply' || body.type === 'value' ? 'return ' : ' '
        } ${evaluatedBody.trimStart()}};`;
      }
      case '===': {
        const [first, ...rest] = tree.args;
        if (rest.length === 1) {
          return `_isEqual(${dfs(first, locals)},${dfs(rest[0], locals)})`;
        } else {
          return (
            '(' +
            rest
              .map(x => `_isEqual(${dfs(first, locals)}, ${dfs(x, locals)})`)
              .join('&&') +
            ')'
          );
        }
      }

      case '==*': {
        const [first, ...rest] = tree.args;
        const match = dfs(first, locals);
        let output = '';
        for (let i = 0; i < rest.length; i += 2) {
          if (i === rest.length - 1) {
            output += dfs(rest[i], locals);
          } else {
            output += `_isEqual(${match},${dfs(rest[i], locals)})?${dfs(
              rest[i + 1],
              locals
            )}:`;
          }
        }
        return output;
      }
      case '==':
        return '(' + tree.args.map(x => dfs(x, locals)).join('===') + ')';
      case '+':
      case '-':
      case '*':
      case '/':
      case '!=':
      case '&&':
      case '||':
      case '>=':
      case '<=':
      case '>':
      case '<':
      case '??':
        return (
          '(' +
          tree.args.map(x => dfs(x, locals)).join(tree.operator.name) +
          ')'
        );
      case '%':
        return (
          '(' +
          dfs(tree.args[0], locals) +
          '%' +
          dfs(tree.args[1], locals) +
          ')'
        );
      case '**':
        return (
          '(' +
          dfs(tree.args[0], locals) +
          '**' +
          (dfs(tree.args[1], locals) || 2) +
          ')'
        );
      case '!':
        return '!' + dfs(tree.args[0], locals);
      case '?': {
        const conditionStack = [];
        tree.args
          .map(x => dfs(x, locals))
          .forEach((x, i) => {
            if (i % 2 === 0) {
              conditionStack.push(x, '?');
            } else {
              conditionStack.push(x, ':');
            }
          });
        conditionStack.pop();
        if (conditionStack.length === 3) {
          conditionStack.push(':', 'null;');
        }
        return `(${conditionStack.join('')});`;
      }
      case '*?': {
        const conditionStack = [];
        tree.args
          .map(x => dfs(x, locals))
          .forEach((x, i) => {
            if (i % 2 === 0) {
              conditionStack.push(x, '?');
            } else {
              conditionStack.push(x, ':');
            }
          });
        conditionStack.pop();
        conditionStack.push(':', '0;');
        return `(${conditionStack.join('')});`;
      }
      case '.:':
        return '[' + tree.args.map(x => dfs(x, locals)).join(',') + ']';
      case '::':
        return (
          '{' +
          tree.args
            .map(x => dfs(x, locals))
            .reduce((acc, item, index) => {
              if (index % 2 === 0) {
                acc += `"${item.replaceAll('"', '')}":`;
              } else {
                acc += `${item},`;
              }
              return acc;
            }, '') +
          '}'
        );
      case 'tco': {
        const res = dfs(tree.args[0], locals);
        return '_tco(' + res + ')';
      }
      case '<-':
        return '';
      case '...':
        return `_spread([${tree.args.map(x => dfs(x, locals)).join(',')}])`;
      case '|>': {
        const [param, ...rest] = tree.args.map(x => dfs(x, locals));
        return `_pipe(${rest.join(',')})(${param});`;
      }
      // case ':':
      //   return `_curry(${tree.args.map(x => dfs(x, locals)).join(',')});`;
      case '.': {
        const prop = [];
        for (let i = 1; i < tree.args.length; i++) {
          const arg = tree.args[i];
          prop.push(
            (arg.type === 'value'
              ? '"' + arg.value?.toString().trim().replaceAll('"', '') + '"'
              : dfs(arg, locals)) ?? null
          );
        }
        const path = prop.map(x => '[' + x + ']').join('');
        return `${dfs(tree.args[0], locals)}${path};`;
      }
      case '.-': {
        const prop = [];
        for (let i = 1; i < tree.args.length; i++) {
          const arg = tree.args[i];
          prop.push(
            (arg.type === 'value'
              ? '"' + arg.value?.toString().trim().replaceAll('"', '') + '"'
              : dfs(arg, locals)) ?? null
          );
        }
        const path = prop.map(x => '[' + x + ']').join('');
        const obj = dfs(tree.args[0], locals);
        return `(void(delete ${obj}${path})||${obj});`;
      }
      case '.=': {
        const last = tree.args[tree.args.length - 1];
        const res = dfs(last, locals);
        const prop = [];
        for (let i = 1; i < tree.args.length - 1; i++) {
          const arg = tree.args[i];
          prop.push(
            (arg.type === 'value'
              ? '"' + arg.value?.toString().trim().replaceAll('"', '') + '"'
              : dfs(arg, locals)) ?? null
          );
        }

        const path = prop.map(x => '[' + x + ']').join('');
        const obj = dfs(tree.args[0], locals);
        return `(void(${obj}${path}=${res})||${obj});`;
      }

      case '+=': {
        const res = tree.args[1] ? dfs(tree.args[1], locals) : 1;
        const variable = dfs(tree.args[0], locals);
        return `(void(${variable}+=${res})||${variable});`;
      }

      case '-=': {
        const res = tree.args[1] ? dfs(tree.args[1], locals) : 1;
        const variable = dfs(tree.args[0], locals);
        return `(void(${variable}-=${res})||${variable});`;
      }

      case '*=': {
        const res = tree.args[1] ? dfs(tree.args[1], locals) : 1;
        const variable = dfs(tree.args[0], locals);
        return `(void(${variable}*=${res})||${variable});`;
      }

      // case '++?': {
      //   const args = tree.args.map((x)=>dfs(x));
      //   return `_while(() => ${args[0]}, () => ${args[1]})`;
      // }

      default: {
        if (tree.operator.name) {
          return (
            tree.operator.name +
            '(' +
            tree.args.map(x => dfs(x, locals)).join(',') +
            ');'
          );
        } else {
          if (
            tree.operator.operator.name === '<-' &&
            tree.args[0].type === 'value'
          ) {
            const imp = tree.args[0].value;
            const methods = tree.operator.args.map(x => x.name);
            return methods
              .map(x => {
                if (x) {
                  locals.add(x);
                }
                return `${x} = STD["${imp}"]["${x}"];`;
              })
              .join('');
          } else if (
            tree.operator.operator.name === '.' &&
            tree.type === 'apply'
          ) {
            const [parent, method] = tree.operator.args;
            const arg = tree.args.map(x => dfs(x, locals));
            if (method.type === 'value') {
              return `${parent.name}["${method.value}"](${arg.join(',')});`;
            } else {
              return `${parent.name}[${dfs(method, locals)}](${arg.join(
                ','
              )});`;
            }
          }
        }
      }
    }
  } else if (tree.type === 'word') {
    switch (tree.name) {
      case 'void':
      case 'VOID':
        return 'null';
      case '$*':
        return '_$';
      default:
        return tree.name;
    }
  } else if (tree.type === 'value') {
    return tree.class === 'string' ? `"${tree.value}"` : tree.value;
  }
};

const semiColumnEdgeCases = new Set([
  ';)',
  ';-',
  ';+',
  ';*',
  ';%',
  ';&',
  ';/',
  ';:',
  ';.',
  ';=',
  ';<',
  ';>',
  ';|',
  ';,',
  ';?',
  ',,',
  ';;',
  ';]'
]);
export const compileToJavaScript = ast => {
  vars.clear();
  const raw = dfs(ast, vars);
  let program = '';
  for (let i = 0; i < raw.length; i++) {
    const current = raw[i];
    const next = raw[i + 1];
    if (!semiColumnEdgeCases.has(current + next)) {
      program += current;
    }
  }

  return { program, vars: [...vars] };
};
