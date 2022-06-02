const vars = new Set();
const dfs = tree => {
  if (!tree) return '';
  if (tree.type === 'apply') {
    switch (tree.operator.name) {
      case '=>':
        return `(()=>{${tree.args
          .map((x, i) => {
            const res = dfs(x);
            if (res !== undefined && i === tree.args.length - 1) {
              return '\nreturn ' + res.toString().trimStart();
            } else {
              return res;
            }
          })
          .join('')}\n})()`;
      case ':=':
      case '~=': {
        const res = dfs(tree.args[1]);
        if (res !== undefined) {
          vars.add(tree.args[0].name);
          return `void(${tree.args[0].name}=${res})||${tree.args[0].name}\n`;
        }
        break;
      }
      case '=': {
        const res = dfs(tree.args[1]);
        return `void(${tree.args[0].name}=${res})||${tree.args[0].name}\n`;
      }
      case '->': {
        const args = tree.args;
        const body = args.pop();
        const evaluatedBody = dfs(body);
        return `(${args.map(dfs)}) => {\n ${
          body.type === 'apply' || body.type === 'value' ? 'return ' : ' '
        } ${evaluatedBody.trimStart()}\n}\n`;
      }
      case '==':
        return '(' + tree.args.map(dfs).join('===') + ')';
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
        return '(' + tree.args.map(dfs).join(tree.operator.name) + ')';
      case '%':
        return '(' + dfs(tree.args[0]) + '%' + dfs(tree.args[1]) + ')';
      case '**':
        return '(' + dfs(tree.args[0]) + '**' + (dfs(tree.args[1]) || 2) + ')';
      case '!':
        return '!' + dfs(tree.args[0]);
      case '?': {
        const conditionStack = [];
        tree.args.map(dfs).forEach((x, i) => {
          if (i % 2 === 0) {
            conditionStack.push(x, '?');
          } else {
            conditionStack.push(x, ':');
          }
        });
        conditionStack.pop();
        if (conditionStack.length === 3) {
          conditionStack.push(':', 'null\n');
        }
        return `\n${conditionStack.join(' ')}\n`;
      }
      case '*?': {
        const conditionStack = [];
        tree.args.map(dfs).forEach((x, i) => {
          if (i % 2 === 0) {
            conditionStack.push(x, '?');
          } else {
            conditionStack.push(x, ':');
          }
        });
        conditionStack.pop();
        conditionStack.push(':', '0\n');
        return `\n${conditionStack.join(' ')}\n`;
      }
      case '.:':
        return '[' + tree.args.map(dfs).join(',') + ']';
      case '::':
        return (
          '{' +
          tree.args.map(dfs).reduce((acc, item, index) => {
            if (index % 2 === 0) {
              acc += `"${item.replaceAll('"', '')}":`;
            } else {
              acc += `${item},`;
            }
            return acc;
          }, '') +
          '}\n'
        );
      case 'tco': {
        const res = dfs(tree.args[0]);
        // const declaration = res.shift();
        return '_tco(' + res + ')';
      }
      case '<-':
        return '';
      case '...':
        return `_spread([${tree.args.map(dfs).join(',')}])`;
      case '|>': {
        const [param, ...rest] = tree.args.map(dfs);
        return `_pipe(${rest.join(',')})(${param})\n`;
      }
      case ':':
        return `_curry(${tree.args.map(dfs).join(',')})\n`;
      case '.': {
        const prop = [];
        for (let i = 1; i < tree.args.length; i++) {
          const arg = tree.args[i];
          prop.push(
            (arg.type === 'value'
              ? '"' + arg.value?.toString().trim().replaceAll('"', '') + '"'
              : dfs(arg)) ?? null
          );
        }
        const path = prop.map(x => '[' + x + ']').join('');
        return `${dfs(tree.args[0])}${path}\n`;
      }
      case '.-': {
        const prop = [];
        for (let i = 1; i < tree.args.length; i++) {
          const arg = tree.args[i];
          prop.push(
            (arg.type === 'value'
              ? '"' + arg.value?.toString().trim().replaceAll('"', '') + '"'
              : dfs(arg)) ?? null
          );
        }
        const path = prop.map(x => '[' + x + ']').join('');
        const obj = dfs(tree.args[0]);
        return `void(delete ${obj}${path})||${obj}\n`;
      }
      case '.=': {
        const last = tree.args[tree.args.length - 1];
        const res = dfs(last);
        const prop = [];
        for (let i = 1; i < tree.args.length - 1; i++) {
          const arg = tree.args[i];
          prop.push(
            (arg.type === 'value'
              ? '"' + arg.value?.toString().trim().replaceAll('"', '') + '"'
              : dfs(arg)) ?? null
          );
        }

        const path = prop.map(x => '[' + x + ']').join('');
        const obj = dfs(tree.args[0]);
        return `void(${obj}${path}=${res})||${obj}\n`;
      }

      // case '+=': {
      //   const res = tree.args[1] ? dfs(tree.args[1]) : 1;
      //   const variable = dfs(tree.args[0]);
      //   return `void(${variable}+=${res})||${variable}\n`;
      // }

      // case '-=': {
      //   const res = tree.args[1] ? dfs(tree.args[1]) : 1;
      //   const variable = dfs(tree.args[0]);
      //   return `void(${variable}-=${res})||${variable}\n`;
      // }

      // case '*=': {
      //   const res = tree.args[1] ? dfs(tree.args[1]) : 1;
      //   const variable = dfs(tree.args[0]);
      //   return `void(${variable}*=${res})||${variable}\n`;
      // }

      // case '++?': {
      //   const args = tree.args.map(dfs);
      //   return `_while(() => ${args[0]}, () => ${args[1]})`;
      // }

      default: {
        if (tree.operator.name) {
          return (
            tree.operator.name + '(' + tree.args.map(dfs).join(',') + ')\n'
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
                  vars.add(x);
                }
                return `${x} = STD["${imp}"]["${x}"];`;
              })
              .join('');
          } else if (
            tree.operator.operator.name === '.' &&
            tree.type === 'apply'
          ) {
            const [parent, method] = tree.operator.args;
            const arg = tree.args.map(x => dfs(x));
            if (method.type === 'value') {
              return `${parent.name}["${method.value}"](${arg.join(',')})\n`;
            } else {
              return `${parent.name}[${dfs(method)}](${arg.join(',')})\n`;
            }
          }
        }
      }
    }
  } else if (tree.type === 'word') {
    switch (tree.name) {
      case 'void':
      case 'VOID':
        return null;
      case '$*':
        return '_$';
      default:
        return tree.name;
    }
  } else if (tree.type === 'value') {
    return tree.class === 'string' ? `"${tree.value}"` : tree.value;
  }
};

export const compileToJavaScript = ast => {
  vars.clear();
  const program = dfs(ast);
  return { program, vars: [...vars] };
};
